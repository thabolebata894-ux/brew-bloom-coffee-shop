import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addMenuItem,
  cancelOrder,
  deleteMenuItem,
  getHealth,
  getMenu,
  getOrders,
  getTables,
  placeOrder,
  releaseTable,
  updateMenuItem,
  updateOrderStatus
} from '../api/api';
import { BrandMark } from '../components/HeroSection';

const statuses = ['Pending', 'Preparing', 'Ready', 'Collected'];
const categories = ['Coffee', 'Tea', 'Pastries', 'Other'];
const blankItem = { name: '', description: '', category: 'Coffee', price: '', available: true };
const money = (value) => `R${Number(value || 0).toFixed(2)}`;
const tableCheckAfterMs = 20 * 60 * 1000;

function inferCategory(item) {
  const text = `${item.name} ${item.description}`.toLowerCase();
  if (/\b(tea|matcha|chai|earl grey)\b/.test(text)) return 'Tea';
  if (/\b(muffin|cake|cookie|croissant|pastr|brownie|scone)\b/.test(text)) return 'Pastries';
  return 'Coffee';
}

function getErrorMessage(error, fallback) {
  try {
    const body = JSON.parse(error.message);
    return body.message || fallback;
  } catch {
    return error.message || fallback;
  }
}

function MenuEditor({ item, onSave, onCancel, saving }) {
  const [form, setForm] = useState(item ? { ...item, price: String(item.price) } : blankItem);

  useEffect(() => {
    setForm(item ? { ...item, category: item.category || 'Coffee', price: String(item.price) } : blankItem);
  }, [item]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    const price = Number(form.price);
    if (!form.name.trim() || !Number.isFinite(price) || price < 20) return;
    onSave({ ...form, name: form.name.trim(), price });
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-ember-line bg-ember-charcoal/70 p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[.22em] text-ember-copper">{item ? 'Refine the recipe' : 'Add to the counter'}</p>
          <h3 className="mt-1 font-display text-xl">{item ? 'Edit menu item' : 'New menu item'}</h3>
        </div>
        {item && <button type="button" onClick={onCancel} className="bg-transparent p-1 text-sm text-ember-muted transition hover:text-ember-ivory">Cancel</button>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-ember-gold sm:col-span-2">Name
          <input required maxLength={100} value={form.name} onChange={(event) => update('name', event.target.value)} className="mt-2 w-full rounded-lg border border-ember-line bg-ember-charcoal px-3 py-3 text-sm text-ember-ivory outline-none focus:border-ember-copper" placeholder="e.g. Brew & Bloom flat white" />
        </label>
        <label className="text-xs font-semibold text-ember-gold sm:col-span-2">Description
          <textarea rows="2" maxLength={300} value={form.description} onChange={(event) => update('description', event.target.value)} className="mt-2 w-full resize-y rounded-lg border border-ember-line bg-ember-charcoal px-3 py-3 text-sm text-ember-ivory outline-none focus:border-ember-copper" placeholder="A short note for the menu" />
        </label>
        <label className="text-xs font-semibold text-ember-gold">Category
          <select value={form.category} onChange={(event) => update('category', event.target.value)} className="mt-2 w-full rounded-lg border border-ember-line bg-ember-charcoal px-3 py-3 text-sm text-ember-ivory outline-none focus:border-ember-copper">
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-ember-gold">Price (R)
          <input required type="number" min="20" step="0.01" value={form.price} onChange={(event) => update('price', event.target.value)} className="mt-2 w-full rounded-lg border border-ember-line bg-ember-charcoal px-3 py-3 text-sm text-ember-ivory outline-none focus:border-ember-copper" placeholder="20.00" />
        </label>
      </div>
      <label className="mt-4 flex cursor-pointer items-center gap-3 text-xs text-ember-muted">
        <input type="checkbox" checked={form.available} onChange={(event) => update('available', event.target.checked)} className="h-4 w-4 accent-ember-copper" />
        In stock and visible to customers
      </label>
      <button disabled={saving} className="mt-5 w-full rounded-xl bg-ember-copper px-5 py-3 text-sm font-bold text-ember-charcoal transition hover:scale-[1.01] hover:bg-ember-gold disabled:cursor-wait disabled:opacity-60">{saving ? 'Saving…' : item ? 'Save changes' : 'Add item to menu'}</button>
    </form>
  );
}

export default function StaffDashboard({ onLogout }) {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [tableReminderMinutes, setTableReminderMinutes] = useState(20);
  const [activeTab, setActiveTab] = useState('orders');
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInFulfillment, setWalkInFulfillment] = useState('dine-in');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInAddress, setWalkInAddress] = useState('');
  const [walkInQuantities, setWalkInQuantities] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyItem, setBusyItem] = useState('');
  const [busyOrder, setBusyOrder] = useState('');
  const [busyTable, setBusyTable] = useState(0);
  const [savingWalkIn, setSavingWalkIn] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [menuItems, orderItems, tableItems, health] = await Promise.all([getMenu(), getOrders(), getTables(), getHealth()]);
      setMenu(menuItems.map((item) => ({ ...item, category: item.category || inferCategory(item) })));
      setOrders(orderItems);
      setTables(tableItems);
      setTableReminderMinutes(health.tableReminderMinutes || 20);
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not load the POS data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const intervalId = window.setInterval(loadData, 30000);
    return () => window.clearInterval(intervalId);
  }, [loadData]);

  const todaysRevenue = useMemo(() => {
    const today = new Date().toDateString();
    return orders
      .filter((order) => order.status !== 'Cancelled' && order.createdAt && new Date(order.createdAt).toDateString() === today)
      .reduce((sum, order) => sum + Number(order.subtotal || 0), 0);
  }, [orders]);
  const visibleOrders = orders.filter((order) => order.status !== 'Cancelled');
  const openOrders = visibleOrders.filter((order) => order.status !== 'Collected').length;
  const availableItems = menu.filter((item) => item.available).length;
  const availableTables = tables.filter((table) => table.status === 'available').length;

  const saveItem = async (item) => {
    setSaving(true);
    setError('');
    try {
      const saved = editingItem
        ? await updateMenuItem(editingItem.id, item)
        : await addMenuItem(item);
      setMenu((current) => editingItem
        ? current.map((entry) => entry.id === saved.id ? saved : entry)
        : [...current, saved]);
      setEditingItem(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to save that menu item.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (item) => {
    setBusyItem(item.id);
    setError('');
    try {
      const updated = await updateMenuItem(item.id, { ...item, available: !item.available });
      setMenu((current) => current.map((entry) => entry.id === item.id ? updated : entry));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to update item availability.'));
    } finally {
      setBusyItem('');
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm(`Remove ${item.name} from the menu?`)) return;
    setBusyItem(item.id);
    setError('');
    try {
      await deleteMenuItem(item.id);
      setMenu((current) => current.filter((entry) => entry.id !== item.id));
      if (editingItem?.id === item.id) setEditingItem(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to delete that menu item.'));
    } finally {
      setBusyItem('');
    }
  };

  const moveOrder = async (order) => {
    const currentIndex = statuses.indexOf(order.status);
    const nextStatus = statuses[currentIndex + 1];
    if (!nextStatus) return;
    setBusyOrder(order.id);
    setError('');
    try {
      const updated = await updateOrderStatus(order.id, nextStatus);
      setOrders((current) => current.map((entry) => entry.id === order.id ? updated : entry));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to advance this order.'));
    } finally {
      setBusyOrder('');
    }
  };

  const clearTable = async (table) => {
    setBusyTable(table.number);
    setError('');
    try {
      const updated = await releaseTable(table.number);
      setTables((current) => current.map((entry) => entry.number === updated.number ? updated : entry));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to release this table.'));
    } finally {
      setBusyTable(0);
    }
  };

  const cancelTicket = async (order) => {
    setBusyOrder(order.id);
    setError('');
    try {
      const updated = await cancelOrder(order.id);
      setOrders((current) => current.map((entry) => entry.id === order.id ? updated : entry));
      setTables((current) => current.map((table) => table.orderId === order.id
        ? { ...table, status: 'available', orderId: null, occupiedAt: null }
        : table));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to cancel this order.'));
    } finally {
      setBusyOrder('');
    }
  };

  const submitWalkIn = async (event) => {
    event.preventDefault();
    const items = menu
      .filter((item) => item.available && Number(walkInQuantities[item.id]) > 0)
      .map((item) => ({ id: item.id, quantity: Number(walkInQuantities[item.id]) }));
    if (!walkInName.trim() || items.length === 0) {
      setError('Enter the customer name and select at least one item.');
      return;
    }

    setSavingWalkIn(true);
    setError('');
    try {
      const order = await placeOrder({
        customerName: walkInName.trim(),
        items,
        source: 'walk-in',
        fulfillmentType: walkInFulfillment,
        ...(walkInFulfillment === 'delivery' ? { deliveryPhone: walkInPhone.trim(), deliveryAddress: walkInAddress.trim() } : {})
      });
      setOrders((current) => [...current, order]);
      setTables((current) => current.map((table) => order.tableNumber && table.number === order.tableNumber
        ? { ...table, status: 'occupied', orderId: order.id, occupiedAt: order.createdAt }
        : table));
      setWalkInName('');
      setWalkInPhone('');
      setWalkInAddress('');
      setWalkInFulfillment('dine-in');
      setWalkInQuantities({});
      setWalkInOpen(false);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to record this walk-in order.'));
    } finally {
      setSavingWalkIn(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-76px)] bg-ember-charcoal px-4 py-8 text-ember-ivory sm:px-7 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col justify-between gap-6 border-b border-ember-line pb-7 sm:flex-row sm:items-end">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-ember-line bg-ember-panel"><BrandMark className="h-9 w-9 text-ember-copper" /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.27em] text-ember-copper">Brew &amp; Bloom · Point of sale</p>
              <h1 className="mt-1 font-display text-3xl sm:text-4xl">The pass.</h1>
              <p className="mt-1 text-xs text-ember-muted">Your service overview and daily operations.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={loadData} className="rounded-full border border-ember-line bg-transparent px-4 py-2.5 text-xs font-semibold text-ember-muted transition hover:border-ember-copper hover:text-ember-ivory">↻ Refresh</button>
            <button type="button" onClick={onLogout} className="rounded-full border border-ember-line bg-transparent px-4 py-2.5 text-xs font-semibold text-ember-muted transition hover:border-ember-copper hover:text-ember-ivory">Exit POS</button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Revenue today', value: money(todaysRevenue), detail: 'Orders placed today' },
            { label: 'Open orders', value: String(openOrders).padStart(2, '0'), detail: 'Not yet collected' },
            { label: 'Available tables', value: `${availableTables} / ${tables.length}`, detail: 'Ready for guests' },
            { label: 'Menu in stock', value: `${availableItems} / ${menu.length}`, detail: 'Available items' }
          ].map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-ember-line bg-ember-panel p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-ember-muted">{metric.label}</p>
              <p className="mt-3 font-display text-3xl text-ember-gold">{metric.value}</p>
              <p className="mt-1 text-xs text-ember-muted/75">{metric.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex rounded-full border border-ember-line bg-ember-panel p-1" role="tablist" aria-label="Staff dashboard views">
            {[
              { id: 'orders', label: 'Live orders' },
              { id: 'menu', label: 'Menu management' }
            ].map((tab) => (
              <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-full px-5 py-2.5 text-xs font-semibold transition ${activeTab === tab.id ? 'bg-[#C85A38] text-white' : 'bg-transparent text-ember-muted hover:text-ember-ivory'}`}>{tab.label}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {activeTab === 'orders' && <button type="button" onClick={() => setWalkInOpen((open) => !open)} className="rounded-full bg-[#C85A38] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#D95D39]">{walkInOpen ? 'Close walk-in form' : 'Record walk-in +'}</button>}
            <p className="text-[10px] text-ember-muted">Auto-refresh · last synced {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {error && <div role="alert" className="mt-5 rounded-xl border border-red-900/70 bg-red-950/20 px-4 py-3 text-sm text-red-200">{error}</div>}
        {activeTab === 'orders' && walkInOpen && (
          <form onSubmit={submitWalkIn} className="mt-6 rounded-2xl border border-ember-line bg-ember-panel p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-[9px] font-bold uppercase tracking-[.22em] text-ember-copper">Counter service</p><h2 className="mt-1 font-display text-2xl">Record a walk-in</h2></div>
              <p className="text-xs text-ember-muted">{walkInFulfillment === 'delivery' ? 'Record a phone number and address for the driver.' : 'The system assigns a free table and ticket number.'}</p>
            </div>
            <fieldset className="mb-5">
              <legend className="mb-2 block text-xs font-semibold text-ember-gold">Order type</legend>
              <div className="grid max-w-sm grid-cols-2 rounded-xl border border-ember-line bg-ember-charcoal p-1">
                {[
                  { value: 'dine-in', label: 'Dine in' },
                  { value: 'delivery', label: 'Delivery' }
                ].map((option) => (
                  <button key={option.value} type="button" aria-pressed={walkInFulfillment === option.value} onClick={() => setWalkInFulfillment(option.value)} className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition ${walkInFulfillment === option.value ? 'bg-ember-copper text-ember-charcoal' : 'bg-transparent text-ember-muted hover:text-ember-ivory'}`}>{option.label}</button>
                ))}
              </div>
            </fieldset>
            <label htmlFor="walk-in-name" className="mb-2 block text-xs font-semibold text-ember-gold">Customer name</label>
            <input id="walk-in-name" required maxLength={80} value={walkInName} onChange={(event) => setWalkInName(event.target.value)} className="mb-5 w-full max-w-sm rounded-lg border border-ember-line bg-ember-charcoal px-3 py-3 text-sm text-ember-ivory outline-none focus:border-ember-copper" placeholder="Name for the order" />
            {walkInFulfillment === 'delivery' && (
              <div className="mb-5 grid gap-4 sm:grid-cols-2">
                <label htmlFor="walk-in-phone" className="block text-xs font-semibold text-ember-gold">Phone number
                  <input id="walk-in-phone" type="tel" required minLength={7} maxLength={30} value={walkInPhone} onChange={(event) => setWalkInPhone(event.target.value)} className="mt-2 w-full rounded-lg border border-ember-line bg-ember-charcoal px-3 py-3 text-sm text-ember-ivory outline-none focus:border-ember-copper" placeholder="Driver contact number" />
                </label>
                <label htmlFor="walk-in-address" className="block text-xs font-semibold text-ember-gold">Delivery address
                  <textarea id="walk-in-address" required maxLength={300} rows="2" value={walkInAddress} onChange={(event) => setWalkInAddress(event.target.value)} className="mt-2 w-full resize-y rounded-lg border border-ember-line bg-ember-charcoal px-3 py-3 text-sm text-ember-ivory outline-none focus:border-ember-copper" placeholder="Street, area, house or apartment" />
                </label>
              </div>
            )}
            <div className="divide-y divide-ember-line border-y border-ember-line">
              {menu.filter((item) => item.available).map((item) => (
                <label key={item.id} htmlFor={`walk-in-${item.id}`} className="flex items-center justify-between gap-4 py-3">
                  <span className="min-w-0"><span className="block truncate text-sm">{item.name}</span><span className="text-xs text-ember-muted">{money(item.price)}</span></span>
                  <input id={`walk-in-${item.id}`} type="number" min="0" max="99" step="1" value={walkInQuantities[item.id] || ''} onChange={(event) => setWalkInQuantities((current) => ({ ...current, [item.id]: event.target.value }))} aria-label={`${item.name} quantity`} placeholder="0" className="w-20 rounded-lg border border-ember-line bg-ember-charcoal px-3 py-2 text-center text-sm text-ember-ivory outline-none focus:border-ember-copper" />
                </label>
              ))}
            </div>
            <button type="submit" disabled={savingWalkIn} className="mt-5 rounded-full bg-ember-copper px-5 py-3 text-sm font-bold text-ember-charcoal transition hover:bg-ember-gold disabled:opacity-50">{savingWalkIn ? 'Sending…' : 'Place walk-in order'}</button>
          </form>
        )}
        {loading ? (
          <p role="status" className="mt-10 text-sm text-ember-muted">Connecting to the counter…</p>
        ) : activeTab === 'orders' ? (
          <section className="mt-6">
            <div className="mb-4 flex items-end justify-between">
              <div><h2 className="font-display text-2xl">Table status</h2></div>
              <span className="hidden text-[10px] uppercase tracking-[.18em] text-ember-muted sm:block">{availableTables} tables available</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tables.map((table) => {
                const occupied = table.status === 'occupied';
                const occupiedMinutes = occupied && table.occupiedAt ? Math.max(0, Math.floor((Date.now() - new Date(table.occupiedAt).getTime()) / 60000)) : 0;
                const checkDue = occupiedMinutes >= tableReminderMinutes;
                return (
                  <article key={table.number} className={`rounded-xl border p-4 ${checkDue ? 'border-amber-500/60 bg-amber-950/20' : 'border-ember-line bg-ember-panel'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-lg">Table {table.number}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${occupied ? 'bg-amber-300/10 text-amber-300' : 'bg-[#2A4B3C]/10 text-[#2A4B3C]'}`}>{occupied ? 'Occupied' : 'Available'}</span>
                    </div>
                    <p className="mt-2 text-xs text-ember-muted">{occupied ? `${occupiedMinutes} min occupied` : 'Ready for guests'}</p>
                    {occupied && checkDue && <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-amber-300">Check this table</p>}
                    {occupied && <button type="button" disabled={busyTable === table.number} onClick={() => clearTable(table)} className="mt-3 rounded-full border border-ember-line px-3 py-2 text-[10px] font-semibold text-ember-ivory transition hover:border-ember-gold hover:text-ember-gold disabled:opacity-50">{busyTable === table.number ? 'Updating…' : 'Mark table free'}</button>}
                  </article>
                );
              })}
            </div>
            <div className="mb-4 mt-9 flex items-end justify-between">
              <div><h2 className="font-display text-2xl">Service board</h2><p className="mt-1 text-xs text-ember-muted">Move each ticket forward as it makes its way to the guest.</p></div>
              <span className="hidden text-[10px] uppercase tracking-[.18em] text-ember-muted sm:block">{visibleOrders.length} total tickets</span>
            </div>
            <div className="grid gap-3 overflow-x-auto pb-3 md:grid-cols-2 xl:grid-cols-4">
              {statuses.map((status, statusIndex) => {
                const stageOrders = visibleOrders.filter((order) => order.status === status);
                return (
                  <section key={status} className="min-w-[255px] rounded-2xl border border-ember-line bg-ember-panel/70 p-3">
                    <div className="mb-3 flex items-center justify-between px-1 py-1">
                      <h3 className="text-xs font-bold uppercase tracking-[.16em]">{status}</h3>
                      <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[10px] font-bold ${statusIndex === 0 ? 'bg-amber-400/15 text-amber-300' : statusIndex === 1 ? 'bg-ember-copper/15 text-ember-copper' : statusIndex === 2 ? 'bg-ember-gold/15 text-ember-gold' : 'bg-ember-line text-ember-muted'}`}>{stageOrders.length}</span>
                    </div>
                    <div className="space-y-3">
                      {stageOrders.length === 0 && <p className="rounded-xl border border-dashed border-ember-line p-5 text-center text-xs text-ember-muted/70">No tickets here.</p>}
                      {stageOrders.map((order) => (
                        <article key={order.id} className="rounded-xl border border-ember-line bg-ember-charcoal p-4 transition hover:border-ember-copper/40">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-[.13em] text-ember-copper">#{order.orderNumber || order.id}</span>
                            <span className="text-[10px] text-ember-muted">{order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                          </div>
                          <h4 className="mt-2 font-display text-lg">{order.customerName}</h4>
                          {order.fulfillmentType === 'delivery' ? (
                            <div className="mt-1 space-y-1 text-[11px] text-ember-muted">
                              <p className="font-semibold uppercase tracking-wide text-ember-gold">Delivery</p>
                              <p>{order.deliveryAddress}</p>
                              <a href={`tel:${order.deliveryPhone}`} className="inline-block text-ember-copper underline underline-offset-2">{order.deliveryPhone}</a>
                              {order.deliveryLocation && <a href={`https://www.google.com/maps?q=${order.deliveryLocation.latitude},${order.deliveryLocation.longitude}`} target="_blank" rel="noreferrer" className="ml-3 inline-block text-ember-copper underline underline-offset-2">Open map</a>}
                            </div>
                          ) : <p className="text-[11px] text-ember-muted">Table {order.tableNumber}</p>}
                          <ul className="my-3 space-y-1.5 border-y border-ember-line py-3">
                            {(order.items || []).map((item) => <li key={item.id} className="flex justify-between gap-2 text-xs"><span className="text-ember-muted">{item.quantity} × {item.name}</span><span>{money(item.quantity * item.price)}</span></li>)}
                          </ul>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-ember-gold">{money(order.subtotal)}</span>
                            {statusIndex < statuses.length - 1 && <div className="flex flex-wrap gap-2"><button type="button" disabled={busyOrder === order.id} onClick={() => moveOrder(order)} className="rounded-full bg-ember-raised px-3 py-2 text-[10px] font-bold text-ember-ivory transition hover:bg-ember-copper hover:text-ember-charcoal disabled:opacity-50">{busyOrder === order.id ? 'Moving…' : `Move to ${statuses[statusIndex + 1]} →`}</button><button type="button" disabled={busyOrder === order.id} onClick={() => cancelTicket(order)} className="rounded-full border border-red-900/70 px-3 py-2 text-[10px] font-semibold text-red-300 transition hover:bg-red-950/40 disabled:opacity-50">Cancel</button></div>}
                            {statusIndex === statuses.length - 1 && <span className="text-[10px] uppercase tracking-wider text-ember-gold">Complete ✓</span>}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(300px,.8fr)_1.2fr]">
            <MenuEditor item={editingItem} onSave={saveItem} onCancel={() => setEditingItem(null)} saving={saving} />
            <div className="rounded-2xl border border-ember-line bg-ember-panel p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><p className="text-[9px] font-bold uppercase tracking-[.22em] text-ember-copper">The current lineup</p><h2 className="mt-1 font-display text-2xl">Menu inventory</h2></div>
                <span className="text-xs text-ember-muted">{menu.length} items</span>
              </div>
              <div className="divide-y divide-ember-line">
                {menu.length === 0 && <p className="py-8 text-center text-sm text-ember-muted">Your menu is empty. Add an item to start.</p>}
                {menu.map((item) => (
                  <article key={item.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg">{item.name}</h3>
                        <span className="rounded-full border border-ember-line px-2 py-0.5 text-[9px] uppercase tracking-wider text-ember-muted">{item.category}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-ember-muted">{item.description || 'No description'}</p>
                      <p className="mt-2 text-xs font-semibold text-[#7A7571]">{money(item.price)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button type="button" disabled={busyItem === item.id} onClick={() => toggleAvailability(item)} className={`rounded-full border px-3 py-2 text-[10px] font-semibold transition hover:scale-[1.02] disabled:opacity-50 ${item.available ? 'border-ember-gold/60 text-ember-gold hover:bg-ember-raised' : 'border-red-900/70 text-red-300 hover:bg-red-950/40'}`}>{busyItem === item.id ? 'Updating…' : item.available ? '● In stock' : '○ Out of stock'}</button>
                      <button type="button" onClick={() => setEditingItem(item)} className="rounded-full border border-ember-line bg-transparent px-3 py-2 text-[10px] font-semibold text-ember-muted transition hover:border-ember-gold hover:text-ember-ivory">Edit</button>
                      <button type="button" disabled={busyItem === item.id} onClick={() => removeItem(item)} aria-label={`Delete ${item.name}`} className="grid h-8 w-8 place-items-center rounded-full border border-ember-line bg-transparent p-0 text-sm text-ember-muted transition hover:border-red-800 hover:text-red-300 disabled:opacity-50">×</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
