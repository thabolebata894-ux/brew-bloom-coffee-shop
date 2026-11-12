const API_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

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

  return response.status === 204 ? null : response.json();
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
