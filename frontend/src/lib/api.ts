const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export async function apiFetch(path: string, options: RequestInit = {}) {
  // Deferred import to avoid circular dependency at module load time
  const { useAuthStore } = await import('@/stores/auth-store');
  const token = useAuthStore.getState().token;

  const res = await fetch(BASE_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error ?? 'Request failed');
  }

  // 204 No Content — no body to parse
  if (res.status === 204) return null;

  return res.json();
}
