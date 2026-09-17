'use strict';
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const stub = (file, exports) => { const id = require.resolve(file); require.cache[id] = { id, filename: id, loaded: true, exports }; };
let state, broken;
const matches = (row, where) => Object.entries(where).every(([key, value]) => row[key] === value);
const products = [{ id: 1, isActive: true, price: '10.50', stock: 5, currency: 'INR', images: [] }, { id: 2, isActive: true, price: '20', stock: 10, currency: 'AED' }];
const variants = [{ id: 3, productId: 1, price: '0.00', stock: 2, attributes: { Size: 'M' } }];
const wrap = (row, table) => row && { ...row, toJSON: () => ({ ...row, product: products.find(p => p.id === row.productId), variant: variants.find(v => v.id === row.variantId) || null }),
  update: async values => { Object.assign(row, values); return wrap(row, table); },
  destroy: async () => { state[table] = state[table].filter(r => r.id !== row.id); } };
const model = table => ({
 findOne: async ({ where }) => wrap(state[table].find(row => matches(row, where)), table),
 findAll: async ({ where }) => state[table].filter(row => matches(row, where)).map(row => ({ ...wrap(row, table), product: products.find(p => p.id === row.productId) })),
 create: async values => { const row = { id: ++state.next, ...values }; state[table].push(row); return wrap(row, table); },
 destroy: async ({ where }) => { const old = state[table].length; state[table] = state[table].filter(row => !matches(row, where)); return old - state[table].length; },
 bulkCreate: async rows => { if (broken) throw Error('private database detail'); for (const row of rows) state[table].push({ id: ++state.next, ...row }); },
});
stub('../../config/db', { transaction: async work => { const snapshot = structuredClone(state); try { return await work({ LOCK: { UPDATE: 'UPDATE' } }); } catch (error) { state = snapshot; throw error; } } });
stub('../../models', { Customer: { findByPk: async id => ({ id }) }, Cart: model('carts'), CartItem: model('items'), Wishlist: model('wishlist'),
 Product: { findByPk: async id => products.find(p => p.id === id) }, ProductVariant: { findOne: async ({ where }) => variants.find(v => matches(v, where)) } });
const cart = require('../cart/cartController'), wishlist = require('../wishlist/wishlistController');
const call = async (fn, body, itemId, customerId = 7) => {
 let status = 200, data;
 await fn({ customer: { id: customerId }, body, params: { itemId }, headers: {}, get: () => 'example.com', protocol: 'https' }, { status(code) { status = code; return this; }, json(value) { data = value; } });
 return { status, data };
};
beforeEach(() => { state = { carts: [], items: [], wishlist: [], next: 0 }; broken = false; });
test('cart add increments selection and refuses excess stock without mutation', async () => {
 assert.equal((await call(cart.addToCart, { productId: 1, quantity: 2 })).status, 200);
 await call(cart.addToCart, { productId: 1, quantity: 2 });
 assert.equal(state.items[0].quantity, 4);
 assert.equal((await call(cart.addToCart, { productId: 1, quantity: 2 })).status, 409);
 assert.equal(state.items[0].quantity, 4);
 const result = await call(cart.getCart);
 assert.equal(result.data.cart.subtotal, 42);
 assert.equal(result.data.cart.items[0].stockStatus, 'VALID');
});
test('invalid quantities, IDs and unrelated variants are rejected', async () => {
 for (const quantity of ['2', 0, -1, 1.5, null, true]) assert.equal((await call(cart.addToCart, { productId: 1, quantity })).status, 400);
 assert.equal((await call(cart.addToCart, { productId: 2, variantId: 3 })).status, 404);
 assert.equal((await call(cart.addToCart, null)).status, 400);
 assert.equal((await call(cart.removeFromCart, null, '1abc')).status, 400);
 assert.equal(state.items.length, 0);
});
test('zero-priced variants retain their price; zero update removes item', async () => {
 await call(cart.addToCart, { productId: 1, variantId: 3 });
 assert.equal(state.items[0].priceAtAdd, 0);
 assert.equal((await call(cart.getCart)).data.cart.subtotal, 0);
 await call(cart.updateCartItem, { quantity: 0 }, state.items[0].id);
 assert.equal(state.items.length, 0);
});
test('customer cannot update or remove another customer cart or wishlist', async () => {
 await call(cart.addToCart, { productId: 1 });
 const id = state.items[0].id;
 assert.equal((await call(cart.updateCartItem, { quantity: 2 }, id, 8)).status, 404);
 assert.equal((await call(cart.removeFromCart, null, id, 8)).status, 404);
 await call(wishlist.addToWishlist, { productId: 1 });
 assert.equal((await call(wishlist.removeFromWishlist, null, state.wishlist[0].id, 8)).status, 404);
 assert.equal((await call(wishlist.getWishlist, null, null, 8)).data.total, 0);
});
test('sync validates the entire snapshot and rolls back failed replacement', async () => {
 await call(cart.addToCart, { productId: 1 });
 const original = structuredClone(state);
 for (const items of [[{ productId: 1 }, { productId: 2 }], [{ productId: 1 }, { productId: 1 }], [{ productId: 999 }], [{ productId: 1, quantity: 6 }]]) {
  assert.ok((await call(cart.syncCart, { items })).status >= 400);
  assert.deepEqual(state, original);
 }
 broken = true;
 const failure = await call(cart.syncCart, { items: [{ productId: 1, quantity: 2 }] });
 assert.equal(failure.status, 500);
 assert.doesNotMatch(failure.data.message, /private/);
 assert.deepEqual(state, original);
 broken = false;
 await call(cart.syncCart, { items: [] });
 assert.equal(state.items.length, 0);
});
test('wishlist add is idempotent and toggle removes the exact variant', async () => {
 await call(wishlist.addToWishlist, { productId: 1 });
 await call(wishlist.addToWishlist, { productId: 1 });
 await call(wishlist.addToWishlist, { productId: 1, variantId: 3 });
 assert.equal(state.wishlist.length, 2);
 assert.equal((await call(wishlist.getWishlist)).data.total, 2);
 await call(wishlist.toggleWishlist, { productId: 1, variantId: 3 });
 assert.equal(state.wishlist.length, 1);
 assert.equal(state.wishlist[0].variantId, null);
 await call(wishlist.clearWishlist);
 assert.equal(state.wishlist.length, 0);
});
