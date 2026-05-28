-- Add Matrix room ID to borrow_requests
-- Stored when a DM room is created between borrower and lender for a given request.
-- The frontend creates the room via matrix-js-sdk; this column lets us surface the
-- room ID through the requests API so either party can open the chat thread.

ALTER TABLE borrow_requests
  ADD COLUMN IF NOT EXISTS matrix_room_id VARCHAR(255);
