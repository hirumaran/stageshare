-- Store a bcrypt hash of the generated Matrix password so tokens can be
-- refreshed without the plaintext password (which is never stored).
-- Token refresh uses the Synapse admin API, not the password.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS matrix_password_hash TEXT;

COMMENT ON COLUMN users.matrix_password_hash IS
  'bcrypt hash of the auto-generated Matrix password — for token refresh via admin API';
