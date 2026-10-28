export default function Landing({ onStart, theme, onToggle }) {
  return (
    <div className="landing">
      <button className="theme-btn" onClick={onToggle} aria-label="Toggle theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
      <span className="float f1">🎬</span>
      <span className="float f2">🍿</span>
      <span className="float f3">⭐</span>
      <span className="float f4">🎟️</span>

      <div className="landing-inner">
        <p className="eyebrow">Movie Watchlist Manager</p>
        <h1 className="logo">Reel<span>Queue</span></h1>
        <p className="tagline">Plan it. Watch it. Rate it.</p>
        <button className="cta" onClick={onStart}>Let's Watch 🍿</button>
      </div>
    </div>
  );
}