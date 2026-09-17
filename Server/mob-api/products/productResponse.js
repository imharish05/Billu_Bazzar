'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const uploadRoot = path.join(__dirname, '../../uploads/products/mobile-cache');
const omittedFields = ['tags', 'model_3d_url', 'lowStockThreshold', 'seoDescription'];
const localHost = host => /^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])/i.test(host);

const origin = req => {
  const configured = (process.env.SERVER_URL || '').replace(/\/$/, '');
  if (configured) {
    try { if (!localHost(new URL(configured).hostname)) return configured; } catch (_) { /* Fall back to the request origin. */ }
  }
  const headers = req?.headers || {};
  const protocol = String(headers['x-forwarded-proto'] || req?.protocol || 'http').split(',')[0].trim();
  const host = String(headers['x-forwarded-host'] || req?.get?.('host') || '').split(',')[0].trim();
  return host ? `${protocol}://${host}` : configured;
};

const createMediaFormatter = (base, directory = uploadRoot) => {
  const pending = new Map();
  const convert = async value => {
    if (typeof value !== 'string' || !value.trim()) return null;
    let url = value.trim();
    if (url.startsWith('data:')) {
      const match = /^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=\s]+)$/i.exec(url);
      if (!match) return null;
      const encoded = match[2].replace(/\s/g, '');
      const bytes = Buffer.from(encoded, 'base64');
      if (!bytes.length || bytes.toString('base64').replace(/=+$/, '') !== encoded.replace(/=+$/, '')) return null;
      const ext = match[1].toLowerCase().replace('jpeg', 'jpg');
      const name = `${crypto.createHash('sha256').update(bytes).digest('hex')}.${ext}`;
      await fs.mkdir(directory, { recursive: true });
      try { await fs.writeFile(path.join(directory, name), bytes, { flag: 'wx' }); }
      catch (err) { if (err.code !== 'EEXIST') throw err; }
      url = `/uploads/products/mobile-cache/${name}`;
    }
    if (/^(https?:)?\/\//i.test(url)) {
      const parsed = new URL(url, base || 'https://example.invalid');
      if (!localHost(parsed.hostname)) return parsed.href;
      if (!parsed.pathname.startsWith('/uploads/')) return null;
      url = parsed.pathname + parsed.search;
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return null;
    return `${base}/${url.replace(/^\/+/, '')}`;
  };
  return value => {
    if (!pending.has(value)) pending.set(value, convert(value));
    return pending.get(value);
  };
};

const formatMobileProducts = async (rows, req, options = {}) => {
  const media = createMediaFormatter(origin(req), options.directory);
  const gallery = async value => {
    let values = value;
    if (typeof values === 'string') { try { values = JSON.parse(values); } catch (_) { values = []; } }
    return [...new Set((await Promise.all((Array.isArray(values) ? values : []).map(media))).filter(Boolean))];
  };
  return Promise.all(rows.map(async row => {
    const product = typeof row.toJSON === 'function' ? row.toJSON() : { ...row };
    for (const key of omittedFields) delete product[key];
    const images = await gallery(product.images);
    const defaultProductImage = await media(product.defaultProductImage) || images[0] || null;
    if (defaultProductImage && !images.includes(defaultProductImage)) images.unshift(defaultProductImage);
    const variants = await Promise.all((product.variants || []).map(async variant => {
      const images = await gallery(variant.images);
      const image = await media(variant.image) || images[0] || null;
      if (image && !images.includes(image)) images.unshift(image);
      const cleanVariant = { ...variant, images };
      delete cleanVariant.image;
      delete cleanVariant.colorHex;
      delete cleanVariant.lowStockThreshold;
      return cleanVariant;
    }));
    if (product.spinImagePath) product.spinImagePath = await media(product.spinImagePath);
    let frames = product.spin_images;
    if (typeof frames === 'string') { try { frames = JSON.parse(frames); } catch (_) { frames = []; } }
    if (!Array.isArray(frames)) frames = [];
    if (!frames.length && product.spinImagePath && Number.isInteger(Number(product.spinImageCount)) && Number(product.spinImageCount) > 0) {
      const folder = product.spinImagePath.replace(/\/$/, '');
      const ext = product.spinImageExt || 'jpg';
      frames = Array.from({ length: Number(product.spinImageCount) }, (_, index) => `${folder}/frame_${index + 1}.${ext}`);
    }
    product.spin_images = (await Promise.all(frames.map(media))).filter(Boolean);
    if (product.videoUrl) product.videoUrl = await media(product.videoUrl);
    // spinImageExt is needed to construct frame URLs, but is not returned.
    for (const field of ['spinImageExt', 'category', 'subcategory', 'colorHex', 'image']) delete product[field];
    return { id: product.id, name: product.name, slug: product.slug, ...product, defaultProductImage, images, variants };
  }));
};
module.exports = { formatMobileProducts, omittedFields };
