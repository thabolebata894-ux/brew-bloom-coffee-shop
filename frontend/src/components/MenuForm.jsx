import { useEffect, useState } from 'react';

const emptyItem = { name: '', description: '', price: '', available: true };

export default function MenuForm({ item, onSave, onCancel, submitting }) {
  const [form, setForm] = useState(emptyItem);

  useEffect(() => {
    setForm(item
      ? { ...item, price: String(item.price) }
      : emptyItem);
  }, [item]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const price = Number(form.price);
    if (!form.name.trim() || !Number.isFinite(price) || price < 0) return;
    onSave({ ...form, name: form.name.trim(), price });
  };

  const update = (field) => (event) => {
    const value = field === 'available' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{item ? 'Edit menu item' : 'Add menu item'}</h2>
      <label className="form-label">
        Name
        <input className="form-input" value={form.name} onChange={update('name')} required />
      </label>
      <label className="form-label">
        Description
        <input className="form-input" value={form.description} onChange={update('description')} />
      </label>
      <label className="form-label">
        Price (R)
        <input className="form-input" type="number" min="0" step="0.01" value={form.price} onChange={update('price')} required />
      </label>
      <label className="form-label availability-label">
        <input type="checkbox" checked={form.available} onChange={update('available')} />
        Available
      </label>
      <div className="form-actions">
        <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save item'}</button>
        {item && <button type="button" onClick={onCancel} disabled={submitting}>Cancel</button>}
      </div>
    </form>
  );
}