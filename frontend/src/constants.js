export const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller'];
export const PLATFORMS = ['Netflix', 'Prime Video', 'Hotstar', 'Theatre', 'Other'];
export const STATUSES = ['To Watch', 'Watching', 'Watched'];

export const NEXT_STATUS = {
  'To Watch': ['Watching', 'Watched'],
  Watching: ['Watched', 'To Watch'],
  Watched: [],
};