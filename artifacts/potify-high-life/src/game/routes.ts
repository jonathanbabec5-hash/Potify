// The downloadable edition keeps both views in one local HTML file.
const standalone = window.location.protocol === 'file:' || import.meta.env.VITE_SINGLE_FILE === 'true';
const file = window.location.pathname;
export const gameUrl = standalone ? file : import.meta.env.BASE_URL;
export const devlogUrl = standalone ? file + '?view=devlog' : gameUrl + 'devlog/';
export const isDevlog = standalone
  ? new URLSearchParams(window.location.search).get('view') === 'devlog'
  : file.replace(/\/+$/, '') === new URL(devlogUrl, window.location.href).pathname.replace(/\/+$/, '');
