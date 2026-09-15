'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

const stub = (file, exports) => {
  const id = require.resolve(file);
  require.cache[id] = { id, filename: id, loaded: true, exports };
};
const variants = [
  { id: 1, attributes: { Color: 'White' }, colorHex: '#ffffff', price: '45000.00', stock: 3, image: '/uploads/white.jpg', images: ['/uploads/white-detail.jpg'] },
  { id: 2, attributes: { Color: 'Black' }, colorHex: '#111111', price: '1000.00', stock: 5, image: '/uploads/black.jpg', images: [] },
];
const queries = [];
const rowsFor = query => {
  queries.push(query);
  const variantInclude = query.include.find(include => include.as === 'variants');
  return [{
    id: 10, name: 'Sample product', images: ['/uploads/main.jpg'],
    ...(variantInclude && { variants: variants.map(variant => Object.fromEntries(
      Object.entries(variant).filter(([key]) => variantInclude.attributes.includes(key))
    )) }),
  }];
};
stub('../models', {
  Product: {
    findAll: async query => rowsFor(query),
    findAndCountAll: async query => ({ count: 1, rows: rowsFor(query) }),
  },
  ProductVariant: {}, Category: {}, Warehouse: {},
});
stub('./variantController', {});
stub('../services/spinSequenceService', {});
const { getFeatured, getAll } = require('./productController');

test('featured cards receive the same variant options, prices, and image URLs as best sellers', async () => {
  const previousUrl = process.env.SERVER_URL;
  process.env.SERVER_URL = 'https://api.example';
  try {
    const invoke = async (handler, query = {}) => {
      let result;
      await handler({ query, headers: {} }, {
        json: payload => { result = payload; },
        status: code => { throw new Error(`Unexpected response ${code}`); },
      });
      return result;
    };
    const featured = await invoke(getFeatured);
    const bestSellers = await invoke(getAll, { bestSeller: 'true' });
    assert.deepEqual(featured.products, bestSellers.products);
    assert.deepEqual(queries[0].where, { isFeatured: true, isActive: true });
    assert.equal(queries[0].limit, 12);
    assert.equal(featured.products[0].variants.length, 2);
    assert.deepEqual(featured.products[0].variants.map(v => v.price), ['45000.00', '1000.00']);
    assert.equal(featured.products[0].variants[1].colorHex, '#111111');
    assert.equal(featured.products[0].variants[0].image, 'https://api.example/uploads/white.jpg');
    assert.equal(featured.products[0].variants[0].images[0], 'https://api.example/uploads/white-detail.jpg');
  } finally {
    if (previousUrl === undefined) delete process.env.SERVER_URL;
    else process.env.SERVER_URL = previousUrl;
  }
});
