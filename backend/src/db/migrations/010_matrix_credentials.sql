-- Add Matrix account fields to users table
-- These are set automatically when a user registers — teachers never see them

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS matrix_user_id    TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS matrix_access_token TEXT,
  ADD COLUMN IF NOT EXISTS matrix_device_id  TEXT;

CREATE INDEX IF NOT EXISTS idx_users_matrix_id ON users(matrix_user_id);

COMMENT ON COLUMN users.matrix_user_id IS
  'Matrix user ID e.g. @rebecca_davis:matrix.skene.bsd405.org';
COMMENT ON COLUMN users.matrix_access_token IS
  'Synapse access token — returned to frontend on login for matrix-js-sdk init';
COMMENT ON COLUMN users.matrix_device_id IS
  'Matrix device ID for E2EE key tracking';
