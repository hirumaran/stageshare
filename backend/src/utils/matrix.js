/**
 * Matrix Account Provisioning Utility
 *
 * Uses Synapse's shared-secret registration API to create Matrix accounts
 * programmatically without requiring open registration.
 *
 * Reference: https://matrix-org.github.io/synapse/latest/admin_api/register_api.html
 */

const crypto = require('crypto');

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
 * "rebecca_davis" → "@rebecca_davis:matrix.skene.bsd405.org"
 */
function toMatrixUserId(firstName, lastName) {
  return `@${toMatrixLocalpart(firstName, lastName)}:${MATRIX_DOMAIN}`;
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
  const localpart = toMatrixLocalpart(firstName, lastName);
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
    const err = await registerRes.json();
    // If user already exists (409), attempt to get a fresh access token instead
    if (registerRes.status === 400 && err.errcode === 'M_USER_IN_USE') {
      return await refreshMatrixToken(localpart, matrixPassword);
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
        device_id:  'SKENE_SERVER',
        initial_device_display_name: 'Skene',
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

module.exports = { toMatrixUserId, provisionMatrixUser, refreshMatrixToken };
