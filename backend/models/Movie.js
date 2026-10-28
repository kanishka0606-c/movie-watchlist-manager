const mongoose = require('mongoose');
const { GENRES, PLATFORMS, STATUSES } = require('../constants');

const movieSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 150 },
    genre: { type: String, enum: GENRES, required: true },
    releaseYear: { type: Number, required: true, min: 1950 },
    runtime: { type: Number, required: true, min: 30, max: 300 },
    platform: { type: String, enum: PLATFORMS, required: true },
    priority: { type: Number, required: true, min: 1, max: 5 },
    status: { type: String, enum: STATUSES, default: 'To Watch' },
    rating: { type: Number, min: 1, max: 10, default: null },
    watchedDate: { type: Date, default: null },
    posterUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

// case-insensitive uniqueness of title + year (safety net at DB level)
movieSchema.index(
  { title: 1, releaseYear: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

module.exports = mongoose.model('Movie', movieSchema);