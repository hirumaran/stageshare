const { createRemoteJWKSet, jwtVerify } = require('jose');

// Thrown when a provider's client ID(s) aren't configured — the controller maps
// this to a 501 so a missing env var reads as "not set up" rather than "rejected".
class OAuthNotConfiguredError extends Error {
  constructor(provider) {
    super(`${provider} sign-in is not configured`);
    this.name = 'OAuthNotConfiguredError';
    this.provider = provider;
  }
}

// Remote JWKS are cached + auto-rotated internally by jose; build once per process.
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const MICROSOFT_JWKS = createRemoteJWKSet(
  new URL('https://login.microsoftonline.com/common/discovery/v2.0/keys')
);

// A native app commonly has several Google client IDs (iOS / Android / Web);
// the id_token `aud` must match one of them. Comma-separated in env.
function googleAudiences() {
  return (process.env.GOOGLE_OAUTH_CLIENT_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function microsoftAudience() {
  return (process.env.MICROSOFT_OAUTH_CLIENT_ID || '').trim();
}

// Microsoft is multi-tenant, so the issuer carries a per-tenant id. We can't pin
// one issuer string; instead verify signature + audience via jose, then assert
// the issuer matches the expected Microsoft v2 shape.
const MS_ISSUER_RE = /^https:\/\/login\.microsoftonline\.com\/[0-9a-f-]+\/v2\.0$/i;

function pickName(payload) {
  const given = payload.given_name;
  const family = payload.family_name;
  if (given || family) {
    return { firstName: given || family || 'Member', lastName: family || given || '' };
  }
  const full = String(payload.name || '').trim();
  if (full) {
    const parts = full.split(/\s+/);
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') || parts[0] };
  }
  return null;
}

/**
 * Verifies a Google/Microsoft OpenID Connect id_token and returns a normalized
 * identity. Throws OAuthNotConfiguredError when the provider isn't set up, or a
 * plain Error when the token is invalid / unusable.
 */
async function verifyOAuthIdToken(provider, idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Missing id_token');
  }

  let email;
  let emailVerified;
  let payload;

  if (provider === 'google') {
    const audiences = googleAudiences();
    if (audiences.length === 0) throw new OAuthNotConfiguredError('Google');

    ({ payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: audiences,
    }));

    email = payload.email;
    emailVerified = payload.email_verified === true || payload.email_verified === 'true';
  } else if (provider === 'microsoft') {
    const audience = microsoftAudience();
    if (!audience) throw new OAuthNotConfiguredError('Microsoft');

    ({ payload } = await jwtVerify(idToken, MICROSOFT_JWKS, { audience }));

    if (!MS_ISSUER_RE.test(String(payload.iss || ''))) {
      throw new Error('Untrusted token issuer');
    }
    // Microsoft work/school + personal accounts: the email is in `email` or, if
    // absent, `preferred_username` (which is the account's email/UPN). Org-owned
    // accounts are treated as verified.
    email = payload.email || payload.preferred_username;
    emailVerified = true;
  } else {
    throw new Error('Unsupported provider');
  }

  email = String(email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw new Error('Token did not include a usable email address');
  }
  if (!emailVerified) {
    throw new Error('Email is not verified with the provider');
  }

  const name = pickName(payload) || { firstName: email.split('@')[0], lastName: '' };

  return {
    email,
    emailVerified: true,
    firstName: name.firstName,
    lastName: name.lastName,
    sub: String(payload.sub || ''),
  };
}

module.exports = { verifyOAuthIdToken, OAuthNotConfiguredError };
