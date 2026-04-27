const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { provisionMatrixUser } = require('../utils/matrix');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * POST /api/v1/auth/register
 */
async function register(req, res) {
  try {
    const { email, password, firstName, lastName, schoolId } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, firstName, and lastName are required' });
    }

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, school_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, school_id, role, avatar_url, bio, created_at`,
      [email, passwordHash, firstName, lastName, schoolId || null]
    );
    const user = userResult.rows[0];

    // Provision Matrix account (fire-and-forget — don't let Synapse failure block registration)
    let matrixCreds = null;
    try {
      const displayName = `${firstName} ${lastName}`;
      matrixCreds = await provisionMatrixUser(firstName, lastName, displayName);

      await query(
        `UPDATE users
         SET matrix_user_id      = $1,
             matrix_access_token = $2,
             matrix_device_id    = $3
         WHERE id = $4`,
        [
          matrixCreds.matrixUserId,
          matrixCreds.matrixAccessToken,
          matrixCreds.matrixDeviceId,
          user.id,
        ]
      );
    } catch (matrixErr) {
      console.error('[Matrix] Account provisioning failed:', matrixErr.message);
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.status(201).json({
      token,
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
        matrixUserId: matrixCreds?.matrixUserId ?? null,
        matrixAccessToken: matrixCreds?.matrixAccessToken ?? null,
        matrixDeviceId: matrixCreds?.matrixDeviceId ?? null,
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

    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, school_id, role, avatar_url, bio,
              matrix_user_id, matrix_access_token, matrix_device_id
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.status(200).json({
      token,
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

module.exports = { register, login, me };
