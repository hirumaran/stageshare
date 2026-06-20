import { getConfig } from './config';

function getBaseUrl() { return getConfig().apiBaseUrl; }

export async function apiFetch(path: string, options: RequestInit = {}) {
  // Deferred import to avoid circular dependency at module load time
  // (auth-store imports apiFetch, so a top-level import here would be circular)
  const { useAuthStore } = await import('@/stores/auth-store');
  const { token, refreshToken } = useAuthStore.getState();
  const skipsAuthRefresh =
    path === '/auth/login' || path === '/auth/register' || path === '/auth/refresh';

  const makeRequest = async (accessToken: string | null) => {
    return fetch(getBaseUrl() + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
    });
  };

  let res = await makeRequest(skipsAuthRefresh ? null : token);

  // If 401 and we have a refresh token, attempt a single token rotation
  if (!skipsAuthRefresh && res.status === 401 && refreshToken) {
    try {
      const refreshRes = await fetch(getBaseUrl() + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const { token: newToken, refreshToken: newRefreshToken } =
          await refreshRes.json();

        // Persist new token pair in store
        useAuthStore.getState().setTokens(newToken, newRefreshToken);

        // Retry the original request with the new access token
        res = await makeRequest(newToken);
      } else {
        // Refresh rejected — session is dead, force logout
        await useAuthStore.getState().logout();
        throw new Error('Session expired. Please log in again.');
      }
    } catch (refreshErr) {
      if (refreshErr instanceof Error && refreshErr.message === 'Session expired. Please log in again.') {
        throw refreshErr;
      }
      // Network error during refresh — log out and surface a clean message
      await useAuthStore.getState().logout();
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    // Preserve the server's message AND its structured fields so callers can
    // branch on status/code (e.g. OTP expired vs incorrect) instead of string-matching.
    const error = new Error(body.error ?? 'Request failed') as Error & {
      status?: number;
      code?: string;
      retryAfterSeconds?: number;
    };
    error.status = res.status;
    error.code = body.code;
    error.retryAfterSeconds = body.retryAfterSeconds;
    throw error;
  }

  // 204 No Content — no body to parse
  if (res.status === 204) return null;

  return res.json();
}
