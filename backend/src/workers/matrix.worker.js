const { Worker } = require('bullmq');
const { redis } = require('../config/redis');
const { provisionMatrixUser } = require('../utils/matrix');
const { query } = require('../config/db');
const bcrypt = require('bcryptjs');

const worker = new Worker(
  'matrix-provisioning',
  async (job) => {
    const { userId, firstName, lastName, email } = job.data;

    console.log(`[Matrix] Provisioning user ${userId} (${email})`);

    const displayName = `${firstName} ${lastName}`;
    const matrixCreds = await provisionMatrixUser(firstName, lastName, displayName);

    const matrixPasswordHash = await bcrypt.hash(
      matrixCreds.matrixPassword, 10
    );

    await query(
      `UPDATE users
       SET matrix_user_id = $1,
           matrix_access_token = $2,
           matrix_device_id = $3,
           matrix_password_hash = $4
       WHERE id = $5`,
      [
        matrixCreds.matrixUserId,
        matrixCreds.matrixAccessToken,
        matrixCreds.matrixDeviceId,
        matrixPasswordHash,
        userId,
      ]
    );

    console.log(`[Matrix] Provisioned ${matrixCreds.matrixUserId}`);
    return { matrixUserId: matrixCreds.matrixUserId };
  },
  {
    connection: redis,
    concurrency: 2, // max 2 Matrix provisioning jobs at once
  }
);

worker.on('failed', (job, err) => {
  console.error(
    `[Matrix] Job ${job.id} failed for user ${job.data.userId}:`,
    err.message
  );
});

worker.on('completed', (job) => {
  console.log(
    `[Matrix] Job ${job.id} completed for user ${job.data.userId}`
  );
});

module.exports = { worker };
