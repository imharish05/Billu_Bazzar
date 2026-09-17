'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const stub = (file, exports) => {
  const id = require.resolve(file);
  require.cache[id] = { id, filename: id, loaded: true, exports };
};
let forwarded;
const capture = (req, res) => { forwarded = req.query; return res.json({ success: true }); };
stub('../../controllers/categoryController', { getAll: capture });
stub('../../controllers/subCategoryController', { getAll: capture });
stub('../../models', { Category: { findOne: async ({ where }) => {
  assert.equal(where.isActive, true);
  return where.id === 12 ? { id: 12 } : null;
} } });
const controller = require('./categoriesController');
const response = { json: value => value, status(code) { this.statusCode = code; return this; } };

test('mobile categories discard pagination and search without changing the original request', () => {
  const req = { query: { page: '2', limit: '1', search: 'Shirts', all: 'true' } };
  controller.getAll(req, response);
  assert.deepEqual(forwarded, {});
  assert.equal(req.query.search, 'Shirts');
});
test('mobile subcategories forward only categoryId', async () => {
  await controller.getSubCategories({ query: { categoryId: '12', page: '2', limit: '1', search: 'Shirts' } }, response);
  assert.deepEqual(forwarded, { categoryId: '12' });
  await controller.getSubCategories({ query: {} }, response);
  assert.deepEqual(forwarded, {});
});
test('invalid categoryId is rejected', async () => {
  await controller.getSubCategories({ query: { categoryId: 'invalid' } }, response);
  assert.equal(response.statusCode, 400);
});
test('Swagger exposes no categories parameters and only categoryId for subcategories', () => {
  const spec = require('./categoriesSwagger');
  assert.deepEqual(spec['/mob-api/categories'].get.parameters, []);
  assert.deepEqual(spec['/mob-api/subcategories'].get.parameters.map(p => p.name), ['categoryId']);
});

test('missing category 502 returns 404 without querying subcategories', async () => {
  forwarded = undefined;
  const result = await controller.getSubCategories({ query: { categoryId: '502' } }, response);
  assert.equal(response.statusCode, 404);
  assert.deepEqual(result, { success: false, message: 'Category not found' });
  assert.equal(forwarded, undefined);
});
