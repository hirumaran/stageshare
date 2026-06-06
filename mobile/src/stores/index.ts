/**
 * Stores boot module.
 *
 * This file MUST be imported before any consumer of the auth store, the
 * API client, or the config. It performs the platform-specific wiring:
 *
 *   1. Sets the API base URL for the current build.
 *   2. Installs the SecureStore-backed auth storage adapter.
 *
 * Importing `@/stores` (this file) anywhere in the app tree triggers
 * side-effects, so consumers should prefer `import '@/stores'` once at the
 * app root over importing individual files directly.
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { setAuthStorage } from './auth-store';
import { setConfig } from '@/lib/config';
import { secureStoreAdapter } from '@/lib/secure-store';

function getDevServerHost() {
  return Constants.expoConfig?.hostUri?.split(':')[0];
}

function getApiBaseUrl() {
  const configuredUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  if (typeof configuredUrl === 'string' && configuredUrl.length > 0) {
    return configuredUrl;
  }

  if (Platform.OS === 'android' && !Device.isDevice) {
    return 'http://10.0.2.2:3000/api/v1';
  }

  const devServerHost = getDevServerHost();
  if (devServerHost && devServerHost !== 'localhost' && devServerHost !== '127.0.0.1') {
    return `http://${devServerHost}:3000/api/v1`;
  }

  return 'http://localhost:3000/api/v1';
}

// --- Config ----------------------------------------------------------------
// Must run before the auth store hydrates or any API call is made.
console.log('[startup] stores/index.ts loaded');
setConfig({
  matrixHomeserverUrl: '',
  apiBaseUrl: getApiBaseUrl(),
});
console.log('[startup] config set — apiBaseUrl:', getApiBaseUrl());

// --- Storage ---------------------------------------------------------------
if (Platform.OS === 'web') {
  // SecureStore is not available on web. Fall back to window.localStorage
  // so dev-time web previews still work. The mobile build never hits this
  // branch.
  const webStorage = (globalThis as any).window?.localStorage;
  if (webStorage) {
    console.log('[startup] installing web storage adapter');
    setAuthStorage({
      getItem: (k) => webStorage.getItem(k),
      setItem: (k, v) => webStorage.setItem(k, v),
      removeItem: (k) => webStorage.removeItem(k),
    });
  }
} else {
  console.log('[startup] installing SecureStore adapter');
  setAuthStorage(secureStoreAdapter);
}

export { useAuthStore, setAuthStorage } from './auth-store';
