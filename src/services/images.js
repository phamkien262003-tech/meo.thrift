const sharp = require('sharp');
const { run, queryOne } = require('../config/db');

const MAX_WIDTH = 1200;
const QUALITY = 82;

/** Resizes/compresses the buffer and stores it as a row in `images`. Returns the new image id. */
async function saveImage(buffer) {
  const webp = await sharp(buffer).resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
  const result = await run('INSERT INTO images (mime_type, data) VALUES (?, ?)', ['image/webp', webp]);
  return result.insertId;
}

/** Deletes an image row (safe to call with null/undefined — a no-op). */
async function deleteImage(imageId) {
  if (!imageId) return;
  await run('DELETE FROM images WHERE id = ?', [imageId]);
}

async function getImageRow(imageId) {
  return queryOne('SELECT mime_type, data FROM images WHERE id = ?', [imageId]);
}

/** Resolves a stored image id into a template-friendly descriptor. */
function resolveImage(imageId) {
  if (!imageId) return { isPlaceholder: true, src: null };
  return { isPlaceholder: false, src: `/img/${imageId}` };
}

module.exports = { saveImage, deleteImage, getImageRow, resolveImage };
