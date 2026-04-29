-- Notifications table
-- Stores in-app event notifications for all users.
-- Created by: borrow state machine events, admin actions.
-- Consumed by: notification bell in navbar, notification history page.

CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL
              CHECK (type IN (
                'borrow_request', 'approved', 'rejected', 'cancelled',
                'picked_up', 'returned', 'overdue', 'system'
              )),
  title       VARCHAR(200) NOT NULL,
  body        TEXT,
  link        TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for fast unread count queries (used by navbar bell)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read)
  WHERE is_read = FALSE;

-- Index for full notification history queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);

COMMENT ON TABLE notifications IS
  'In-app event feed. One row per notification per recipient.';
COMMENT ON COLUMN notifications.type IS
  'Event type — drives the icon and color shown in the UI';
COMMENT ON COLUMN notifications.link IS
  'Frontend route the user navigates to when clicking this notification';
