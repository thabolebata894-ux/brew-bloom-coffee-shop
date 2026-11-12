import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { placeOrder } from '../api/api';
import { useCart } from '../context/CartContex';

export default function CartPage() {
  const { cart, updateQuantity, clearCart, total } = useCart();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [orderMessage, setOrderMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!customerName.trim() || cart.length === 0) {
      setOrderMessage('Please enter a customer name and at least one item.');
      return;
    }

    setSubmitting(true);
    setOrderMessage('');
    try {
      const response = await placeOrder({
        customerName: customerName.trim(),
        items: cart.map(({ id, quantity }) => ({ id, quantity })),
        notes: 'Order submitted from customer portal'
      });
      clearCart();
      navigate('/confirmation', { state: { order: response } });
    } catch (error) {
      setOrderMessage(error.message || 'Unable to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app-page">
      <div className="app-page-inner">
        <p className="page-eyebrow text-[#6F4E37]">YOUR ORDER</p>
        <h1 className="page-title">Your cart</h1>
      {cart.length === 0 ? (
        <div className="surface-card empty-state">
          <p>Your cart is waiting for something delicious.</p>
          <a className="button button-dark inline-flex rounded-full bg-[#6F4E37] px-6 py-3 font-semibold text-white transition hover:bg-[#5B3F2B]" href="/#menu">Explore the menu</a>
        </div>
      ) : (
        <div className="surface-card">
          {cart.map((item) => (
            <div key={item.id} className="cart-row">
              <span className="cart-item-name">{item.name}</span>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                aria-label={`Quantity of ${item.name}`}
              />
              <span className="cart-line-price">R{(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="cart-total"><span className="text-[#6F4E37]">Total</span><span className="font-semibold text-[#6F4E37]">R{total.toFixed(2)}</span></div>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              aria-label="Customer name"
              required
              className="form-input"
            />
            <button type="submit" disabled={submitting} className="rounded-full bg-[#6F4E37] px-6 py-3 font-semibold text-white transition hover:bg-[#5B3F2B] disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Preparing your order...' : 'Place order'}
            </button>
          </form>
          {orderMessage && <p className="alert-message" role="alert">{orderMessage}</p>}
        </div>
      )}
      </div>
    </main>
  );
}
