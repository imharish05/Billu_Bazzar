'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Op } = require('sequelize');
const stub = (file, exports) => {
  const id = require.resolve(file);
  require.cache[id] = { id, filename: id, loaded: true, exports };
};
let captured, fail = false, empty = false;
stub('../../models', {
  Category: { findOne: async ({ where }) => where.id === 12 ? { id: 12 } : null },
  SubCategory: { findOne: async ({ where }) => where.id === 30 ? { id: 30, categoryId: 12 } : where.id === 31 ? { id: 31, categoryId: 13 } : null },
  ProductVariant: {},
  Product: { findAndCountAll: async options => {
    if (fail) throw Error('private database details');
    captured = options;
    return { count: empty ? 0 : 3, rows: empty ? [] : [{ id: 1, variants: [{ id: 7, price: '999.00' }] }] };
  } },
});
stub('../../controllers/productController', { formatProduct: row => row });
const { parseFilters, buildQuery, list, search } = require('./productSearch');
const call = async (handler, query) => {
  let status = 200, body;
  const res = { status(code) { status = code; return this; }, json(value) { body = value; } };
  await handler({ query }, res);
  return { status, body };
};
test('all filters combine with safe sort and parent pagination', async () => {
  const result = await call(search, { q: 'shirt', categoryId: '12', subCategoryId: '30', minPrice: '0', maxPrice: '1000', minDiscount: '0', maxDiscount: '50', collection: 'new-arrivals,best-sellers', sort: 'price_asc', limit: '2', page: '1' });
  assert.equal(result.status, 200);
  assert.equal(result.body.hasMore, true);
  assert.equal(result.body.totalPages, 2);
  assert.equal(result.body.products[0].variants[0].id, 7);
  assert.deepEqual(captured.where.price, { [Op.gte]: 0, [Op.lte]: 1000 });
  assert.equal(captured.where.categoryId, 12);
  assert.equal(captured.where.subCategoryId, 30);
  assert.deepEqual(captured.where[Op.or], [{ isNewArrival: true }, { isBestSeller: true }]);
  assert.equal(captured.where[Op.and].length, 2);
  assert.deepEqual(captured.order, [['price', 'ASC'], ['id', 'DESC']]);
  assert.equal(captured.distinct, true);
});
test('every supported sort maps to a fixed database column', () => {
  for (const [sort, expected] of Object.entries({ price_asc: ['price','ASC'], price_desc: ['price','DESC'], newest: ['createdAt','DESC'], rating: ['rating','DESC'] })) {
    assert.deepEqual(buildQuery(parseFilters({ sort })).order[0], expected);
  }
});
test('bad input returns 400 instead of querying the database', async () => {
  for (const query of [{ minPrice:'20', maxPrice:'10' }, { minDiscount:'101' }, { minDiscount:'90',maxDiscount:'10' }, { sort:'price; DROP TABLE Products' }, { sort:'constructor' }, { q:['shirt'] }, { categoryId:'-1' }, { subCategoryId:'abc' }, { collection:'unknown' }, { minPrice:'' }, { limit:'0' }, { page:'1.5' }]) {
    captured = undefined;
    assert.equal((await call(list,query)).status,400,JSON.stringify(query));
    assert.equal(captured,undefined);
  }
  assert.equal((await call(search,{})).status,400);
  assert.equal((await call(search,{q:'   '})).status,400);
});
test('missing parents return 404 and mismatched category/subcategory return 400', async () => {
  assert.equal((await call(list,{categoryId:'502'})).status,404);
  assert.equal((await call(list,{subCategoryId:'502'})).status,404);
  assert.equal((await call(list,{categoryId:'12',subCategoryId:'31'})).status,400);
  assert.equal((await call(list,{subCategoryId:'31'})).status,404);
});
test('no matches return an empty 200 response with complete pagination', async () => {
  empty = true;
  try {
    const result = await call(search,{q:'missing'});
    assert.equal(result.status,200);
    assert.deepEqual(result.body,{success:true,products:[],total:0,page:1,limit:20,totalPages:0,hasMore:false});
  } finally { empty = false; }
});
test('database failures return 500 without exposing internal details', async () => {
  fail = true;
  try {
    const result = await call(list,{});
    assert.equal(result.status,500);
    assert.equal(result.body.message,'Unable to fetch products');
  } finally { fail = false; }
});
