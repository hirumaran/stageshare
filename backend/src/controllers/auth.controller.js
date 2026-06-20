const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../config/db');
const { regenerateMatrixToken } = require('../utils/matrix');
const { matrixQueue } = require('../queues');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
} = require('../utils/tokens');
const { sendPasswordResetEmail, sendOtpEmail } = require('../utils/email');
const { verifyOAuthIdToken, OAuthNotConfiguredError } = require('../utils/oauth');
const { writeAuditBestEffort } = require('../utils/audit');
const { recordFailedLogin, recordRegistration } = require('../utils/alerts');

// Per-account login lockout (H2). Complements the IP-keyed loginLimiter: a
// distributed attacker rotating IPs is otherwise unthrottled against a single
// high-value (admin) account. Auto-expiring + generic response so it neither
// leaks account existence nor permanently locks a victim out.
const LOGIN_MAX_FAILED_ATTEMPTS = parseInt(process.env.LOGIN_MAX_FAILED_ATTEMPTS, 10) || 5;
const LOGIN_LOCKOUT_MINUTES = parseInt(process.env.LOGIN_LOCKOUT_MINUTES, 10) || 15;

const normalizeEmail = (email) => String(email).trim().toLowerCase();

// --- Email OTP verification (signup) -------------------------------------
const OTP_TTL_MINUTES = 10;
const OTP_MAX_VERIFY_ATTEMPTS = 5;   // per issued code, before it's burned
const OTP_SEND_WINDOW_MINUTES = 10;  // sliding window for the per-email send cap
const OTP_MAX_SENDS_PER_WINDOW = 3;

// Any well-formed email is accepted (Apple/Google/Outlook/personal/work/.edu) —
// we deliberately do NOT gate on provider so signup flow isn't restricted.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

/**
 * POST /api/v1/auth/register
 */
async function register(req, res) {
  try {
    const { email, password, firstName, lastName, schoolId, emailVerifiedToken } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, firstName, and lastName are required' });
    }

    // Enforce a minimum password length at registration (matches reset-password),
    // so accounts can't be created with trivially weak credentials.
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Normalize email on write (E1b): store and match lowercase so login,
    // forgot-password, and the UNIQUE/lower() index all resolve to one account.
    const normalizedEmail = normalizeEmail(email);

    // Optional email-verification proof (mobile signup sends it; the web flow
    // does not, so this stays backward-compatible). When present it MUST be
    // valid and bound to this exact email; an invalid token is a hard error so
    // a client can't pass a bogus token and look "verified".
    let emailVerified = false;
    if (emailVerifiedToken) {
      const verified = verifyEmailVerificationToken(emailVerifiedToken);
      if (!verified || normalizeEmail(verified.email) !== normalizedEmail) {
        return res.status(400).json({ error: 'Email verification is invalid or expired' });
      }
      emailVerified = true;
    }

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE lower(email) = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Server-verify the tenant: a claimed schoolId must reference an existing active school, and
    // (when the school has a domain configured) the email domain must match it. The JWT tenant
    // claim must derive from a trusted, verified value — never arbitrary client input.
    if (schoolId) {
      const emailDomain = normalizedEmail.split('@')[1] || '';
      const schoolCheck = await query(
        'SELECT id, domain FROM schools WHERE id = $1 AND is_active = TRUE',
        [schoolId]
      );
      const school = schoolCheck.rows[0];
      if (!school) {
        return res.status(400).json({ error: 'Invalid school' });
      }
      if (school.domain && emailDomain !== school.domain.toLowerCase()) {
        return res.status(403).json({ error: 'Email domain does not match the selected school' });
      }
    }

    // Hash password (bcrypt cost 12 — bcrypt.compare reads the cost from each
    // stored hash, so older cost-10 hashes keep verifying).
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, school_id, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, school_id, role, avatar_url, bio, created_at`,
      [normalizedEmail, passwordHash, firstName, lastName, schoolId || null, emailVerified]
    );
    const user = userResult.rows[0];

    // Enqueue Matrix provisioning — runs async, does not block registration.
    // Pass only the user id (no PII in the Redis-persisted payload); a stable
    // jobId dedupes retries/double-submits to a single provisioning job.
    try {
      await matrixQueue.add(
        'provision',
        { userId: user.id },
        { jobId: `provision-${user.id}` }
      );
    } catch (queueErr) {
      console.error('[Matrix] Failed to enqueue provisioning job:', queueErr.message);
    }

    const accessToken = generateAccessToken(user.id, user.school_id, user.role);
    const refreshToken = await generateRefreshToken(
      user.id,
      req.headers['user-agent'] ?? null
    );

    writeAuditBestEffort({
      actorUserId: user.id,
      actorRole: user.role,
      actorSchoolId: user.school_id,
      correlationId: req.id ?? null,
      ip: req.ip ?? null,
      action: 'auth.register',
      targetType: 'user',
      targetId: user.id,
      targetSchoolId: user.school_id,
    });
    // Mass/automated registration abusing async Matrix provisioning (B2).
    recordRegistration(req.ip);

    res.status(201).json({
      token: accessToken,
      refreshToken,
      expiresIn: 15 * 60,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
        schoolId: user.school_id,
        role: user.role,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        matrixUserId: null,
        matrixAccessToken: null,
        matrixDeviceId: null,
      },
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

/**
 * POST /api/v1/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const lookupEmail = normalizeEmail(email); // E1b: case-insensitive lookup

    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, school_id, role, avatar_url, bio,
              matrix_user_id, matrix_access_token, matrix_device_id,
              is_active, failed_login_attempts, locked_until
       FROM users
       WHERE lower(email) = $1`,
      [lookupEmail]
    );
    const user = result.rows[0];

    // Single generic failure path so login never reveals whether the account
    // exists or is locked (anti-enumeration); records the signal for B1/B2.
    const invalid = (reason, userId, schoolId) => {
      recordFailedLogin(req.ip, lookupEmail);
      writeAuditBestEffort({
        actorUserId: userId ?? null,
        actorSchoolId: schoolId ?? null,
        correlationId: req.id ?? null,
        ip: req.ip ?? null,
        action: 'auth.login.failed',
        targetType: 'email',
        metadata: { reason },
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    };

    if (!user) {
      return invalid('unknown_email');
    }

    // Lockout gate (H2): while locked, fail generically WITHOUT checking the
    // password — a correct password during lockout still returns a uniform 401.
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return invalid('locked', user.id, user.school_id);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // Increment the per-account failure counter; lock once it hits threshold.
      await query(
        `UPDATE users
         SET failed_login_attempts = failed_login_attempts + 1,
             locked_until = CASE
               WHEN failed_login_attempts + 1 >= $2
               THEN NOW() + ($3 || ' minutes')::interval
               ELSE locked_until END
         WHERE id = $1`,
        [user.id, LOGIN_MAX_FAILED_ATTEMPTS, String(LOGIN_LOCKOUT_MINUTES)]
      ).catch((err) => console.error('[Auth] login lockout update failed:', err.message));
      return invalid('bad_password', user.id, user.school_id);
    }

    // C1: a deactivated account must not be able to log back in — re-login would
    // otherwise mint fresh app + Matrix tokens and defeat the disable.
    if (user.is_active === false) {
      writeAuditBestEffort({
        actorUserId: user.id,
        actorSchoolId: user.school_id,
        correlationId: req.id ?? null,
        ip: req.ip ?? null,
        action: 'auth.login.denied_deactivated',
        targetType: 'user',
        targetId: user.id,
      });
      return res.status(403).json({ error: 'Account deactivated' });
    }

    // Success: clear the lockout counter and stamp last_login in one write.
    await query(
      'UPDATE users SET last_login = NOW(), failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
      [user.id]
    );

    writeAuditBestEffort({
      actorUserId: user.id,
      actorRole: user.role,
      actorSchoolId: user.school_id,
      correlationId: req.id ?? null,
      ip: req.ip ?? null,
      action: 'auth.login',
      targetType: 'user',
      targetId: user.id,
    });

    const accessToken = generateAccessToken(user.id, user.school_id, user.role);
    const refreshToken = await generateRefreshToken(
      user.id,
      req.headers['user-agent'] ?? null
    );

    res.status(200).json({
      token: accessToken,
      refreshToken,
      expiresIn: 15 * 60,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
        schoolId: user.school_id,
        role: user.role,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        matrixUserId: user.matrix_user_id,
        matrixAccessToken: user.matrix_access_token,
        matrixDeviceId: user.matrix_device_id,
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * POST /api/v1/auth/refresh
 * Token rotation: revoke old refresh token, issue new access + refresh pair.
 * No authenticateToken middleware — the refresh token itself is the credential.
 */
async function refreshToken(req, res) {
  try {
    const { refreshToken: rawToken } = req.body;

    if (!rawToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const tokenRecord = await verifyRefreshToken(rawToken);

    if (!tokenRecord) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    if (!tokenRecord.is_active) {
      return res.status(401).json({ error: 'Account deactivated' });
    }

    // Rotate: revoke old token, issue new pair
    await revokeRefreshToken(rawToken);

    const newAccessToken = generateAccessToken(
      tokenRecord.user_id,
      tokenRecord.school_id,
      tokenRecord.role
    );
    const newRefreshToken = await generateRefreshToken(
      tokenRecord.user_id,
      req.headers['user-agent'] ?? null
    );

    return res.status(200).json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60,
    });
  } catch (err) {
    console.error('[Auth] Refresh error:', err);
    return res.status(500).json({ error: 'Token refresh failed' });
  }
}

/**
 * POST /api/v1/auth/logout
 * Revokes the supplied refresh token. No-ops gracefully if token is absent or already revoked.
 */
async function logout(req, res) {
  try {
    const { refreshToken: rawToken } = req.body;

    if (rawToken) {
      await revokeRefreshToken(rawToken).catch(() => {});
    }

    writeAuditBestEffort({
      correlationId: req.id ?? null,
      ip: req.ip ?? null,
      action: 'auth.logout',
    });

    return res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    console.error('[Auth] Logout error:', err);
    return res.status(500).json({ error: 'Logout failed' });
  }
}

/**
 * GET /api/v1/auth/me
 */
async function me(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `SELECT id, email, first_name, last_name, school_id, role, avatar_url, bio,
              matrix_user_id, matrix_access_token, matrix_device_id
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.status(200).json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      name: `${user.first_name} ${user.last_name}`,
      schoolId: user.school_id,
      role: user.role,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      matrixUserId: user.matrix_user_id,
      matrixAccessToken: user.matrix_access_token,
      matrixDeviceId: user.matrix_device_id,
    });
  } catch (err) {
    console.error('[Auth] Me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

/**
 * GET /api/v1/auth/matrix/refresh
 * Regenerate a Matrix access token via the Synapse admin API.
 * Does not require the Matrix password — uses MATRIX_ADMIN_TOKEN.
 */
async function refreshMatrix(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const creds = await regenerateMatrixToken(userId);

    res.status(200).json({
      matrixAccessToken: creds.matrixAccessToken,
      matrixDeviceId: creds.matrixDeviceId,
    });
  } catch (err) {
    console.error('[Auth] refreshMatrix error:', err);

    if (err.message === 'User has no Matrix account') {
      return res.status(404).json({ error: 'No Matrix account found for this user' });
    }
    if (err.message === 'Account deactivated') {
      // C1: a disabled user cannot mint a fresh Matrix token via the refresh path.
      return res.status(403).json({ error: 'Account deactivated' });
    }

    res.status(500).json({ error: 'Failed to refresh Matrix token' });
  }
}

/**
 * POST /api/v1/auth/forgot-password
 * Always returns 200 — never reveals whether the email exists (anti-enumeration).
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const { rows } = await query(
      `SELECT id FROM users WHERE lower(email) = $1 AND is_active = TRUE`,
      [normalizeEmail(email)]
    );

    if (rows.length > 0) {
      const userId = rows[0].id;
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Invalidate any existing unused reset tokens for this user
      await query(
        `UPDATE password_reset_tokens SET used = TRUE 
         WHERE user_id = $1 AND used = FALSE`,
        [userId]
      );

      await query(
        `INSERT INTO password_reset_tokens 
           (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [userId, tokenHash, expiresAt]
      );

      // Fire and forget — don't block response on email delivery
      sendPasswordResetEmail(email, rawToken).catch((err) => {
        console.error('[Email] Password reset send failed:', err.message);
      });
    }

    // Always same response — no enumeration
    return res.status(200).json({
      message: 'If that email exists, a reset link has been sent.',
    });
  } catch (err) {
    console.error('[Auth] Forgot password error:', err);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}

/**
 * POST /api/v1/auth/reset-password
 */
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'token and newPassword required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters',
      });
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const { rows } = await query(
      `SELECT prt.user_id
       FROM password_reset_tokens prt
       WHERE prt.token_hash = $1
         AND prt.used = FALSE
         AND prt.expires_at > NOW()`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const userId = rows[0].user_id;
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, userId]
    );

    // Mark token as used
    await query(
      `UPDATE password_reset_tokens SET used = TRUE 
       WHERE token_hash = $1`,
      [tokenHash]
    );

    // Revoke all refresh tokens — forces re-login on all devices after reset
    await revokeAllUserTokens(userId).catch(() => {});

    writeAuditBestEffort({
      actorUserId: userId,
      correlationId: req.id ?? null,
      ip: req.ip ?? null,
      action: 'auth.password_reset',
      targetType: 'user',
      targetId: userId,
    });

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('[Auth] Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
}

/**
 * POST /api/v1/auth/send-otp
 * Issues a 6-digit email-verification code for the signup flow.
 * Institutional emails only; per-email send throttle on top of the IP limiter.
 */
async function sendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({
        error: 'Please enter a valid email address.',
        code: 'invalid_email',
      });
    }

    // Per-email send throttle (defends the per-IP limiter against IP rotation).
    const { rows: recent } = await query(
      `SELECT MIN(created_at) AS oldest, COUNT(*)::int AS count
         FROM email_verification_otps
        WHERE lower(email) = $1
          AND created_at > NOW() - ($2 || ' minutes')::interval`,
      [normalizedEmail, String(OTP_SEND_WINDOW_MINUTES)]
    );
    if (recent[0] && recent[0].count >= OTP_MAX_SENDS_PER_WINDOW) {
      const oldest = new Date(recent[0].oldest).getTime();
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldest + OTP_SEND_WINDOW_MINUTES * 60 * 1000 - Date.now()) / 1000)
      );
      return res.status(429).json({
        error: 'Too many codes requested. Please wait before trying again.',
        code: 'rate_limited',
        retryAfterSeconds,
      });
    }

    // Generate a cryptographically random 6-digit code; store only its hash.
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    const codeHash = sha256(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // Overwrite: invalidate any still-active codes for this email so only the
    // newest one verifies (mirrors the password-reset invalidation pattern).
    await query(
      `UPDATE email_verification_otps SET consumed = TRUE
        WHERE lower(email) = $1 AND consumed = FALSE`,
      [normalizedEmail]
    );

    await query(
      `INSERT INTO email_verification_otps (email, code_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [normalizedEmail, codeHash, expiresAt]
    );

    // Send (tolerates missing SMTP in dev). Awaited so a hard send failure
    // surfaces, but a {skipped:true} soft-success does not block signup.
    try {
      await sendOtpEmail(normalizedEmail, code);
    } catch (mailErr) {
      console.error('[Auth] send-otp email failed:', mailErr.message);
    }

    return res.status(200).json({ message: 'A verification code has been sent.' });
  } catch (err) {
    console.error('[Auth] send-otp error:', err);
    return res.status(500).json({ error: 'Failed to send verification code' });
  }
}

/**
 * POST /api/v1/auth/verify-otp
 * Validates a code and returns a short-lived emailVerifiedToken to attach to
 * the subsequent /auth/register call. Distinct error codes per failure mode.
 */
async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const normalizedEmail = normalizeEmail(email);

    const { rows } = await query(
      `SELECT id, code_hash, expires_at, attempts
         FROM email_verification_otps
        WHERE lower(email) = $1 AND consumed = FALSE
        ORDER BY created_at DESC
        LIMIT 1`,
      [normalizedEmail]
    );
    const record = rows[0];

    if (!record) {
      return res.status(400).json({ error: 'No active code. Request a new one.', code: 'invalid_code' });
    }

    if (new Date(record.expires_at) <= new Date()) {
      await query('UPDATE email_verification_otps SET consumed = TRUE WHERE id = $1', [record.id]);
      return res.status(400).json({ error: 'This code has expired. Request a new one.', code: 'expired' });
    }

    const nextAttempts = record.attempts + 1;
    if (nextAttempts > OTP_MAX_VERIFY_ATTEMPTS) {
      await query('UPDATE email_verification_otps SET consumed = TRUE WHERE id = $1', [record.id]);
      return res.status(429).json({ error: 'Too many attempts. Request a new code.', code: 'too_many_attempts' });
    }

    await query('UPDATE email_verification_otps SET attempts = $1 WHERE id = $2', [nextAttempts, record.id]);

    // Constant-time compare on the hashes to avoid leaking timing on the code.
    const provided = sha256(String(otp).trim());
    const matches =
      provided.length === record.code_hash.length &&
      crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(record.code_hash));

    if (!matches) {
      return res.status(400).json({ error: 'Incorrect code.', code: 'invalid_code' });
    }

    // Success: burn the code (single use) and stamp verification time.
    await query(
      'UPDATE email_verification_otps SET consumed = TRUE, verified_at = NOW() WHERE id = $1',
      [record.id]
    );

    const emailVerifiedToken = generateEmailVerificationToken(normalizedEmail);
    return res.status(200).json({ verified: true, emailVerifiedToken });
  } catch (err) {
    console.error('[Auth] verify-otp error:', err);
    return res.status(500).json({ error: 'Failed to verify code' });
  }
}

/**
 * POST /api/v1/auth/oauth
 * Sign in (or auto-register) via a Google/Microsoft OpenID Connect id_token.
 * The mobile client obtains the id_token through expo-auth-session; here we
 * verify it against the provider JWKS and mint Clio's own token pair.
 */
async function oauthLogin(req, res) {
  try {
    const { provider, idToken } = req.body;
    if (!provider || !idToken) {
      return res.status(400).json({ error: 'provider and idToken are required' });
    }
    if (provider !== 'google' && provider !== 'microsoft') {
      return res.status(400).json({ error: 'Unsupported provider' });
    }

    let identity;
    try {
      identity = await verifyOAuthIdToken(provider, idToken);
    } catch (verifyErr) {
      if (verifyErr instanceof OAuthNotConfiguredError) {
        return res.status(501).json({ error: verifyErr.message, code: 'oauth_not_configured' });
      }
      console.warn(`[Auth] oauth ${provider} verify failed:`, verifyErr.message);
      return res.status(401).json({ error: `Could not verify your ${provider} sign-in` });
    }

    const USER_COLUMNS =
      'id, email, first_name, last_name, school_id, role, avatar_url, bio, matrix_user_id, matrix_access_token, matrix_device_id, is_active';

    let user = (await query(
      `SELECT ${USER_COLUMNS} FROM users WHERE lower(email) = $1`,
      [identity.email]
    )).rows[0];

    let created = false;
    if (!user) {
      // OAuth accounts have no usable password; store a random hash so the
      // NOT NULL column is satisfied and the password-login path can never match.
      const randomHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
      try {
        user = (await query(
          `INSERT INTO users (email, password_hash, first_name, last_name, email_verified)
           VALUES ($1, $2, $3, $4, TRUE)
           RETURNING ${USER_COLUMNS}`,
          [identity.email, randomHash, identity.firstName, identity.lastName]
        )).rows[0];
        created = true;
      } catch (insErr) {
        // 23505 = unique_violation: a concurrent request created the account; re-read it.
        if (insErr.code === '23505') {
          user = (await query(
            `SELECT ${USER_COLUMNS} FROM users WHERE lower(email) = $1`,
            [identity.email]
          )).rows[0];
        } else {
          throw insErr;
        }
      }

      if (created && user) {
        try {
          await matrixQueue.add('provision', { userId: user.id }, { jobId: `provision-${user.id}` });
        } catch (queueErr) {
          console.error('[Matrix] Failed to enqueue provisioning job:', queueErr.message);
        }
        recordRegistration(req.ip);
      }
    }

    if (!user) {
      return res.status(500).json({ error: 'Sign-in failed' });
    }

    // C1: a deactivated account must not be able to sign back in via OAuth either.
    if (user.is_active === false) {
      return res.status(403).json({ error: 'Account deactivated' });
    }

    await query(
      'UPDATE users SET last_login = NOW(), failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
      [user.id]
    ).catch((err) => console.error('[Auth] oauth last_login update failed:', err.message));

    const accessToken = generateAccessToken(user.id, user.school_id, user.role);
    const refreshToken = await generateRefreshToken(user.id, req.headers['user-agent'] ?? null);

    writeAuditBestEffort({
      actorUserId: user.id,
      actorRole: user.role,
      actorSchoolId: user.school_id,
      correlationId: req.id ?? null,
      ip: req.ip ?? null,
      action: created ? 'auth.oauth.register' : 'auth.oauth.login',
      targetType: 'user',
      targetId: user.id,
      metadata: { provider },
    });

    return res.status(created ? 201 : 200).json({
      token: accessToken,
      refreshToken,
      expiresIn: 15 * 60,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
        schoolId: user.school_id,
        role: user.role,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        matrixUserId: user.matrix_user_id,
        matrixAccessToken: user.matrix_access_token,
        matrixDeviceId: user.matrix_device_id,
      },
    });
  } catch (err) {
    console.error('[Auth] oauthLogin error:', err);
    return res.status(500).json({ error: 'Sign-in failed' });
  }
}

module.exports = { register, login, refreshToken, logout, me, refreshMatrix, forgotPassword, resetPassword, sendOtp, verifyOtp, oauthLogin };
