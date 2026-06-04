const admin = require('firebase-admin');

let firebaseApp = null;

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    console.warn('[Firebase] Missing credentials — push notifications disabled');
    return null;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[Firebase] Initialized');
  } catch (err) {
    console.error('[Firebase] Init failed:', err.message);
    return null;
  }

  return firebaseApp;
}

async function sendPushNotification(deviceToken, { title, body, data = {} }) {
  const app = getFirebaseApp();
  if (!app) return { skipped: true, reason: 'Firebase not configured' };

  try {
    const result = await admin.messaging(app).send({
      token: deviceToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      android: {
        priority: 'high',
        notification: { sound: 'default' },
      },
    });
    return { success: true, messageId: result };
  } catch (err) {
    if (
      err.code === 'messaging/registration-token-not-registered' ||
      err.code === 'messaging/invalid-registration-token'
    ) {
      return { success: false, invalidToken: true, error: err.code };
    }
    console.error('[Firebase] Send failed:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendPushNotification };
