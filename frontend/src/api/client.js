/**
 * api/client.js
 * =============
 * Centralised API layer.
 */

// If VITE_API_URL is missing (local dev), use relative paths to trigger the Vite Proxy
const BASE = import.meta.env.VITE_API_URL ?? '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Request failed');
  }
  return res.json();
}

export const api = {
  /** GET /salons  — supports ?district=X&service=Y&search=Z&min_rating=N */
  listSalons: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v != null)
    ).toString();
    return request(`/salons${qs ? `?${qs}` : ''}`);
  },

  /** GET /salons/:id */
  getSalon: (id) => request(`/salons/${encodeURIComponent(id)}`),

  /** PATCH /salons/:id  — only the changed fields */
  updateSalon: (id, data) =>
    request(`/salons/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /** GET /salons/districts */
  getDistricts: () => request('/salons/districts'),

  /** GET /salons/services */
  getServices: () => request('/salons/services'),
};