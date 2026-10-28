const BASE = `${import.meta.env.VITE_API_URL || ''}/api/movies`;

async function call(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const body = await res.json().catch(() => ({ success: false, message: 'Server error' }));
  if (!res.ok || body.success === false) {
    const err = new Error(body.message || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return body;
}

const send = (method, data) => ({ method, body: JSON.stringify(data) });

export const api = {
  list: (params) => call(`${BASE}?${new URLSearchParams(params)}`),
  create: (data) => call(BASE, send('POST', data)),
  update: (id, data) => call(`${BASE}/${id}`, send('PUT', data)),
  changeStatus: (id, data) => call(`${BASE}/${id}/status`, send('PATCH', data)),
  rate: (id, rating) => call(`${BASE}/${id}/rating`, send('PATCH', { rating })),
  remove: (id) => call(`${BASE}/${id}`, { method: 'DELETE' }),
  next: () => call(`${BASE}/watch-next`),
  stats: () => call(`${BASE}/stats`),
};