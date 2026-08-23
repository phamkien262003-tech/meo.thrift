const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { UPLOAD_DIR } = require('../middleware/upload');

const VARIANTS = {
  thumb: 480,
  detail: 1200,
};

async function saveProductImage(buffer, baseName) {
  const results = {};
  for (const [variant, width] of Object.entries(VARIANTS)) {
    const filename = `${baseName}-${variant}.webp`;
    const outPath = path.join(UPLOAD_DIR, filename);
    await sharp(buffer)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outPath);
    results[variant] = filename;
  }
  return results;
}

function deleteProductImageFiles(filename) {
  if (!filename || filename.startsWith('placeholder:')) return;
  const base = filename.replace(/-(thumb|detail)\.webp$/, '');
  ['thumb', 'detail'].forEach((variant) => {
    const p = path.join(UPLOAD_DIR, `${base}-${variant}.webp`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });
}

/** Resolves a stored filename value into a template-friendly image descriptor. */
function resolveImage(filename, variant = 'detail') {
  if (!filename) {
    return { isPlaceholder: true, tone: 'terracotta', src: null };
  }
  if (filename.startsWith('placeholder:')) {
    return { isPlaceholder: true, tone: filename.split(':')[1] || 'terracotta', src: null };
  }
  const base = filename.replace(/-(thumb|detail)\.webp$/, '');
  return { isPlaceholder: false, tone: null, src: `/uploads/${base}-${variant}.webp` };
}

module.exports = { saveProductImage, deleteProductImageFiles, resolveImage };
