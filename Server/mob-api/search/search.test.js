'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Op } = require('sequelize');
const stub = (file, exports) => { const id = require.resolve(file); require.cache[id] = { id, filename: id, loaded: true, exports }; };
let options, rows = [{ id: 7, name: 'Blue Shirt', price: 100 }], failure = false;
stub('../../models', { Product: { findAll: async query => { options = query; if (failure) throw Error('internal'); return rows; } } });
stub('../../controllers/searchController', {});
const controller = require('./searchController');
const call = async query => {
  let status = 200, body;
  const res = { status(value) { status = value; return this; }, json(value) { body = value; } };
  await controller.suggestions({ query }, res);
  return { status, body };
};
test('typed name fragments map to product IDs with an explicit limit', async () => {
  const result = await call({ q: ' shi ', limit: '5' });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { success: true, query: 'shi', suggestions: [{ id: 7, name: 'Blue Shirt' }] });
  assert.equal(options.where.name[Op.like], '%shi%');
  assert.equal(options.where.isActive, true);
  assert.equal(options.limit, 5);
  assert.deepEqual(options.attributes, ['id', 'name']);
  assert.equal(controller.autocomplete, controller.suggestions);
});
test('wildcards are escaped and limits are bounded', async () => {
  await call({ q: '10%_', limit: '999' });
  assert.equal(options.where.name[Op.like], '%10\\%\\_%');
  assert.equal(options.limit, 100);
});
test('invalid queries return 400', async () => {
  for (const query of [{}, { q: '' }, { q: ['shirt'] }, { q: 'a'.repeat(201) }, { q: 'shirt', limit: '-1' }]) {
    assert.equal((await call(query)).status, 400);
  }
});
test('no matches return 200 with empty suggestions', async () => {
  rows = [];
  const result = await call({ q: 'unknown' });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.suggestions, []);
  assert.equal(options.limit, 6);
});
test('database failures return 500', async () => {
  failure = true;
  const result = await call({ q: 'shirt' });
  assert.equal(result.status, 500);
  assert.equal(result.body.message, 'Unable to fetch product suggestions');
});
