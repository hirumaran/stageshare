-- 023: Trust & safety — user blocks and content/user reports
-- Workstream C2 (reporting + blocking) and C4 (enforcement queue).
--
-- These are needed regardless of the user's age model. Blocks prevent future
-- borrow-request / chat pairing between two users. Reports land in a reviewable
-- moderation queue with enough context to act (request, room, message, and the
-- reporter's client-submitted evidence).

-- A directional block: `blocker_id` will not be paired with `blocked_id` for new
-- borrow requests or chat. Enforcement is bidirectional at request time (either
-- side's block prevents pairing) — see request.controller.createRequest.
CREATE TABLE IF NOT EXISTS user_blocks (
  id          SERIAL PRIMARY KEY,
  blocker_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason      TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

-- Reports of a user and/or a specific message. Because DM content is not
-- server-readable as a routine matter, `evidence_text` holds the plaintext /
-- context submitted by the reporter's own device at report time (the content it
-- can already see). `status` models the moderation lifecycle.
CREATE TABLE IF NOT EXISTS reports (
  id                SERIAL PRIMARY KEY,
  reporter_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  request_id        INTEGER REFERENCES borrow_requests(id) ON DELETE SET NULL,
  room_id           VARCHAR(255),
  message_event_id  VARCHAR(255),
  category          VARCHAR(50) NOT NULL,
  reason            TEXT,
  evidence_text     TEXT,
  status            VARCHAR(20) NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'reviewing', 'actioned', 'dismissed')),
  action_taken      VARCHAR(50),
  reviewed_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMP,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_status   ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created  ON reports(created_at DESC);
