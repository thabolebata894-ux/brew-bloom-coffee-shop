export default function DailySummary({ orders }) {
  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (order) => new Date(order.createdAt).toDateString() === today
  );
  const sales = todayOrders.reduce((total, order) => total + Number(order.subtotal || 0), 0);

  return (
    <section className="summary-card" aria-label="Today's summary">
      <h2>Today's Summary</h2>
      <p>Orders: {todayOrders.length}</p>
      <p>Sales: R{sales.toFixed(2)}</p>
    </section>
  );
}