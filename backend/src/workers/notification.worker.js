const { Worker } = require('bullmq');
const { redis } = require('../config/redis');
const { query } = require('../config/db');

const worker = new Worker(
  'notifications',
  async (job) => {
    const { userId, type, title, body, link } = job.data;

    await query(
      `INSERT INTO notifications (user_id, type, title, body, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, body, link ?? null]
    );
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

worker.on('failed', (job, err) => {
  console.error(
    `[Notification] Job ${job.id} failed for user ${job.data.userId}:`,
    err.message
  );
});

module.exports = { worker };
