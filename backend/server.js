const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "https://res.cloudinary.com", "https://images.unsplash.com", "data:"],
      connectSrc: ["'self'", process.env.MATRIX_HOMESERVER_URL ?? ''],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  })
);
app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1', routes);

// Start background workers
// TODO Phase 5: move workers to separate process with PM2
require('./src/workers/matrix.worker');
require('./src/workers/room.worker');
require('./src/workers/notification.worker');
require('./src/workers/cleanup.worker');
console.log('[Workers] Matrix, room, notification, and cleanup workers started');

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

const gracefulShutdown = (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
