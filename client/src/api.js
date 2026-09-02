const API_URL = import.meta.env.VITE_API_URL || '';
const STORAGE_KEY = 'comparte_viaje_token';

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = localStorage.getItem(STORAGE_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getTrips: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/trips${qs ? `?${qs}` : ''}`);
  },
  getMyTrips: () => request('/trips/mine'),
  getTrip: (id) => request(`/trips/${id}`),
  createTrip: (data) => request('/trips', { method: 'POST', body: JSON.stringify(data) }),
  updateTrip: (id, data) =>
    request(`/trips/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  joinTrip: (id, seats_reserved = 1) =>
    request(`/trips/${id}/join`, { method: 'POST', body: JSON.stringify({ seats_reserved }) }),
  cancelTrip: (id) => request(`/trips/${id}`, { method: 'DELETE' }),
};