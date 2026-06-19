-- 024: Age/role signal for adult↔minor safeguarding (Workstream C3) and role
-- hardening (Workstream B5). Re-runnable (migrate.js re-applies every file).
--
-- C1 found the user model is age-blind. `user_type` is the age-assurance signal,
-- intended to be populated by school-roster onboarding (NOT by collecting ID/DOB
-- from minors). 'student' is treated as a minor and gets the most-protective
-- defaults; 'staff' is an adult; 'unknown' means roster data has not been
-- imported yet (the adult↔minor gate is inert for 'unknown' — see runbook).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) NOT NULL DEFAULT 'unknown'
    CHECK (user_type IN ('staff', 'student', 'unknown'));

CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- B5 hardening: constrain `role` to the known vocabulary so an invalid role can
-- never be written. `admin` remains out-of-band only (no app path assigns it).
-- Guarded so the migration is idempotent (no ADD CONSTRAINT IF NOT EXISTS in PG).
-- NOTE (runbook): this validates existing rows; if any user.role is not in
-- ('user','admin') it will fail — audit before deploy.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
  END IF;
END$$;
