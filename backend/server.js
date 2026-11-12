require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');
const { randomUUID } = require('node:crypto');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: false
  }
});

const memoryStore = {};
let redisAvailable = false;

redisClient.on('error', (err) => {
  console.warn('Redis unavailable; using fallback in-memory store.', err.message);
  redisAvailable = false;
});

const MENU_KEY = 'coffee_shop:menu';
const ORDERS_KEY = 'coffee_shop:orders';
const TABLES_KEY = 'coffee_shop:tables';
const MIN_ITEM_PRICE = 20;
const MENU_CATEGORIES = ['Coffee', 'Tea', 'Pastries', 'Other'];
const TABLE_COUNT = Math.max(1, Number.parseInt(process.env.TABLE_COUNT, 10) || 12);
const tableReminderMinutes = Math.max(1, Number.parseInt(process.env.TABLE_REMINDER_MINUTES, 10) || 20);
let stateChangeQueue = Promise.resolve();

const seedMenu = [
  { id: 'menu-1', name: 'Cappuccino', description: 'Classic espresso with steamed milk foam', category: 'Coffee', price: 38, available: true },
  { id: 'menu-2', name: 'Latte', description: 'Smooth espresso and milk with a silky finish', category: 'Coffee', price: 42, available: true },
  { id: 'menu-3', name: 'Americano', description: 'Espresso diluted with hot water', category: 'Coffee', price: 32, available: true },
  { id: 'menu-4', name: 'Blueberry Muffin', description: 'Fresh baked muffin with blueberries', category: 'Pastries', price: 28, available: true },
  { id: 'menu-5', name: 'Black Tea', description: 'A smooth, freshly brewed cup of black tea', category: 'Tea', price: 25, available: true }
];

const seedTables = Array.from({ length: TABLE_COUNT }, (_, index) => ({
  number: index + 1,
  status: 'available',
  orderId: null,
  occupiedAt: null
}));

function runStateChange(action) {
  const result = stateChangeQueue.then(action, action);
  stateChangeQueue = result.catch(() => {});
  return result;
}

async function ensureDatabase() {
  try {
    await redisClient.connect();
    await redisClient.ping();
    redisAvailable = true;
    const storedMenu = await redisClient.get(MENU_KEY);
    const existingMenu = Array.isArray(parseJson(storedMenu, seedMenu)) ? parseJson(storedMenu, seedMenu) : seedMenu;
    const normalizedMenu = existingMenu.map((item) => ({
      ...item,
      price: Number.isFinite(Number(item.price)) && Number(item.price) >= MIN_ITEM_PRICE
        ? Number(item.price)
        : MIN_ITEM_PRICE
    }));
    if (!storedMenu || JSON.stringify(normalizedMenu) !== storedMenu) {
      await redisClient.set(MENU_KEY, JSON.stringify(normalizedMenu));
    }
    const existingOrders = await redisClient.get(ORDERS_KEY);
    if (!existingOrders) {
      await redisClient.set(ORDERS_KEY, JSON.stringify([]));
    }
    const existingTables = await redisClient.get(TABLES_KEY);
    if (!existingTables) {
      await redisClient.set(TABLES_KEY, JSON.stringify(seedTables));
    }
  } catch (error) {
    redisAvailable = false;
    const existingMenu = Array.isArray(parseJson(memoryStore[MENU_KEY], seedMenu)) ? parseJson(memoryStore[MENU_KEY], seedMenu) : seedMenu;
    memoryStore[MENU_KEY] = JSON.stringify(existingMenu.map((item) => ({
      ...item,
      price: Number.isFinite(Number(item.price)) && Number(item.price) >= MIN_ITEM_PRICE
        ? Number(item.price)
        : MIN_ITEM_PRICE
    })));
    if (!Array.isArray(parseJson(memoryStore[ORDERS_KEY], []))) {
      memoryStore[ORDERS_KEY] = JSON.stringify([]);
    }
    if (!Array.isArray(parseJson(memoryStore[TABLES_KEY], seedTables))) {
      memoryStore[TABLES_KEY] = JSON.stringify(seedTables);
    }
  }
}

function parseJson(data, fallback) {
  try {
    if (data === undefined || data === null || data === '') {
      return fallback;
    }

    const parsed = JSON.parse(data);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback;
    }
    if (!Array.isArray(fallback) && (parsed === null || typeof parsed !== typeof fallback)) {
      return fallback;
    }
    return parsed;
  } catch (error) {
    return fallback;
  }
}

async function readCollection(key, fallback) {
  const value = redisAvailable ? await redisClient.get(key) : memoryStore[key];
  return parseJson(value, fallback);
}

async function writeCollection(key, value) {
  if (redisAvailable) {
    await redisClient.set(key, JSON.stringify(value));
    return;
  }
  memoryStore[key] = JSON.stringify(value);
}

async function writeCollections(collections) {
  if (redisAvailable) {
    const transaction = redisClient.multi();
    for (const [key, value] of Object.entries(collections)) {
      transaction.set(key, JSON.stringify(value));
    }
    await transaction.exec();
    return;
  }

  for (const [key, value] of Object.entries(collections)) {
    memoryStore[key] = JSON.stringify(value);
  }
}

async function nextOrderNumber() {
  const today = new Date().toISOString().slice(0, 10);
  const counterKey = `coffee_shop:order_counter:${today}`;
  let sequence;

  if (redisAvailable) {
    sequence = await redisClient.incr(counterKey);
    if (sequence === 1) {
      await redisClient.expire(counterKey, 172800);
    }
  } else {
    sequence = (Number(memoryStore[counterKey]) || 0) + 1;
    memoryStore[counterKey] = String(sequence);
  }

  if (sequence > 9999) {
    const error = new Error('The daily order number limit has been reached.');
    error.statusCode = 503;
    throw error;
  }

  return String(sequence).padStart(4, '0');
}

app.get('/api/health', async (req, res) => {
  try {
    if (redisAvailable) {
      await redisClient.ping();
    }
    res.json({ status: 'ok', database: redisAvailable ? 'redis' : 'memory', tableReminderMinutes });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Redis unavailable' });
  }
});

app.get('/api/menu', async (req, res) => {
  try {
    const menu = await readCollection(MENU_KEY, seedMenu);
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch menu items' });
  }
});

app.get('/api/menu/:id', async (req, res) => {
  try {
    const menu = await readCollection(MENU_KEY, seedMenu);
    const item = menu.find((entry) => entry.id === req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    return res.json(item);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch menu item' });
  }
});

app.post('/api/menu', async (req, res) => {
  const { name, description, category, price, available } = req.body || {};

  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100
    || (description !== undefined && (typeof description !== 'string' || description.length > 300))
    || (category !== undefined && !MENU_CATEGORIES.includes(category))
    || (available !== undefined && typeof available !== 'boolean')
    || typeof price !== 'number' || !Number.isFinite(price) || price < MIN_ITEM_PRICE) {
    return res.status(400).json({ message: `Valid name, category, and price of at least R${MIN_ITEM_PRICE.toFixed(2)} are required` });
  }

  try {
    const menu = await readCollection(MENU_KEY, seedMenu);
    const item = {
      id: `menu-${randomUUID()}`,
      name: name.trim(),
      description: description || '',
      category: category || 'Coffee',
      price,
      available: available !== undefined ? available : true
    };
    menu.push(item);
    await writeCollection(MENU_KEY, menu);
    return res.status(201).json(item);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create menu item' });
  }
});

app.put('/api/menu/:id', async (req, res) => {
  const { name, description, category, price, available } = req.body || {};
  if ((name !== undefined && (typeof name !== 'string' || !name.trim() || name.trim().length > 100))
    || (description !== undefined && (typeof description !== 'string' || description.length > 300))
    || (category !== undefined && !MENU_CATEGORIES.includes(category))
    || (available !== undefined && typeof available !== 'boolean')
    || (price !== undefined && (typeof price !== 'number' || !Number.isFinite(price) || price < MIN_ITEM_PRICE))) {
    return res.status(400).json({ message: `Valid menu details and a price of at least R${MIN_ITEM_PRICE.toFixed(2)} are required` });
  }

  try {
    const menu = await readCollection(MENU_KEY, seedMenu);
    const index = menu.findIndex((entry) => entry.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    menu[index] = {
      ...menu[index],
      name: name !== undefined ? name.trim() : menu[index].name,
      description: description !== undefined ? description : menu[index].description,
      category: category !== undefined ? category : (menu[index].category || 'Coffee'),
      price: price !== undefined ? price : menu[index].price,
      available: available !== undefined ? available : menu[index].available
    };

    await writeCollection(MENU_KEY, menu);
    return res.json(menu[index]);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update menu item' });
  }
});

app.delete('/api/menu/:id', async (req, res) => {
  try {
    const menu = await readCollection(MENU_KEY, seedMenu);
    const filtered = menu.filter((entry) => entry.id !== req.params.id);
    if (filtered.length === menu.length) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    await writeCollection(MENU_KEY, filtered);
    return res.json({ message: 'Menu item deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete menu item' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await readCollection(ORDERS_KEY, []);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch orders' });
  }
});

app.get('/api/tables', async (req, res) => {
  try {
    const tables = await readCollection(TABLES_KEY, seedTables);
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch tables' });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const orders = await readCollection(ORDERS_KEY, []);
    const order = orders.find((entry) => entry.id === req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch order' });
  }
});

app.post('/api/orders', async (req, res) => {
  const {
    customerName,
    items,
    notes,
    source,
    fulfillmentType = 'dine-in',
    deliveryPhone,
    deliveryAddress,
    deliveryLocation
  } = req.body || {};

  if (!customerName || typeof customerName !== 'string' || !customerName.trim() || customerName.trim().length > 80 || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Customer name and items are required' });
  }
  if (!['dine-in', 'delivery'].includes(fulfillmentType)) {
    return res.status(400).json({ message: 'Choose dine-in or delivery' });
  }
  if (fulfillmentType === 'delivery' && (
    typeof deliveryPhone !== 'string' || deliveryPhone.trim().length < 7 || deliveryPhone.trim().length > 30
    || typeof deliveryAddress !== 'string' || !deliveryAddress.trim() || deliveryAddress.trim().length > 300
  )) {
    return res.status(400).json({ message: 'Delivery orders need a valid phone number and delivery address' });
  }
  const hasDeliveryLocation = fulfillmentType === 'delivery' && deliveryLocation !== undefined && deliveryLocation !== null;
  if (hasDeliveryLocation && (
    typeof deliveryLocation !== 'object' || Array.isArray(deliveryLocation)
    || !Number.isFinite(Number(deliveryLocation.latitude)) || Number(deliveryLocation.latitude) < -90 || Number(deliveryLocation.latitude) > 90
    || !Number.isFinite(Number(deliveryLocation.longitude)) || Number(deliveryLocation.longitude) < -180 || Number(deliveryLocation.longitude) > 180
  )) {
    return res.status(400).json({ message: 'Delivery location coordinates are invalid' });
  }
  if (items.some((item) => !item || typeof item !== 'object' || !item.id || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
    return res.status(400).json({ message: 'Each order item needs an ID and a positive whole-number quantity' });
  }

  runStateChange(async () => {
    const menu = await readCollection(MENU_KEY, seedMenu);
    const orderItems = items.map((item) => {
      const menuItem = menu.find((entry) => entry.id === item.id);
      if (!menuItem || !menuItem.available) {
        const error = new Error(`Menu item ${item.id} is unavailable`);
        error.statusCode = 400;
        throw error;
      }
      return {
        id: menuItem.id,
        name: menuItem.name,
        quantity: Number(item.quantity) || 1,
        price: menuItem.price
      };
    });

    const tables = fulfillmentType === 'dine-in' ? await readCollection(TABLES_KEY, seedTables) : null;
    const table = tables?.find((entry) => entry.status === 'available');
    if (fulfillmentType === 'dine-in' && !table) {
      const error = new Error('All tables are currently occupied. Please ask staff for help.');
      error.statusCode = 409;
      throw error;
    }

    const createdAt = new Date().toISOString();
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = {
      id: `order-${randomUUID()}`,
      orderNumber: await nextOrderNumber(),
      customerName: customerName.trim(),
      fulfillmentType,
      tableNumber: table?.number ?? null,
      deliveryPhone: fulfillmentType === 'delivery' ? deliveryPhone.trim() : null,
      deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress.trim() : null,
      deliveryLocation: fulfillmentType === 'delivery' && deliveryLocation
        ? { latitude: Number(deliveryLocation.latitude), longitude: Number(deliveryLocation.longitude) }
        : null,
      items: orderItems,
      subtotal,
      status: 'Pending',
      notes: notes || '',
      source: source === 'walk-in' ? 'walk-in' : 'online',
      createdAt
    };

    const orders = await readCollection(ORDERS_KEY, []);
    orders.push(order);
    if (table) {
      table.status = 'occupied';
      table.orderId = order.id;
      table.occupiedAt = createdAt;
      await writeCollections({ [ORDERS_KEY]: orders, [TABLES_KEY]: tables });
    } else {
      await writeCollection(ORDERS_KEY, orders);
    }
    return order;
  }).then((order) => {
    res.status(201).json(order);
  }).catch((error) => {
    res.status(error.statusCode || 500).json({ message: error.message || 'Unable to place order' });
  });
});

app.patch('/api/orders/:id/cancel', async (req, res) => {
  runStateChange(async () => {
    const orders = await readCollection(ORDERS_KEY, []);
    const order = orders.find((entry) => entry.id === req.params.id);
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }
    if (order.status === 'Collected') {
      const error = new Error('Collected orders cannot be cancelled');
      error.statusCode = 409;
      throw error;
    }

    order.status = 'Cancelled';
    order.cancelledAt = new Date().toISOString();
    const tables = await readCollection(TABLES_KEY, seedTables);
    const table = tables.find((entry) => entry.orderId === order.id);
    if (table) {
      table.status = 'available';
      table.orderId = null;
      table.occupiedAt = null;
    }
    await writeCollections({ [ORDERS_KEY]: orders, [TABLES_KEY]: tables });
    return order;
  }).then((order) => {
    res.json(order);
  }).catch((error) => {
    res.status(error.statusCode || 500).json({ message: error.message || 'Unable to cancel order' });
  });
});

app.patch('/api/tables/:tableNumber/release', async (req, res) => {
  const tableNumber = Number(req.params.tableNumber);
  if (!Number.isInteger(tableNumber) || tableNumber < 1) {
    return res.status(400).json({ message: 'Table number must be a positive whole number' });
  }

  runStateChange(async () => {
    const tables = await readCollection(TABLES_KEY, seedTables);
    const table = tables.find((entry) => entry.number === tableNumber);
    if (!table) {
      const error = new Error('Table not found');
      error.statusCode = 404;
      throw error;
    }
    if (table.status === 'available') {
      const error = new Error('Table is already available');
      error.statusCode = 409;
      throw error;
    }

    table.status = 'available';
    table.orderId = null;
    table.occupiedAt = null;
    await writeCollection(TABLES_KEY, tables);
    return table;
  }).then((table) => {
    res.json(table);
  }).catch((error) => {
    res.status(error.statusCode || 500).json({ message: error.message || 'Unable to release table' });
  });
});

app.patch('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body || {};
  const validStatuses = ['Pending', 'Preparing', 'Ready', 'Collected'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const orders = await readCollection(ORDERS_KEY, []);
    const index = orders.findIndex((entry) => entry.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (orders[index].status === 'Cancelled') {
      return res.status(409).json({ message: 'Cancelled orders cannot be updated' });
    }

    orders[index].status = status;

    if (status === 'Collected' && orders[index].tableNumber !== null && orders[index].tableNumber !== undefined) {
      const tables = await readCollection(TABLES_KEY, seedTables);
      const table = tables.find((entry) => entry.number === orders[index].tableNumber);
      if (table) {
        table.status = 'available';
        table.orderId = null;
        table.occupiedAt = null;
        await writeCollections({ [ORDERS_KEY]: orders, [TABLES_KEY]: tables });
        return res.json(orders[index]);
      }
    }

    await writeCollection(ORDERS_KEY, orders);
    return res.json(orders[index]);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update order status' });
  }
});

function startServer(port = PORT) {
  return new Promise((resolve) => {
    const server = app.listen(port, async () => {
      await ensureDatabase();
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer().then(() => {
    console.log(`Coffee shop API running on http://localhost:${PORT}`);
  });
}

module.exports = { app, ensureDatabase, redisClient, startServer };
