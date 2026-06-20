-- 028: Email verification OTP (signup flow)
-- Idempotent + additive ONLY. migrate.js re-runs every migration on each run and
-- there is no applied-migrations tracking, so this must be safe to re-apply.
-- Keyed by email (not user_id): the OTP is issued BEFORE the user row exists.

CREATE TABLE IF NOT EXISTS email_verification_otps (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  consumed    BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lookups are always case-insensitive by email (matches the lower(email) pattern
-- used for users), and the send-throttle counts recent rows per email.
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_email
  ON email_verification_otps (lower(email));

CREATE INDEX IF NOT EXISTS idx_email_verification_otps_created_at
  ON email_verification_otps (created_at);

-- Record whether an account's email was verified at registration time.
-- Additive, defaults FALSE so existing rows + the web (no-OTP) flow are unaffected.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
