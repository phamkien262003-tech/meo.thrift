const TONES = {
  terracotta: { a: '#E0A588', b: '#C67B5C' },
  olive: { a: '#8B9A5C', b: '#6B7B3C' },
  rose: { a: '#E8C7C7', b: '#D4A5A5' },
  sand: { a: '#F5EEDC', b: '#EFE7D8' },
  clay: { a: '#D8A17E', b: '#B5651D' },
};

/** Elegant "no photo yet" placeholder: soft gradient + botanical line art, clearly not a broken image. */
function placeholderArt(tone = 'terracotta', seed = 0) {
  const t = TONES[tone] || TONES.terracotta;
  const gid = `g${tone}${seed}`;
  const sway = (seed % 3) * 6 - 6;
  return `
  <svg viewBox="0 0 400 520" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Hình ảnh minh họa, chưa có ảnh sản phẩm thật">
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${t.a}" />
        <stop offset="100%" stop-color="${t.b}" />
      </linearGradient>
    </defs>
    <rect width="400" height="520" fill="${gid !== '' ? `url(#${gid})` : t.b}" />
    <g stroke="#FBF8F2" stroke-width="1.4" fill="none" opacity="0.55" transform="rotate(${sway} 200 260)">
      <path d="M120 460 C 110 340, 150 220, 210 90" />
      <path d="M210 90 C 190 130, 150 150, 120 165" />
      <path d="M210 90 C 235 125, 270 135, 300 130" />
      <path d="M175 250 C 155 275, 120 285, 95 280" />
      <path d="M175 250 C 200 270, 225 270, 245 255" />
      <path d="M150 360 C 130 380, 100 385, 78 375" />
      <path d="M150 360 C 175 380, 200 378, 220 362" />
    </g>
    <circle cx="200" cy="90" r="5" fill="#FBF8F2" opacity="0.6" />
  </svg>`;
}

module.exports = { placeholderArt, TONES };
