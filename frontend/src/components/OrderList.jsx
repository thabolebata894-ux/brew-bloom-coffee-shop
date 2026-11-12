const statuses = ['Pending', 'Preparing', 'Ready', 'Collected'];

export default function OrderList({ orders, onStatusChange, updatingOrderId }) {
  if (orders.length === 0) return <p>No orders have been placed yet.</p>;

  return (
    <div>
      {orders.map((order) => (
        <article className="order-card" key={order.id}>
          <h3>Order {order.id}</h3>
          <p>Customer: {order.customerName}</p>
          <ul>
            {order.items.map((item) => (
              <li key={item.id}>{item.quantity} × {item.name} — R{(item.quantity * item.price).toFixed(2)}</li>
            ))}
          </ul>
          <p>Total: R{Number(order.subtotal).toFixed(2)}</p>
          <label>
            Status
            <select
              value={order.status}
              onChange={(event) => onStatusChange(order.id, event.target.value)}
              disabled={updatingOrderId === order.id}
            >
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
        </article>
      ))}
    </div>
  );
}