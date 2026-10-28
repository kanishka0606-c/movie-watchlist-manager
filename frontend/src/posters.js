import { GENRES } from './constants';

function guessGenre(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('science fiction') || t.includes('sci-fi')) return 'Sci-Fi';
  return GENRES.find((g) => t.includes(g.toLowerCase())) || '';
}

export async function searchMovies(term) {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&generator=search' +
    `&gsrsearch=${encodeURIComponent(term + ' film')}&gsrlimit=8` +
    '&prop=pageimages|extracts&piprop=thumbnail&pithumbsize=400' +
    '&exintro=1&explaintext=1&exchars=300&exlimit=max&format=json&origin=*';

  const res = await fetch(url);
  if (!res.ok) throw new Error('Search failed');
  const json = await res.json();
  const pages = Object.values((json.query && json.query.pages) || {});
  const thisYear = new Date().getFullYear();

  return pages
    .sort((a, b) => a.index - b.index)
    .filter((p) => p.thumbnail && p.thumbnail.source)
    .map((p) => {
      const m = (p.extract || '').match(/\b(19[5-9]\d|20\d\d)\b/);
      const year = m ? Number(m[1]) : '';
      return {
        title: p.title.replace(/\s*\(.*\)$/, ''),
        year: year && year <= thisYear ? year : '',
        poster: p.thumbnail.source,
        genre: guessGenre(p.extract),
      };
    });
}