// Мал клиент за ASP.NET Core API-то. Токенот се чува во localStorage.
const TOKEN_KEY = 'myspace.token';

export const auth = {
  get token() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set(token) { try { localStorage.setItem(TOKEN_KEY, token); } catch { /* приватен режим */ } },
  clear() { try { localStorage.removeItem(TOKEN_KEY); } catch { /* */ } },
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = fn => { onUnauthorized = fn; };

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`;
  const res = await fetch(`/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (res.status === 401 && !path.startsWith('/auth/')) { auth.clear(); onUnauthorized(); throw new Error('Сесијата истече.'); }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error || (data?.errors && Object.values(data.errors).flat()[0]) || 'Нешто тргна наопаку.';
    throw new Error(msg);
  }
  return data;
}

export const api = {
  get: p => request('GET', p),
  post: (p, b) => request('POST', p, b ?? {}),
  put: (p, b) => request('PUT', p, b),
  patch: p => request('PATCH', p),
  del: p => request('DELETE', p),
};
