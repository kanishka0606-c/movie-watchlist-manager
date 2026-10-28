export default function StatsPanel({ stats }) {
  if (!stats) return null;
  const items = [
    { icon: '🕒', label: 'To Watch', value: stats.statusCounts['To Watch'] },
    { icon: '▶️', label: 'Watching', value: stats.statusCounts.Watching },
    { icon: '✅', label: 'Watched', value: stats.statusCounts.Watched },
    { icon: '⏳', label: 'Hours watched', value: stats.totalHoursWatched },
    { icon: '⭐', label: 'Avg rating', value: stats.averageRating || '-' },
    { icon: '🏆', label: 'Top genre', value: stats.topGenre || '-' },
  ];
  return (
    <section className="stats">
      {items.map((i, n) => (
        <div className="stat" key={i.label} style={{ animationDelay: `${n * 70}ms` }}>
          <span className="stat-icon">{i.icon}</span>
          <span className="stat-value">{i.value}</span>
          <span className="stat-label">{i.label}</span>
        </div>
      ))}
    </section>
  );
}