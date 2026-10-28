export default function StatsPanel({ stats }) {
  if (!stats) return null;
  const items = [
    { label: 'To Watch', value: stats.statusCounts['To Watch'] },
    { label: 'Watching', value: stats.statusCounts.Watching },
    { label: 'Watched', value: stats.statusCounts.Watched },
    { label: 'Hours watched', value: stats.totalHoursWatched },
    { label: 'Avg rating', value: stats.averageRating || '-' },
    { label: 'Top genre', value: stats.topGenre || '-' },
  ];
  return (
    <section className="stats">
      {items.map((i) => (
        <div className="stat" key={i.label}>
          <span className="stat-value">{i.value}</span>
          <span className="stat-label">{i.label}</span>
        </div>
      ))}
    </section>
  );
}