/**
 * Platform-agnostic config
 *
 * Web:           reads from Vite env at module init time.
 * React Native:  call setConfig() before any store or API is accessed,
 *                typically at the top of index.js after polyfill imports.
 */

interface AppConfig {
  matrixHomeserverUrl: string
  apiBaseUrl: string
}

let config: AppConfig = {
  matrixHomeserverUrl:
    typeof import.meta !== 'undefined' && (import.meta as any).env
      ? (import.meta as any).env.VITE_MATRIX_HOMESERVER_URL ?? ''
      : '',
  apiBaseUrl:
    typeof import.meta !== 'undefined' && (import.meta as any).env
      ? (import.meta as any).env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
      : 'http://localhost:3000/api/v1',
}

export function setConfig(overrides: Partial<AppConfig>) {
  config = { ...config, ...overrides }
}

export function getConfig(): AppConfig {
  return config
}
