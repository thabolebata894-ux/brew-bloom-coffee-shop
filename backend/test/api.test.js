const test = require('node:test');
const assert = require('node:assert/strict');

const { startServer } = require('../server.js');

let server;

test.before(async () => {
  server = await startServer(4100);
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});

test('health endpoint is available', async () => {
  const response = await fetch('http://localhost:4100/api/health');
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.status, 'ok');
});

test('menu endpoint returns a list', async () => {
  const response = await fetch('http://localhost:4100/api/menu');
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.ok(Array.isArray(payload));
  assert.ok(payload.every((item) => item.price > 20));
  assert.equal(new Set(payload.map((item) => item.price)).size, payload.length);
  assert.ok(payload.some((item) => item.category === 'Tea'));
});

test('staff can add and delete a tea menu item with a unique ID', async () => {
  const createResponse = await fetch('http://localhost:4100/api/menu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test green tea',
      description: 'A test cup of green tea',
      category: 'Tea',
      price: 26,
      available: true
    })
  });
  assert.equal(createResponse.status, 201);
  const item = await createResponse.json();
  assert.match(item.id, /^menu-[0-9a-f-]{36}$/i);
  assert.equal(item.category, 'Tea');

  const deleteResponse = await fetch(`http://localhost:4100/api/menu/${item.id}`, { method: 'DELETE' });
  assert.equal(deleteResponse.status, 200);
});

test('customers can place orders and staff can update their status', async () => {
  const createResponse = await fetch('http://localhost:4100/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Test customer',
      items: [{ id: 'menu-1', quantity: 2 }]
    })
  });
  assert.equal(createResponse.status, 201);
  const order = await createResponse.json();
  assert.equal(order.customerName, 'Test customer');
  assert.ok(order.tableNumber >= 1);
  assert.match(order.orderNumber, /^\d{4}$/);
  assert.equal(order.subtotal, 76);
  assert.equal(order.status, 'Pending');

  const statusResponse = await fetch(`http://localhost:4100/api/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Preparing' })
  });
  assert.equal(statusResponse.status, 200);
  assert.equal((await statusResponse.json()).status, 'Preparing');

  const releaseResponse = await fetch(`http://localhost:4100/api/tables/${order.tableNumber}/release`, { method: 'PATCH' });
  assert.equal(releaseResponse.status, 200);
  assert.equal((await releaseResponse.json()).status, 'available');
});

test('concurrent orders receive unique tables and short numbers, and full tables reject new orders', async () => {
  const responses = await Promise.all(Array.from({ length: 12 }, (_, index) => fetch('http://localhost:4100/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName: `Guest ${index}`, items: [{ id: 'menu-1', quantity: 1 }] })
  })));
  assert.ok(responses.every((response) => response.status === 201));
  const orders = await Promise.all(responses.map((response) => response.json()));
  assert.equal(new Set(orders.map((order) => order.tableNumber)).size, 12);
  assert.equal(new Set(orders.map((order) => order.orderNumber)).size, 12);
  assert.ok(orders.every((order) => /^\d{4}$/.test(order.orderNumber)));

  const fullResponse = await fetch('http://localhost:4100/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName: 'Waitlisted guest', items: [{ id: 'menu-1', quantity: 1 }] })
  });
  assert.equal(fullResponse.status, 409);

  await Promise.all(orders.map((order) => fetch(`http://localhost:4100/api/tables/${order.tableNumber}/release`, { method: 'PATCH' })));
});

test('cancelling an order releases its assigned table', async () => {
  const createResponse = await fetch('http://localhost:4100/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName: 'Mistaken order', items: [{ id: 'menu-2', quantity: 1 }] })
  });
  const order = await createResponse.json();
  const cancelResponse = await fetch(`http://localhost:4100/api/orders/${order.id}/cancel`, { method: 'PATCH' });
  assert.equal(cancelResponse.status, 200);
  assert.equal((await cancelResponse.json()).status, 'Cancelled');

  const tablesResponse = await fetch('http://localhost:4100/api/tables');
  const tables = await tablesResponse.json();
  assert.equal(tables.find((table) => table.number === order.tableNumber).status, 'available');
});

test('delivery orders require contact and address but do not reserve a table', async () => {
  const beforeTables = await (await fetch('http://localhost:4100/api/tables')).json();
  const occupiedBefore = beforeTables.filter((table) => table.status === 'occupied').length;
  const response = await fetch('http://localhost:4100/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Delivery guest',
      fulfillmentType: 'delivery',
      deliveryPhone: '+27123456789',
      deliveryAddress: '12 Main Street, Maseru',
      deliveryLocation: { latitude: -29.31, longitude: 27.48 },
      items: [{ id: 'menu-1', quantity: 1 }]
    })
  });
  assert.equal(response.status, 201);
  const order = await response.json();
  assert.equal(order.fulfillmentType, 'delivery');
  assert.equal(order.tableNumber, null);
  assert.equal(order.deliveryPhone, '+27123456789');
  assert.equal(order.deliveryAddress, '12 Main Street, Maseru');
  assert.equal(order.deliveryLocation.latitude, -29.31);
  assert.match(order.orderNumber, /^\d{4}$/);

  const afterTables = await (await fetch('http://localhost:4100/api/tables')).json();
  assert.equal(afterTables.filter((table) => table.status === 'occupied').length, occupiedBefore);
});

test('delivery orders reject missing address or phone', async () => {
  const response = await fetch('http://localhost:4100/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Incomplete delivery',
      fulfillmentType: 'delivery',
      items: [{ id: 'menu-1', quantity: 1 }]
    })
  });
  assert.equal(response.status, 400);
});

test('orders reject invalid item quantities', async () => {
  const response = await fetch('http://localhost:4100/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Test customer',
      items: [{ id: 'menu-1', quantity: 0 }]
    })
  });
  assert.equal(response.status, 400);
});
