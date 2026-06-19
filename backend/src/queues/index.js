const { Queue } = require('bullmq');
const { redis } = require('../config/redis');

const matrixQueue = new Queue('matrix-provisioning', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,  // keep last 100 completed jobs
    removeOnFail: 200,      // keep last 200 failed jobs
  },
});

// Server-side borrow-room creation (Workstream A1). Approving a request enqueues
// a job here so the chat room is created by the server actor with automatic
// retries, rather than depending on the owner's live browser Matrix session.
const roomQueue = new Queue('matrix-rooms', {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

const notificationQueue = new Queue('notifications', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 1000 },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

const cleanupQueue = new Queue('cleanup', { connection: redis });

// Schedule the purge to run every 24 hours.
// BullMQ deduplicates repeating jobs by jobId so this is safe to call on every startup.
cleanupQueue.add(
  'purge-expired-refresh-tokens',
  {},
  { repeat: { every: 24 * 60 * 60 * 1000 } }
).catch((err) => {
  console.error('[Cleanup] Failed to schedule repeating job:', err.message);
});

module.exports = { matrixQueue, roomQueue, notificationQueue, cleanupQueue };
