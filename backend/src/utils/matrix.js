/**
 * Matrix Account Provisioning Utility
 *
 * Uses Synapse's shared-secret registration API to create Matrix accounts
 * programmatically without requiring open registration.
 *
 * Reference: https://matrix-org.github.io/synapse/latest/admin_api/register_api.html
 */

const crypto = require('crypto');
const { query } = require('../config/db');

const HOMESERVER_URL = process.env.MATRIX_HOMESERVER_URL;
const SHARED_SECRET  = process.env.MATRIX_SHARED_SECRET;
const MATRIX_DOMAIN  = process.env.MATRIX_DOMAIN;

/**
 * Converts a name to a valid Matrix localpart.
 * "Rebecca Davis" → "rebecca_davis"
 * Spec: https://spec.matrix.org/latest/appendices/#user-identifiers
 */
function toMatrixLocalpart(firstName, lastName) {
  return `${firstName}_${lastName}`
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9._\-]/g, '');
}

/**
 * Returns the full Matrix user ID.
 * "rebecca_davis" → "@rebecca_davis:matrix.calliope.bsd405.org"
 */
function toMatrixUserId(firstName, lastName) {
  return `@${toMatrixLocalpart(firstName, lastName)}:${MATRIX_DOMAIN}`;
}

/**
 * Generates a guaranteed-unique Matrix localpart from a user's name.
 *
 * Checks our own DB to avoid collisions between users with identical names
 * (e.g. two "Rebecca Davis" users).  Appends "_2", "_3", etc. as needed.
 */
async function generateUniqueLocalpart(firstName, lastName) {
  const base = toMatrixLocalpart(firstName, lastName);
  let localpart = base;
  let attempt = 1;

  while (true) {
    const { rows } = await query(
      'SELECT id FROM users WHERE matrix_user_id = $1',
      [`@${localpart}:${MATRIX_DOMAIN}`]
    );

    if (rows.length === 0) return localpart;

    // Collision — append incrementing number
    attempt++;
    localpart = `${base}_${attempt}`;
  }
}

/**
 * Provisions a new Matrix account on the Synapse homeserver.
 * Uses HMAC-SHA1 shared secret registration.
 *
 * Step 1: GET nonce from Synapse
 * Step 2: Compute HMAC-SHA1(nonce + "\0" + username + "\0" + password + "\0" + "notadmin")
 * Step 3: POST registration with nonce + mac
 *
 * Returns: { access_token, user_id, home_server, device_id }
 */
async function provisionMatrixUser(firstName, lastName, displayName) {
  // Fail fast on missing Matrix config so we never compute an HMAC against an empty/undefined shared secret
  if (!HOMESERVER_URL || !SHARED_SECRET || !MATRIX_DOMAIN) {
    throw new Error('Matrix provisioning is not configured (MATRIX_HOMESERVER_URL / MATRIX_SHARED_SECRET / MATRIX_DOMAIN)');
  }
  const localpart = await generateUniqueLocalpart(firstName, lastName);
  // Generate a cryptographically random password — stored in DB, never shown to user
  const matrixPassword = crypto.randomBytes(32).toString('hex');

  // Step 1: Get nonce
  const nonceRes = await fetch(
    `${HOMESERVER_URL}/_synapse/admin/v1/register`,
    { method: 'GET' }
  );
  if (!nonceRes.ok) {
    throw new Error(`Failed to get Synapse nonce: ${nonceRes.status}`);
  }
  const { nonce } = await nonceRes.json();

  // Step 2: Compute HMAC-SHA1 signature
  // Format: nonce + NUL + username + NUL + password + NUL + admin_flag
  const mac = crypto
    .createHmac('sha1', SHARED_SECRET)
    .update(`${nonce}\0${localpart}\0${matrixPassword}\0notadmin`)
    .digest('hex');

  // Step 3: Register the user
  const registerRes = await fetch(
    `${HOMESERVER_URL}/_synapse/admin/v1/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nonce,
        username:    localpart,
        displayname: displayName,
        password:    matrixPassword,
        admin:       false,
        mac,
      }),
    }
  );

  if (!registerRes.ok) {
    const err = await registerRes.json().catch(() => ({}));
    // Since generateUniqueLocalpart ensures the localpart is free in our DB,
    // M_USER_IN_USE at this point means a genuine external collision or race.
    // Throwing allows the caller to register the user without Matrix — no silent failure.
    if (registerRes.status === 400 && err.errcode === 'M_USER_IN_USE') {
      throw new Error('Matrix localpart collision — retry registration');
    }
    throw new Error(`Synapse registration failed: ${err.error} (${err.errcode})`);
  }

  const result = await registerRes.json();
  return {
    matrixUserId:     result.user_id,
    matrixAccessToken: result.access_token,
    matrixDeviceId:   result.device_id,
    matrixPassword,   // store this for token refresh if needed
  };
}

/**
 * Logs in to Matrix to get a fresh access token.
 * Used if a user already exists but their token expired.
 *
 * Matrix login API: https://spec.matrix.org/latest/client-server-api/#post_matrixclientv3login
 */
async function refreshMatrixToken(localpart, password) {
  const loginRes = await fetch(
    `${HOMESERVER_URL}/_matrix/client/v3/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:       'm.login.password',
        identifier: { type: 'm.id.user', user: localpart },
        password,
        device_id:  'CLIO_SERVER',
        initial_device_display_name: 'Clio',
      }),
    }
  );

  if (!loginRes.ok) {
    const err = await loginRes.json();
    throw new Error(`Matrix login failed: ${err.error}`);
  }

  const result = await loginRes.json();
  return {
    matrixUserId:      result.user_id,
    matrixAccessToken: result.access_token,
    matrixDeviceId:    result.device_id,
  };
}

/**
 * Extracts the localpart from a full Matrix user id.
 * "@rebecca_davis:domain" → "rebecca_davis"
 */
function localpartOf(matrixUserId) {
  return matrixUserId.replace(/^@/, '').replace(/:.*$/, '');
}

/**
 * Mints a fresh access token for an existing user via the Synapse admin API,
 * without the user's password and WITHOUT persisting it. This is the
 * server-side actor primitive: the backend can act as any provisioned user
 * (e.g. to create a borrow room on the owner's behalf) regardless of whether
 * that user has a live browser session.
 *
 * Synapse admin endpoint (>= 1.64.0):
 *   POST /_synapse/admin/v1/users/<localpart>/login
 */
async function adminLoginAsUser(localpart) {
  if (!HOMESERVER_URL) {
    throw new Error('MATRIX_HOMESERVER_URL is not configured');
  }
  const adminToken = process.env.MATRIX_ADMIN_TOKEN;
  if (!adminToken) {
    throw new Error('MATRIX_ADMIN_TOKEN is not configured');
  }

  const loginRes = await fetch(
    `${HOMESERVER_URL}/_synapse/admin/v1/users/${encodeURIComponent(localpart)}/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({}),
    }
  );

  if (!loginRes.ok) {
    const err = await loginRes.json().catch(() => ({}));
    throw new Error(
      `Synapse admin login failed for ${localpart}: ${loginRes.status} ${err.error || ''}`
    );
  }

  const data = await loginRes.json();
  return data.access_token;
}

/**
 * Regenerates a Matrix access token for a user via the Synapse admin API and
 * persists it. Used to recover a user whose stored token expired.
 */
async function regenerateMatrixToken(dbUserId) {
  const result = await query(
    'SELECT matrix_user_id, matrix_device_id FROM users WHERE id = $1',
    [dbUserId]
  );
  if (result.rows.length === 0 || !result.rows[0].matrix_user_id) {
    throw new Error('User has no Matrix account');
  }

  const matrixUserId = result.rows[0].matrix_user_id;
  const matrixDeviceId = result.rows[0].matrix_device_id;

  const accessToken = await adminLoginAsUser(localpartOf(matrixUserId));

  await query(
    'UPDATE users SET matrix_access_token = $1 WHERE id = $2',
    [accessToken, dbUserId]
  );

  return {
    matrixAccessToken: accessToken,
    matrixDeviceId,
  };
}

/**
 * Creates a fresh, per-borrow DM room on the server side, acting as the item
 * owner via an admin-minted token. Removes the dependency on the owner's live
 * browser Matrix session (Workstream A1) and gives one room per borrow request
 * (A3). Rooms are intentionally UNENCRYPTED (A4 decision): DMs are not E2EE so
 * reported content can be reviewed and redacted by staff (C4). This is a
 * single-tenant, non-federated homeserver, so E2EE bought little here.
 *
 * Returns the new room_id. Caller is responsible for idempotent persistence
 * (one room per request).
 */
async function createBorrowRoom({ ownerMatrixUserId, borrowerMatrixUserId, name, topic }) {
  if (!HOMESERVER_URL) {
    throw new Error('MATRIX_HOMESERVER_URL is not configured');
  }
  if (!ownerMatrixUserId || !borrowerMatrixUserId) {
    throw new Error('createBorrowRoom requires both owner and borrower Matrix user IDs');
  }

  const ownerToken = await adminLoginAsUser(localpartOf(ownerMatrixUserId));

  const createRes = await fetch(
    `${HOMESERVER_URL}/_matrix/client/v3/createRoom`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        preset: 'trusted_private_chat',
        is_direct: true,
        invite: [borrowerMatrixUserId],
        name,
        topic,
        // NOTE: deliberately no m.room.encryption initial_state — DMs are
        // unencrypted by policy (A4) so moderation/redaction is possible (C4).
      }),
    }
  );

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(
      `Matrix createRoom failed: ${createRes.status} ${err.error || ''} (${err.errcode || ''})`
    );
  }

  const data = await createRes.json();
  return data.room_id;
}

/**
 * Redacts a single message event in a room (Workstream C4 enforcement).
 * Acts as a room member (admin-minted token) so the redaction is authoritative.
 * Requires the actor to be joined to the room (the item owner always is).
 */
async function redactRoomEvent({ roomId, eventId, actorMatrixUserId, reason }) {
  if (!HOMESERVER_URL) {
    throw new Error('MATRIX_HOMESERVER_URL is not configured');
  }
  if (!roomId || !eventId || !actorMatrixUserId) {
    throw new Error('redactRoomEvent requires roomId, eventId and actorMatrixUserId');
  }

  const token = await adminLoginAsUser(localpartOf(actorMatrixUserId));
  const txnId = `clio_redact_${eventId}`;

  const res = await fetch(
    `${HOMESERVER_URL}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/redact/${encodeURIComponent(eventId)}/${encodeURIComponent(txnId)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(reason ? { reason } : {}),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Matrix redact failed: ${res.status} ${err.error || ''}`);
  }

  const data = await res.json();
  return data.event_id;
}

/**
 * Shuts down (and purges) a room via the Synapse admin API — the heavy-hammer
 * takedown for C4. Blocks re-joins and removes the room from the server.
 *
 * Synapse admin endpoint:
 *   POST /_synapse/admin/v1/rooms/<room_id>/delete
 */
async function shutdownRoom(roomId, { reason } = {}) {
  if (!HOMESERVER_URL) {
    throw new Error('MATRIX_HOMESERVER_URL is not configured');
  }
  const adminToken = process.env.MATRIX_ADMIN_TOKEN;
  if (!adminToken) {
    throw new Error('MATRIX_ADMIN_TOKEN is not configured');
  }

  const res = await fetch(
    `${HOMESERVER_URL}/_synapse/admin/v1/rooms/${encodeURIComponent(roomId)}/delete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        block: true,
        purge: true,
        message: reason || 'This conversation was removed by Clio moderation.',
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Matrix room shutdown failed: ${res.status} ${err.error || ''}`);
  }

  return await res.json().catch(() => ({}));
}

module.exports = {
  toMatrixUserId,
  provisionMatrixUser,
  refreshMatrixToken,
  regenerateMatrixToken,
  adminLoginAsUser,
  localpartOf,
  createBorrowRoom,
  redactRoomEvent,
  shutdownRoom,
};
