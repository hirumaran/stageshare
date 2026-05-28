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

const notificationQueue = new Queue('notifications', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 1000 },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

module.exports = { matrixQueue, notificationQueue };
