const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Counter = require('../models/Counter');
const { GENRES, PLATFORMS, STATUSES, NEXT_STATUS, PAGE_SIZE } = require('../constants');

const CI = { locale: 'en', strength: 2 }; // case-insensitive collation

const reply = (res, code, success, message, data = null) =>
  res.status(code).json({ success, message, data });
const ok = (res, code, message, data) => reply(res, code, true, message, data);
const fail = (res, code, message) => reply(res, code, false, message, null);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const validId = (id) => mongoose.isValidObjectId(id);

function checkFields(b, isCreate) {
  const errors = [];
  const data = {};

  data.title = typeof b.title === 'string' ? b.title.trim() : '';
  if (!data.title) errors.push('Title is required');

  if (!GENRES.includes(b.genre)) errors.push(`Genre must be one of: ${GENRES.join(', ')}`);
  else data.genre = b.genre;

  if (!PLATFORMS.includes(b.platform)) errors.push(`Platform must be one of: ${PLATFORMS.join(', ')}`);
  else data.platform = b.platform;

  const runtime = Number(b.runtime);
  if (!Number.isInteger(runtime) || runtime < 30 || runtime > 300)
    errors.push('Runtime must be a whole number between 30 and 300 minutes');
  else data.runtime = runtime;

  const priority = Number(b.priority);
  if (!Number.isInteger(priority) || priority < 1 || priority > 5)
    errors.push('Priority must be a whole number between 1 and 5');
  else data.priority = priority;

  if (isCreate) {
    const year = Number(b.releaseYear);
    const thisYear = new Date().getFullYear();
    if (!Number.isInteger(year) || year < 1950 || year > thisYear)
      errors.push(`Release year must be between 1950 and ${thisYear}`);
    else data.releaseYear = year;
  }
  return { errors, data };
}

function checkRating(value) {
  if (value === undefined || value === null || value === '') return null;
  const r = Number(value);
  return Number.isInteger(r) && r >= 1 && r <= 10 ? r : null;
}

// POST /api/movies
exports.createMovie = async (req, res, next) => {
  try {
    const { errors, data } = checkFields(req.body, true);
    if (errors.length) return fail(res, 400, errors.join('. '));

    const dup = await Movie.findOne({ title: data.title, releaseYear: data.releaseYear }).collation(CI);
    if (dup) return fail(res, 409, `"${dup.title}" (${dup.releaseYear}) is already in your watchlist`);

    const counter = await Counter.findByIdAndUpdate(
      `year-${data.releaseYear}`,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const code = `MV-${data.releaseYear}-${String(counter.seq).padStart(3, '0')}`;

    // only whitelisted fields are used, so the client can't set code/status/rating
    const movie = await Movie.create({ ...data, code });
    ok(res, 201, 'Movie added to watchlist', movie);
  } catch (err) {
    next(err);
  }
};

// GET /api/movies?status=&genre=&search=&page=
exports.listMovies = async (req, res, next) => {
  try {
    const { status, genre, search } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const filter = {};
    if (status) filter.status = status;
    if (genre) filter.genre = genre;
    if (search && search.trim()) filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' };

    const totalItems = await Movie.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(totalItems / PAGE_SIZE), 1);

    const movies = await Movie.aggregate([
      { $match: filter },
      { $addFields: { toWatchFirst: { $cond: [{ $eq: ['$status', 'To Watch'] }, 0, 1] } } },
      { $sort: { toWatchFirst: 1, priority: -1, createdAt: -1 } },
      { $skip: (page - 1) * PAGE_SIZE },
      { $limit: PAGE_SIZE },
      { $project: { toWatchFirst: 0, __v: 0 } },
    ]);

    ok(res, 200, 'Movies fetched', { movies, page, totalPages, totalItems });
  } catch (err) {
    next(err);
  }
};

// GET /api/movies/watch-next
exports.watchNext = async (req, res, next) => {
  try {
    const movie = await Movie.findOne({ status: 'To Watch' }).sort({ priority: -1, runtime: 1 });
    if (!movie) return fail(res, 404, 'Nothing left in your To Watch list. Add a movie first!');
    ok(res, 200, 'Here is your next watch', movie);
  } catch (err) {
    next(err);
  }
};

// GET /api/movies/stats
exports.getStats = async (req, res, next) => {
  try {
    const byStatus = await Movie.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const counts = { 'To Watch': 0, Watching: 0, Watched: 0 };
    byStatus.forEach((s) => (counts[s._id] = s.count));

    const watched = await Movie.aggregate([
      { $match: { status: 'Watched' } },
      { $group: { _id: null, minutes: { $sum: '$runtime' }, avg: { $avg: '$rating' } } },
    ]);
    const topGenre = await Movie.aggregate([
      { $match: { status: 'Watched' } },
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 1 },
    ]);

    const w = watched[0];
    ok(res, 200, 'Stats fetched', {
      statusCounts: counts,
      totalHoursWatched: w ? Math.round((w.minutes / 60) * 10) / 10 : 0,
      averageRating: w && w.avg != null ? Math.round(w.avg * 10) / 10 : 0,
      topGenre: topGenre[0] ? topGenre[0]._id : null,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/movies/:id
exports.updateMovie = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return fail(res, 400, 'Invalid movie id');
    const movie = await Movie.findById(req.params.id);
    if (!movie) return fail(res, 404, 'Movie not found');

    const { errors, data } = checkFields(req.body, false);
    if (errors.length) return fail(res, 400, errors.join('. '));

    const dup = await Movie.findOne({
      title: data.title,
      releaseYear: movie.releaseYear,
      _id: { $ne: movie._id },
    }).collation(CI);
    if (dup) return fail(res, 409, `"${dup.title}" (${dup.releaseYear}) is already in your watchlist`);

    // code and releaseYear are never touched here
    movie.set(data);
    await movie.save();
    ok(res, 200, 'Movie updated', movie);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/movies/:id/status   body: { status, rating? }
exports.changeStatus = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return fail(res, 400, 'Invalid movie id');
    const movie = await Movie.findById(req.params.id);
    if (!movie) return fail(res, 404, 'Movie not found');

    const target = req.body.status;
    if (!STATUSES.includes(target)) return fail(res, 400, `Status must be one of: ${STATUSES.join(', ')}`);

    if (!NEXT_STATUS[movie.status].includes(target)) {
      const msg =
        movie.status === 'Watched'
          ? 'A Watched movie is final and its status cannot be changed'
          : `Invalid transition: ${movie.status} to ${target}`;
      return fail(res, 400, msg);
    }

    if (target === 'Watched') {
      const rating = checkRating(req.body.rating);
      if (rating === null) return fail(res, 400, 'A rating from 1 to 10 is required to mark a movie as Watched');
      movie.rating = rating;
      movie.watchedDate = new Date();
    }

    movie.status = target;
    await movie.save();
    ok(res, 200, `Status changed to ${target}`, movie);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/movies/:id/rating   body: { rating }
exports.rateMovie = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return fail(res, 400, 'Invalid movie id');
    const movie = await Movie.findById(req.params.id);
    if (!movie) return fail(res, 404, 'Movie not found');

    if (movie.status !== 'Watched') return fail(res, 400, 'Only Watched movies can be rated');
    const rating = checkRating(req.body.rating);
    if (rating === null) return fail(res, 400, 'Rating must be a whole number from 1 to 10');

    movie.rating = rating;
    await movie.save();
    ok(res, 200, 'Rating updated', movie);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/movies/:id
exports.deleteMovie = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return fail(res, 400, 'Invalid movie id');
    const movie = await Movie.findById(req.params.id);
    if (!movie) return fail(res, 404, 'Movie not found');

    if (movie.status === 'Watching')
      return fail(res, 400, 'A movie you are currently watching cannot be deleted');

    await movie.deleteOne();
    ok(res, 200, 'Movie deleted', { _id: movie._id });
  } catch (err) {
    next(err);
  }
};