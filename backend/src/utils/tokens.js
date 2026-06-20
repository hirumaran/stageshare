const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/db');

function generateAccessToken(userId, schoolId, role) {
  return jwt.sign(
    { id: userId, schoolId, role },
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    }
  );
}

// Short-lived proof that an email passed OTP verification. Carries a distinct
// `purpose` claim so it can never be replayed as an access token, and is bound
// to the verified email so it can only complete registration for that address.
function generateEmailVerificationToken(email) {
  return jwt.sign(
    { email: String(email).trim().toLowerCase(), purpose: 'email_verification' },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: process.env.EMAIL_VERIFICATION_EXPIRES_IN || '20m' }
  );
}

// Returns the decoded payload ({ email }) when valid, or null on any failure
// (bad signature, expired, wrong purpose). Never throws.
function verifyEmailVerificationToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!decoded || decoded.purpose !== 'email_verification' || !decoded.email) return null;
    return { email: decoded.email };
  } catch {
    return null;
  }
}

async function generateRefreshToken(userId, deviceInfo = null) {
  // Generate a cryptographically random token
  const rawToken = crypto.randomBytes(64).toString('hex');

  // Store only the hash — never store plaintext refresh tokens
  const tokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await query(
    `INSERT INTO refresh_tokens 
       (user_id, token_hash, expires_at, device_info)
     VALUES ($1, $2, $3, $4)`,
    [userId, tokenHash, expiresAt, deviceInfo]
  );

  return rawToken; // return plaintext to send to client once
}

async function verifyRefreshToken(rawToken) {
  const tokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // First check: is this a valid, non-revoked, non-expired token?
  const { rows } = await query(
    `SELECT rt.*, u.id as user_id, u.school_id, u.role, u.is_active
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1
       AND rt.revoked = FALSE
       AND rt.expires_at > NOW()`,
    [tokenHash]
  );

  if (rows.length > 0) return rows[0];

  // Reuse detection: if the token exists but is revoked, this may be
  // a stolen token replay. Revoke ALL tokens for the owning user.
  const { rows: revokedRows } = await query(
    `SELECT user_id FROM refresh_tokens
     WHERE token_hash = $1
       AND revoked = TRUE`,
    [tokenHash]
  );

  if (revokedRows.length > 0) {
    const userId = revokedRows[0].user_id;
    console.warn(
      `[Auth] Refresh token reuse detected for user ${userId} — revoking all sessions`
    );
    await query(
      `UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`,
      [userId]
    );
  }

  return null;
}

async function revokeRefreshToken(rawToken) {
  const tokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  await query(
    `UPDATE refresh_tokens SET revoked = TRUE 
     WHERE token_hash = $1`,
    [tokenHash]
  );
}

async function revokeAllUserTokens(userId) {
  await query(
    `UPDATE refresh_tokens SET revoked = TRUE 
     WHERE user_id = $1`,
    [userId]
  );
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
};
