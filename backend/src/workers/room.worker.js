/**
 * Borrow-room creation worker (Workstream A1).
 *
 * Approving a borrow request enqueues a 'create-borrow-room' job on the
 * 'matrix-rooms' queue. This worker creates the chat room server-side (via the
 * Matrix server actor), so room creation no longer depends on the item owner's
 * live browser session, and BullMQ retries make the failure path recoverable by
 * the system rather than only by a human clicking "retry".
 *
 * Semantics:
 *  - One room per borrow request (A3): the job is keyed by request id and the
 *    persist step only writes when matrix_room_id IS NULL, so re-runs/retries
 *    never create a second room for the same request.
 *  - Rooms are unencrypted (A4) — see utils/matrix.createBorrowRoom.
 */

const { Worker } = require('bullmq');
const { redis } = require('../config/redis');
const { createBorrowRoom } = require('../utils/matrix');
const { query } = require('../config/db');

const worker = new Worker(
  'matrix-rooms',
  async (job) => {
    const { requestId } = job.data;

    const { rows } = await query(
      `SELECT br.matrix_room_id,
              i.name AS item_name,
              borrower.matrix_user_id AS borrower_matrix_user_id,
              owner.matrix_user_id    AS owner_matrix_user_id
       FROM borrow_requests br
       JOIN items i        ON br.item_id      = i.id
       JOIN users borrower ON br.requester_id = borrower.id
       JOIN users owner    ON i.added_by      = owner.id
       WHERE br.id = $1`,
      [requestId]
    );

    const row = rows[0];
    if (!row) {
      // Request was deleted; nothing to do.
      console.warn(`[Room] Request ${requestId} not found — skipping room creation`);
      return { skipped: 'request-not-found' };
    }

    // Idempotency: a room already exists for this request.
    if (row.matrix_room_id) {
      return { roomId: row.matrix_room_id, skipped: 'already-set' };
    }

    if (!row.owner_matrix_user_id || !row.borrower_matrix_user_id) {
      // Matrix accounts not provisioned yet — throw so BullMQ retries with backoff
      // until provisioning completes.
      throw new Error(
        `Request ${requestId}: owner/borrower Matrix account not yet provisioned`
      );
    }

    const itemName = row.item_name || 'a resource';
    const roomId = await createBorrowRoom({
      ownerMatrixUserId: row.owner_matrix_user_id,
      borrowerMatrixUserId: row.borrower_matrix_user_id,
      name: `Borrow: ${itemName}`,
      topic: `Clio borrow request #${requestId} — ${itemName}`,
    });

    // Persist only if still unset, so a duplicate/raced job cannot overwrite an
    // existing room id (one room per request).
    const persisted = await query(
      `UPDATE borrow_requests
       SET matrix_room_id = $1, updated_at = NOW()
       WHERE id = $2 AND matrix_room_id IS NULL`,
      [roomId, requestId]
    );

    if (persisted.rowCount === 0) {
      // Another job won the race and set a room id first. Our freshly-created
      // room is an orphan; log it for cleanup. (jobId dedupe makes this rare.)
      console.warn(
        `[Room] Request ${requestId}: room id already set by a concurrent job; orphaned ${roomId}`
      );
      return { roomId, orphaned: true };
    }

    console.log(`[Room] Request ${requestId}: created ${roomId}`);
    return { roomId };
  },
  {
    connection: redis,
    concurrency: 3,
  }
);

worker.on('failed', (job, err) => {
  console.error(
    `[Room] Job ${job?.id} failed for request ${job?.data?.requestId}:`,
    err.message
  );
});

module.exports = { worker };
