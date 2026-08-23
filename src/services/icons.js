/** Minimal inline outline-icon set (Phosphor-inspired, hand-drawn as SVG paths — no external font/emoji dependency). */
const PATHS = {
  bag: '<path d="M6 8h12l1 12.5a1.5 1.5 0 0 1-1.5 1.5H6.5A1.5 1.5 0 0 1 5 20.5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  heart: '<path d="M12 20.5s-7.5-4.6-9.7-9.2C.8 8 2 4.8 5.2 4.1c2-.4 3.9.5 4.8 2.2.9-1.7 2.8-2.6 4.8-2.2C18 4.8 19.2 8 17.7 11.3 15.5 15.9 12 20.5 12 20.5Z"/>',
  'heart-filled': '<path fill="currentColor" stroke="none" d="M12 20.5s-7.5-4.6-9.7-9.2C.8 8 2 4.8 5.2 4.1c2-.4 3.9.5 4.8 2.2.9-1.7 2.8-2.6 4.8-2.2C18 4.8 19.2 8 17.7 11.3 15.5 15.9 12 20.5 12 20.5Z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.35-4.35"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  leaf: '<path d="M5 19c8-1 13-6 14-14-8 1-13 6-14 14Z"/><path d="M5 19c1-4 4-7 8-9"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  check: '<path d="M5 13l4 4L19 7"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>',
  pencil: '<path d="M4 20l1-4L16 5l3 3L8 19l-4 1Z"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 6l9 7 9-7"/>',
  phone: '<path d="M6 3h3l2 5-2 1a11 11 0 0 0 5 5l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z"/>',
  location: '<path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  box: '<path d="M3 8l9-5 9 5-9 5-9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/>',
  facebook: '<path d="M14 9h3V6h-3a3 3 0 0 0-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9a1 1 0 0 1 1-1Z"/>',
  zalo: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M8 15V9h4.5a2 2 0 1 1 0 4H9m6-4v6"/>',
  filter: '<path d="M4 6h16"/><path d="M8 12h8"/><path d="M11 18h2"/>',
  logout: '<path d="M9 6v-.5A1.5 1.5 0 0 1 10.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7.5A1.5 1.5 0 0 1 9 18.5V18"/><path d="M14 12H3"/><path d="M6 9l-3 3 3 3"/>',
  dashboard: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-11 9"/>',
  sparkle: '<path d="M12 3l1.5 5L18 9.5 13.5 11 12 16l-1.5-5L5 9.5 9.5 8 12 3Z"/>',
};

function icon(name, className = 'w-5 h-5') {
  const path = PATHS[name];
  if (!path) return '';
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

module.exports = { icon };
