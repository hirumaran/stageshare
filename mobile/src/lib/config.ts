/**
 * Platform-agnostic config.
 *
 * React Native: there is no Vite / import.meta.env, so values are NOT picked
 * up automatically. Call setConfig() at app startup (before the auth store
 * is imported) with the values appropriate for the build (dev / staging /
 * prod). See src/stores/index.ts for the boot wiring.
 */

export interface OAuthConfig {
  // Google needs a platform-specific client ID (the iOS/Android OAuth clients
  // have different redirect handling). Web client ID is used as the audience
  // and on the web build.
  googleIosClientId?: string
  googleAndroidClientId?: string
  googleWebClientId?: string
  // Azure AD app (single client ID across platforms; public/native client).
  microsoftClientId?: string
}

export interface AppConfig {
  matrixHomeserverUrl: string
  apiBaseUrl: string
  oauth: OAuthConfig
}

let config: AppConfig = {
  matrixHomeserverUrl: '',
  apiBaseUrl: 'http://localhost:3000/api/v1',
  oauth: {},
}

export function setConfig(overrides: Partial<AppConfig>) {
  config = { ...config, ...overrides }
}

export function getConfig(): AppConfig {
  return config
}
