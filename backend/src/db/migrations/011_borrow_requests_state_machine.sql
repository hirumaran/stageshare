-- Migration: Transform borrow_requests for the borrow-request state machine
-- Safe to run repeatedly (idempotent)

DO $$
BEGIN
  -- Rename legacy columns if they still exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'borrow_requests' AND column_name = 'borrower_id'
  ) THEN
    ALTER TABLE borrow_requests RENAME COLUMN borrower_id TO requester_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'borrow_requests' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE borrow_requests RENAME COLUMN start_date TO requested_date;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'borrow_requests' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE borrow_requests RENAME COLUMN end_date TO return_date;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'borrow_requests' AND column_name = 'message'
  ) THEN
    ALTER TABLE borrow_requests RENAME COLUMN message TO requester_note;
  END IF;
END $$;

-- Add state-machine columns (idempotent)
ALTER TABLE borrow_requests
  ADD COLUMN IF NOT EXISTS requester_school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS owner_school_id     INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantity_requested  INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS owner_note          TEXT,
  ADD COLUMN IF NOT EXISTS approved_at         TIMESTAMP,
  ADD COLUMN IF NOT EXISTS picked_up_at        TIMESTAMP,
  ADD COLUMN IF NOT EXISTS returned_at         TIMESTAMP;

-- Ensure status can hold all state-machine values
ALTER TABLE borrow_requests
  ALTER COLUMN status TYPE VARCHAR(50);

-- Indexes for overlap detection and list queries
CREATE INDEX IF NOT EXISTS idx_br_item_status_dates
  ON borrow_requests(item_id, status, requested_date, return_date);

CREATE INDEX IF NOT EXISTS idx_br_owner_school
  ON borrow_requests(owner_school_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_br_requester
  ON borrow_requests(requester_id, created_at DESC);
