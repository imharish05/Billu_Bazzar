'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { formatMobileProducts, omittedFields } = require('./productResponse');
const embedded = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
test('mobile lists convert embedded media, repair local URLs, and return spin URLs without embedded data', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'mobile-media-test-'));
  const old = process.env.SERVER_URL;
  process.env.SERVER_URL = 'http://localhost:5000';
  try {
    const row = { id: 1, name: 'Sample', defaultProductImage: 'http://localhost:5000/uploads/main.jpg', images: ['http://localhost:5000/uploads/main.jpg', embedded, embedded], spin_images: [embedded], tags: ['sample'], model_3d_url: null, has360View: true, hasVideo: true, videoUrl: 'http://localhost:5000/uploads/video.mp4', spinImagePath: 'http://localhost:5000/uploads/spin/1/', spinImageCount: 1, spinImageExt: 'jpg', variants: [{ id: 2, image: embedded, images: [embedded] }] };
    const req = { protocol: 'http', headers: { 'x-forwarded-proto': 'https' }, get: () => 'api.example' };
    const [product] = await formatMobileProducts([row], req, { directory });
    assert.equal(product.defaultProductImage, 'https://api.example/uploads/main.jpg');
    assert.equal(product.images.length, 2);
    assert.equal(product.spin_images[0], product.variants[0].images[0]);
    assert.equal(product.spinImagePath, 'https://api.example/uploads/spin/1/');
    assert.equal(product.spinImageCount, 1);
    assert.equal('spinImageExt' in product, false);
    assert.equal(product.videoUrl, 'https://api.example/uploads/video.mp4');
    assert.match(product.images[1], /^https:\/\/api\.example\/uploads\/products\/mobile-cache\/[a-f0-9]{64}\.png$/);
    assert.equal(product.variants[0].images[0], product.images[1]);
    for (const field of omittedFields) assert.equal(field in product, false);
    assert.equal(JSON.stringify(product).includes('data:image'), false);
    assert.equal(JSON.stringify(product).includes('localhost'), false);
    assert.equal(row.spinImageCount, 1);
    await formatMobileProducts([row], req, { directory });
    const files = await fs.readdir(directory);
    assert.equal(files.length, 1);
    assert.deepEqual(await fs.readFile(path.join(directory, files[0])), Buffer.from(embedded.split(',')[1], 'base64'));
  } finally {
    if (old === undefined) delete process.env.SERVER_URL; else process.env.SERVER_URL = old;
    // Only this test-created directory is removed.
    await fs.rm(directory, { recursive: true, force: true });
  }
});
test('empty and invalid media use null and empty lists; CDN URLs are preserved', async () => {
  const [product] = await formatMobileProducts([{ id: 1, images: ['blob:expired', 'data:invalid', 'https://cdn.example/image.jpg'], variants: [{ image: '' }] }], { headers: {}, get: () => 'api.example' });
  assert.equal(product.defaultProductImage, 'https://cdn.example/image.jpg');
  assert.deepEqual(product.variants[0].images, []);
  assert.equal('image' in product.variants[0], false);
});

test('folder metadata expands to individual spin frame URLs when no source list exists', async () => {
  const old = process.env.SERVER_URL;
  process.env.SERVER_URL = 'https://api.example';
  try {
    const [product] = await formatMobileProducts([{ id: 224, spinImagePath: '/uploads/spin/224/', spinImageCount: 12, spinImageExt: 'jpg', model_3d_url: null }], {});
    assert.equal(product.spin_images.length, 12);
    assert.equal(product.spin_images[0], 'https://api.example/uploads/spin/224/frame_1.jpg');
    assert.equal(product.spin_images[11], 'https://api.example/uploads/spin/224/frame_12.jpg');
    assert.equal('model_3d_url' in product, false);
  } finally {
    if (old === undefined) delete process.env.SERVER_URL; else process.env.SERVER_URL = old;
  }
});

test('listing omits requested metadata while preserving IDs and variant gallery images', async () => {
  const [product] = await formatMobileProducts([{ id: 1, categoryId: 12, subCategoryId: null, category: { id: 12 }, subcategory: null, lowStockThreshold: 10, seoDescription: 'SEO', spinImageExt: 'webp', image: '/uploads/main.jpg', variants: [{ id: 2, colorHex: null, lowStockThreshold: 5, image: 'https://cdn.example/variant.jpg', images: [] }] }], {});
  for (const field of ['lowStockThreshold','seoDescription','spinImageExt','category','subcategory','image']) assert.equal(field in product, false);
  for (const field of ['image','colorHex','lowStockThreshold']) assert.equal(field in product.variants[0], false);
  assert.equal(product.categoryId, 12);
  assert.deepEqual(product.variants[0].images, ['https://cdn.example/variant.jpg']);
});
