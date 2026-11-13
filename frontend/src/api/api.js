// In development the Vite proxy forwards /api to http://localhost:4000.
// Production builds must talk to the deployed Express API directly, so fall
// back to it whenever VITE_API_URL is not provided at build time.
const PRODUCTION_API_URL = 'https://brew-bloom-backend.onrender.com';
const FALLBACK_API_URL = import.meta.env.PROD ? PRODUCTION_API_URL : '';

const API_URL = (import.meta.env.VITE_API_URL || FALLBACK_API_URL).replace(/\/+$/, '');

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    const text = await response.text();
    let message = text || 'Request failed';
    try {
      message = JSON.parse(text).message || message;
    } catch {
      message = text || 'Request failed';
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  // A page (HTML) instead of JSON means the request never reached the API.
  if (!contentType.includes('application/json')) {
    const body = await response.text();
    if (body.trimStart().startsWith('<')) {
      throw new Error(`The app could not reach the API at ${API_URL || window.location.origin}. Check that the backend is running and that VITE_API_URL points to it.`);
    }
    throw new Error('The API returned an unexpected response.');
  }

  return response.json();
}

export function getMenu() {
  return request('/api/menu');
}

export function addMenuItem(item) {
  return request('/api/menu', {
    method: 'POST',
    body: JSON.stringify(item)
  });
}

export function updateMenuItem(id, item) {
  return request(`/api/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item)
  });
}

export function deleteMenuItem(id) {
  return request(`/api/menu/${id}`, {
    method: 'DELETE'
  });
}

export function getOrders() {
  return request('/api/orders');
}

export function getHealth() {
  return request('/api/health');
}

export function getTables() {
  return request('/api/tables');
}

export function placeOrder(order) {
  return request('/api/orders', {
    method: 'POST',
    body: JSON.stringify(order)
  });
}

export function updateOrderStatus(id, status) {
  return request(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export function cancelOrder(id) {
  return request(`/api/orders/${id}/cancel`, { method: 'PATCH' });
}

export function releaseTable(tableNumber) {
  return request(`/api/tables/${tableNumber}/release`, { method: 'PATCH' });
}
