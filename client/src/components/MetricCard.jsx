function MetricCard({ label, value, change }) {
  return (
    <div className="metric-card">
      <p>{label}</p>

      <h2>{value}</h2>

      <span>{change}</span>
    </div>
  );
}

export default MetricCard;