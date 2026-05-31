// In production, VITE_API_URL points to the Railway backend (e.g. https://your-api.up.railway.app)
// In dev, the Vite proxy handles /api → localhost:3000
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/admin';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }

  return res.json();
}

// Stats
export const fetchStats = () => request('/stats');

// Conversations
export const fetchConversations = (status) =>
  request(`/conversations${status ? `?status=${status}` : ''}`);

export const fetchConversation = (id) => request(`/conversations/${id}`);

export const sendReply = (id, message) =>
  request(`/conversations/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

// Escalations
export const fetchEscalations = (status) =>
  request(`/escalations${status ? `?status=${status}` : ''}`);

export const resolveEscalation = (id, adminNotes) =>
  request(`/escalations/${id}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify({ adminNotes }),
  });

// Products
export const fetchProducts = () => request('/products');

export const createProduct = (data) =>
  request('/products', { method: 'POST', body: JSON.stringify(data) });

export const updateProduct = (id, data) =>
  request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteProduct = (id) =>
  request(`/products/${id}`, { method: 'DELETE' });
