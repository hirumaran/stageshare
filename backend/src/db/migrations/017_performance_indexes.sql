-- Migration 017: Performance indexes for common query patterns
-- All indexes use IF NOT EXISTS — safe to run on existing databases.
-- Several query patterns are already partially covered by composite
-- indexes from migrations 011/012; these single-column indexes
-- serve queries that do not include the composite's leading column.

-- Items: most common query patterns
CREATE INDEX IF NOT EXISTS idx_items_school_id
  ON items(school_id);

CREATE INDEX IF NOT EXISTS idx_items_status_active
  ON items(status, is_active);

CREATE INDEX IF NOT EXISTS idx_items_category_id
  ON items(category_id);

-- Borrow requests: core query patterns
CREATE INDEX IF NOT EXISTS idx_requests_requester_id
  ON borrow_requests(requester_id);

CREATE INDEX IF NOT EXISTS idx_requests_owner_school_id
  ON borrow_requests(owner_school_id);

CREATE INDEX IF NOT EXISTS idx_requests_requester_school_id
  ON borrow_requests(requester_school_id);

CREATE INDEX IF NOT EXISTS idx_requests_status
  ON borrow_requests(status);

CREATE INDEX IF NOT EXISTS idx_requests_item_id
  ON borrow_requests(item_id);

-- Notifications: user inbox queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread
  ON notifications(user_id, is_read);

-- Users: school lookup
CREATE INDEX IF NOT EXISTS idx_users_school_id
  ON users(school_id);
