import { useState } from 'react';
import { GENRES, PLATFORMS } from '../constants';

const blank = { title: '', genre: GENRES[0], releaseYear: '', runtime: '', platform: PLATFORMS[0], priority: 3 };

export default function MovieForm({ movie, onSave, onClose }) {
  const editing = Boolean(movie);
  const thisYear = new Date().getFullYear();
  const [form, setForm] = useState(
    editing
      ? {
          title: movie.title,
          genre: movie.genre,
          releaseYear: movie.releaseYear,
          runtime: movie.runtime,
          platform: movie.platform,
          priority: movie.priority,
        }
      : blank
  );
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    const y = Number(form.releaseYear);
    if (!Number.isInteger(y) || y < 1950 || y > thisYear) e.releaseYear = `Enter a year from 1950 to ${thisYear}`;
    const r = Number(form.runtime);
    if (!Number.isInteger(r) || r < 30 || r > 300) e.runtime = 'Runtime must be 30 to 300 minutes';
    const p = Number(form.priority);
    if (!Number.isInteger(p) || p < 1 || p > 5) e.priority = 'Priority must be 1 to 5';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        releaseYear: Number(form.releaseYear),
        runtime: Number(form.runtime),
        priority: Number(form.priority),
      });
    } catch (err) {
      setServerError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} noValidate>
        <h2>{editing ? `Edit ${movie.code}` : 'Add a movie'}</h2>
        {serverError && <div className="form-error">{serverError}</div>}

        <label>
          Title
          <input name="title" value={form.title} onChange={set} />
          {errors.title && <small>{errors.title}</small>}
        </label>

        <div className="row">
          <label>
            Genre
            <select name="genre" value={form.genre} onChange={set}>
              {GENRES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </label>
          <label>
            Platform
            <select name="platform" value={form.platform} onChange={set}>
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
        </div>

        <div className="row">
          <label>
            Release year
            <input name="releaseYear" type="number" value={form.releaseYear} onChange={set} disabled={editing} />
            {errors.releaseYear && <small>{errors.releaseYear}</small>}
          </label>
          <label>
            Runtime (min)
            <input name="runtime" type="number" value={form.runtime} onChange={set} />
            {errors.runtime && <small>{errors.runtime}</small>}
          </label>
          <label>
            Priority (1-5)
            <input name="priority" type="number" value={form.priority} onChange={set} />
            {errors.priority && <small>{errors.priority}</small>}
          </label>
        </div>

        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? 'Saving...' : editing ? 'Save changes' : 'Add movie'}
          </button>
        </div>
      </form>
    </div>
  );
}