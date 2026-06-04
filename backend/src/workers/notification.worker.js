const { Worker } = require('bullmq');
const { redis } = require('../config/redis');
const { query } = require('../config/db');
const { sendPushNotification } = require('../config/firebase');

async function dispatchPush(userId, title, body, link) {
  const { rows: tokens } = await query(
    `SELECT token, platform FROM device_tokens WHERE user_id = $1`,
    [userId]
  );

  if (tokens.length === 0) return;

  const results = await Promise.allSettled(
    tokens.map((t) =>
      sendPushNotification(t.token, {
        title,
        body,
        data: { link: link ?? '', platform: t.platform },
      })
    )
  );

  const invalidTokens = tokens.filter(
    (_, i) =>
      results[i].status === 'fulfilled' &&
      results[i].value?.invalidToken === true
  );

  if (invalidTokens.length > 0) {
    await Promise.allSettled(
      invalidTokens.map((t) =>
        query(
          `DELETE FROM device_tokens WHERE user_id = $1 AND token = $2`,
          [userId, t.token]
        )
      )
    );
  }
}

const worker = new Worker(
  'notifications',
  async (job) => {
    const { userId, type, title, body, link } = job.data;

    await query(
      `INSERT INTO notifications (user_id, type, title, body, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, body, link ?? null]
    );

    try {
      await dispatchPush(userId, title, body, link);
    } catch (err) {
      console.error('[Push] Dispatch failed:', err.message);
    }
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
