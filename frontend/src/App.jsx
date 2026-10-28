import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { GENRES, STATUSES } from './constants';
import Landing from './components/Landing';
import MovieForm from './components/MovieForm';
import MovieCard from './components/MovieCard';
import StatsPanel from './components/StatsPanel';

const getTheme = () => {
  try { return localStorage.getItem('rq-theme') || 'dark'; } catch { return 'dark'; }
};

export default function App() {
  const [started, setStarted] = useState(false);
  const [theme, setTheme] = useState(getTheme);
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [genre, setGenre] = useState('');
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({ open: false, movie: null });
  const [notice, setNotice] = useState(null);
  const [nextPick, setNextPick] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('rq-theme', theme); } catch { /* storage unavailable */ }
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const flash = useCallback((type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 3500);
  }, []);

  const loadMovies = useCallback(async () => {
    try {
      const res = await api.list({ page, status, genre, search });
      setMovies(res.data.movies);
      setTotalPages(res.data.totalPages);
      if (page > res.data.totalPages) setPage(res.data.totalPages);
    } catch (err) {
      flash('error', err.message);
    }
  }, [page, status, genre, search, flash]);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.stats();
      setStats(res.data);
    } catch (err) {
      flash('error', err.message);
    }
  }, [flash]);

  useEffect(() => { loadMovies(); }, [loadMovies]);
  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchText); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchText]);

  const refresh = () => { loadMovies(); loadStats(); };

  const run = async (fn, okMsg) => {
    try {
      await fn();
      flash('success', okMsg);
      refresh();
    } catch (err) {
      flash('error', err.message);
    }
  };

  const saveMovie = async (data) => {
    if (form.movie) await api.update(form.movie._id, data);
    else await api.create(data);
    setForm({ open: false, movie: null });
    flash('success', form.movie ? 'Movie updated' : 'Movie added');
    refresh();
  };

  const askNext = async () => {
    try {
      const res = await api.next();
      setNextPick(res.data);
    } catch (err) {
      setNextPick(null);
      flash('error', err.message);
    }
  };

  if (!started) return <Landing onStart={() => setStarted(true)} theme={theme} onToggle={toggleTheme} />;

  return (
    <div className="app">
      <header className="top">
        <button className="brand" onClick={() => setStarted(false)}>
          Reel<span>Queue</span>
        </button>
        <div className="top-actions">
          <button className="btn ghost" onClick={askNext}>✨ What should I watch next?</button>
          <button className="btn primary" onClick={() => setForm({ open: true, movie: null })}>+ Add movie</button>
          <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {notice && <div className={`toast ${notice.type}`}>{notice.text}</div>}

      {nextPick && (
        <div className="next-pick">
          <div>
            <strong>🍿 Watch next:</strong> {nextPick.title} ({nextPick.releaseYear}) · {nextPick.genre} ·{' '}
            {nextPick.runtime} min · priority {nextPick.priority}
          </div>
          <button className="btn ghost small" onClick={() => setNextPick(null)}>Dismiss</button>
        </div>
      )}

      <StatsPanel stats={stats} />

      <section className="filters">
        <input
          placeholder="🔎 Search by title..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={genre} onChange={(e) => { setGenre(e.target.value); setPage(1); }}>
          <option value="">All genres</option>
          {GENRES.map((g) => <option key={g}>{g}</option>)}
        </select>
      </section>

      {movies.length === 0 ? (
        <p className="empty">🎞️ No movies found. Add one or change the filters.</p>
      ) : (
        <section className="grid">
          {movies.map((m, i) => (
            <MovieCard
              key={m._id}
              index={i}
              movie={m}
              onEdit={(movie) => setForm({ open: true, movie })}
              onStatus={(movie, s, rating) =>
                run(() => api.changeStatus(movie._id, { status: s, rating }), `Moved to ${s}`)
              }
              onRate={(movie, r) => run(() => api.rate(movie._id, r), 'Rating updated')}
              onDelete={(movie) => run(() => api.remove(movie._id), 'Movie deleted')}
            />
          ))}
        </section>
      )}

      <nav className="pager">
        <button className="btn ghost small" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button className="btn ghost small" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
      </nav>

      {form.open && (
        <MovieForm movie={form.movie} onSave={saveMovie} onClose={() => setForm({ open: false, movie: null })} />
      )}
    </div>
  );
}