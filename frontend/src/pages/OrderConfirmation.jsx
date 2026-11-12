import { Link, useLocation } from 'react-router-dom';

export default function OrderConfirmation({ order }) {
  const location = useLocation();
  const confirmedOrder = order || location.state?.order;

  if (!confirmedOrder) {
    return (
      <main className="app-page">
        <div className="app-page-inner surface-card empty-state">
          <p className="page-eyebrow text-[#6F4E37]">ORDER DETAILS</p>
          <h1 className="page-title">No order found</h1>
          <p>Place an order from your cart to see its confirmation here.</p>
          <Link className="button button-dark inline-flex rounded-full bg-[#6F4E37] px-6 py-3 font-semibold text-white transition hover:bg-[#5B3F2B]" to="/">Return to menu</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="app-page-inner surface-card confirmation-card">
        <span className="confirmation-icon grid h-12 w-12 place-items-center rounded-full bg-[#6F4E37] font-semibold text-white" aria-hidden="true">✓</span>
        <p className="page-eyebrow text-[#6F4E37]">THANK YOU FOR YOUR ORDER</p>
        <h1 className="page-title">It’s brewing</h1>
        <p>Your order has been sent to the team. We can’t wait for you to enjoy it.</p>
        <div className="confirmation-details">
          <p><span>Order number</span><strong>{confirmedOrder.id}</strong></p>
          <p><span>Customer</span><strong>{confirmedOrder.customerName}</strong></p>
          <p><span>Status</span><strong>{confirmedOrder.status}</strong></p>
          <p><span>Total</span><strong>R{Number(confirmedOrder.subtotal || 0).toFixed(2)}</strong></p>
          <h2>In your order</h2>
          <ul>
            {confirmedOrder.items.map((item) => (
              <li key={item.id}>{item.quantity} × {item.name}</li>
            ))}
          </ul>
        </div>
        <Link className="button button-dark inline-flex rounded-full bg-[#6F4E37] px-6 py-3 font-semibold text-white transition hover:bg-[#5B3F2B]" to="/">Back to the menu</Link>
      </div>
    </main>
  );
}
