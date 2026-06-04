const { query } = require('../config/db');

async function registerDeviceToken(req, res) {
  const { token, platform } = req.body;
  const userId = req.user.id;

  if (!token || !platform) {
    return res.status(400).json({ error: 'token and platform required' });
  }
  if (!['ios', 'android', 'web'].includes(platform)) {
    return res.status(400).json({ error: 'platform must be ios, android, or web' });
  }

  await query(
    `INSERT INTO device_tokens (user_id, token, platform, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id, token)
     DO UPDATE SET updated_at = NOW(), platform = EXCLUDED.platform`,
    [userId, token, platform]
  );

  return res.status(200).json({ message: 'Device token registered' });
}

async function removeDeviceToken(req, res) {
  const { token } = req.body;
  const userId = req.user.id;

  if (!token) {
    return res.status(400).json({ error: 'token required' });
  }

  await query(
    `DELETE FROM device_tokens WHERE user_id = $1 AND token = $2`,
    [userId, token]
  );

  return res.status(200).json({ message: 'Device token removed' });
}

module.exports = { registerDeviceToken, removeDeviceToken };
