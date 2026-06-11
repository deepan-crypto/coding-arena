export default function StatCard({ label, value, accent }) {
  return (
    <article className="stat-card" style={{ borderColor: accent || 'var(--border)' }}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
    </article>
  );
}