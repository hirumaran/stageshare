const { Redis } = require('ioredis');

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is required');
}

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,    // required by BullMQ
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
  // Do not crash — log and continue
});

redis.on('connect', () => {
  console.log('Redis connected');
});

module.exports = { redis };
