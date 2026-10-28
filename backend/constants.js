const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller'];
const PLATFORMS = ['Netflix', 'Prime Video', 'Hotstar', 'Theatre', 'Other'];
const STATUSES = ['To Watch', 'Watching', 'Watched'];

const NEXT_STATUS = {
  'To Watch': ['Watching', 'Watched'],
  'Watching': ['Watched', 'To Watch'],
  'Watched': [],
};

module.exports = { GENRES, PLATFORMS, STATUSES, NEXT_STATUS, PAGE_SIZE: 6 };