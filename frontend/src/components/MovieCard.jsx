import { useState } from 'react';
import { NEXT_STATUS } from '../constants';

const badgeClass = { 'To Watch': 'b-towatch', Watching: 'b-watching', Watched: 'b-watched' };

export default function MovieCard({ movie, index = 0, onEdit, onStatus, onRate, onDelete }) {
  const [panel, setPanel] = useState(null); // null | 'watch' | 'edit'
  const [rating, setRating] = useState('');
  const [localError, setLocalError] = useState('');

  const options = NEXT_STATUS[movie.status];
  const cannotDelete = movie.status === 'Watching';
  const genreKey = movie.genre.replace(/\W/g, '');

  const pick = (e) => {
    const value = e.target.value;
    if (!value) return;
    if (value === 'Watched') {
      setRating('');
      setLocalError('');
      setPanel('watch');
    } else {
      onStatus(movie, value);
    }
  };

  const confirmRating = () => {
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 10) return setLocalError('Rating must be 1 to 10');
    if (panel === 'watch') onStatus(movie, 'Watched', r);
    else onRate(movie, r);
    setPanel(null);
  };

  const askDelete = () => {
    if (window.confirm(`Delete "${movie.title}"? This cannot be undone.`)) onDelete(movie);
  };

  return (
    <article className={`card g-${genreKey}`} style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}>
      {movie.posterUrl && <div className="poster" style={{ backgroundImage: `url("${movie.posterUrl}")` }} />}
      <div className="shade" />

      <div className="card-body">
        <div className="card-top">
          <span className="code">{movie.code}</span>
          <span className={`badge ${badgeClass[movie.status]}`}>{movie.status}</span>
        </div>

        <h3>{movie.title}</h3>
        <p className="meta">
          {movie.genre} · {movie.releaseYear} · {movie.runtime} min · {movie.platform}
        </p>
        <p className="meta">
          🔥 Priority <strong>{movie.priority}/5</strong>
          {movie.rating != null && <> · ⭐ <strong>{movie.rating}/10</strong></>}
        </p>

        {panel && (
          <div className="rate-box">
            <input
              type="number"
              min="1"
              max="10"
              placeholder="Rating 1-10"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
            <button className="btn primary small" onClick={confirmRating}>
              {panel === 'watch' ? 'Mark watched' : 'Save'}
            </button>
            <button className="btn ghost small" onClick={() => setPanel(null)}>x</button>
            {localError && <small>{localError}</small>}
          </div>
        )}

        <div className="card-actions">
          {options.length > 0 ? (
            <select value="" onChange={pick}>
              <option value="">Change status...</option>
              {options.map((s) => <option key={s}>{s}</option>)}
            </select>
          ) : (
            <span className="final">Final status</span>
          )}
          {movie.status === 'Watched' && (
            <button
              className="btn ghost small"
              onClick={() => { setRating(movie.rating ?? ''); setLocalError(''); setPanel('edit'); }}
            >
              Edit rating
            </button>
          )}
          <button className="btn ghost small" onClick={() => onEdit(movie)}>Edit</button>
          <button
            className="btn danger small"
            disabled={cannotDelete}
            title={cannotDelete ? 'Cannot delete a movie you are watching' : 'Delete'}
            onClick={askDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}