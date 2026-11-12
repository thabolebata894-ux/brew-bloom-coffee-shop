export default function MenuItemCard({ item, onEdit, onDelete, deleting }) {
  return (
    <article className="dashboard-item">
      <div>
        <h3>{item.name}</h3>
        <p>{item.description || 'No description'} · R{Number(item.price).toFixed(2)} · {item.available ? 'Available' : 'Unavailable'}</p>
      </div>
      <div className="dashboard-actions">
        <button className="small-button" type="button" onClick={() => onEdit(item)}>Edit</button>
        <button className="small-button" type="button" onClick={() => onDelete(item.id)} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </article>
  );
}