'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
process.env.JWT_SECRET = 'mobile-api-test-secret-not-for-production';
const stub = (file, exports) => { require.cache[require.resolve(file)] = { id: require.resolve(file), filename: require.resolve(file), loaded: true, exports }; };
let active = true;
let dbFailure = false;
const models = {
  Customer: { findByPk: async id => { if (dbFailure) throw Error('database unavailable'); return id === 7 ? { id, isActive: active, email: 'customer@example.com' } : null; } },
  Order: { findOne: async ({ where }) => Number(where.id) === 10 && where.customerId === 7 ? { id: 10, customerId: 7, paymentGatewayRef: 'owned-ref' } : null },
  Product: { findAndCountAll: async options => { assert.equal(options.where.isActive, true); return { rows: [], count: 0 }; }, findOne: async ({ where }) => Number(where.id) === 1 ? { id: 1 } : null },
  ProductVariant: { findAndCountAll: async options => {
    assert.deepEqual(options.include[0].where, { isActive: true });
    assert.equal(options.include[0].required, true);
    assert.equal(options.attributes.includes('warehouseId'), false);
    assert.equal(options.limit, 2);
    assert.equal(options.offset, 2);
    return { rows: [{ id: 5, productId: 1, product: { id: 1, name: 'Active', slug: 'active' } }], count: 3 };
  } },
  Coupon: { findAll: async () => [] },
};
stub('../../models', models);
stub('../../services/emailService', { sendOtpEmail: async () => {} });
stub('../../middleware/upload', { fields: () => (req, res, next) => next() });
const fs = require('fs');
const featureRoot = path.join(__dirname, '..');
const endpoints = [];
const shared = new Map();
for (const name of fs.readdirSync(featureRoot)) {
  if (name === 'Auth') continue;
  const routeFile = path.join(featureRoot, name, name + 'Routes.js');
  if (!fs.existsSync(routeFile)) continue;
  const source = fs.readFileSync(routeFile, 'utf8');
  for (const match of source.matchAll(/router\.(get|post|put|patch|delete)\('([^']+)'/g)) endpoints.push([match[1], match[2]]);
  const controller = fs.readFileSync(path.join(featureRoot, name, name + 'Controller.js'), 'utf8');
  for (const [, variable, file] of controller.matchAll(/const (\w+) = require\('..\/..\/controllers\/(\w+)Controller'\)/g)) {
    if (!shared.has(file)) shared.set(file, {});
    for (const [, action] of controller.matchAll(new RegExp(variable + '\\.([A-Za-z]+)', 'g'))) shared.get(file)[action] = (req, res) => res.json({ success: true, customerId: req.customer?.id, query: req.query, action });
  }
}
for (const [source, handlers] of shared) stub(path.join('../../controllers', source + 'Controller'), handlers);
const { signMobileToken } = require('../../config/jwt');
const token = signMobileToken({ id: 7 });
let server;
let base;
before(async () => {
  const app = express();
  app.use(express.json());
  require('../swaggerUi')(app);
  const router = require('../index');
  app.use('/mob-api', router);
  app.use('/api/mob', router);
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
});
after(() => new Promise(resolve => server.close(resolve)));
const request = (url, { access = token, method = 'GET', body } = {}) => fetch(base + url, {
  method, headers: { ...(access ? { Authorization: 'Bearer ' + access } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
  ...(body ? { body: JSON.stringify(body) } : {}),
});

test('every feature route requires authentication on both mounts', async () => {
  for (const prefix of ['/mob-api', '/api/mob']) for (const [method, route] of endpoints) {
    const result = await request(prefix + route.replace(/:[A-Za-z]+/g, '1'), { access: null, method: method.toUpperCase() });
    assert.equal(result.status, 401, method + ' ' + prefix + route);
  }
});
test('storefront routes are strictly protected and require authentication on both mounts', async () => {
  for (const prefix of ['/mob-api', '/api/mob']) {
    for (const route of ['/products', '/categories', '/banners', '/reviews/product/1']) {
      const response = await request(prefix + route, { access: null });
      assert.equal(response.status, 401, route + ' must return 401 unauthenticated');
      const authedResponse = await request(prefix + route);
      assert.equal(authedResponse.status, 200, route + ' must return 200 with token');
    }
    assert.equal((await request(prefix + '/reviews/my-delivered-items', { access: null })).status, 401);
  }
});
test('rejects admin, reset, expired, and forged tokens', async () => {
  const claims = [{ id: 7, type: 'ADMIN' }, { id: 7, purpose: 'password_reset' }, { id: 7, exp: 1 }];
  for (const payload of claims) assert.equal((await request('/mob-api/cart', { access: jwt.sign(payload, process.env.JWT_SECRET) })).status, 401);
  assert.equal((await request('/mob-api/cart', { access: jwt.sign({ id: 7 }, 'wrong-secret') })).status, 401);
});
test('accepts original mobile tokens and strips admin catalog flags', async () => {
  const result = await request('/mob-api/products?admin=true&all=true&limit=999');
  assert.equal(result.status, 200);
  const data = await result.json();
  assert.equal(data.success, true);
  assert.equal(data.limit, 100);
  assert.deepEqual(data.products, []);
  assert.equal((await request('/api/mob/products?limit=-1')).status, 400);
});
test('variant catalog is paginated and newsletter site-settings alias is mounted', async () => {
  const variants = await request('/mob-api/variants?page=2&limit=2');
  assert.equal(variants.status, 200);
  assert.deepEqual(await variants.json(), { success: true, variants: [{ id: 5, productId: 1, product: { id: 1, name: 'Active', slug: 'active' } }], total: 3, page: 2, limit: 2, totalPages: 2, hasMore: false });
  assert.equal((await request('/api/mob/variants?limit=0')).status, 400);
  assert.equal((await request('/mob-api/variants', { access: null })).status, 401);
  const newsletter = await request('/mob-api/site-settings/newsletter-subscribe', { method: 'POST', body: { email: 'customer@example.com' } });
  assert.equal(newsletter.status, 200);
  assert.equal((await (await request('/api/mob/site-settings/newsletter-subscribe', { method: 'POST', body: { email: 'customer@example.com' } })).json()).action, 'subscribeNewsletter');
});
test('rejects inactive or missing customers and reports database outages as server errors', async () => {
  active = false;
  assert.equal((await request('/mob-api/cart')).status, 401);
  active = true;
  assert.equal((await request('/mob-api/cart', { access: signMobileToken({ id: 99 }) })).status, 401);
  dbFailure = true;
  assert.equal((await request('/mob-api/cart')).status, 500);
  dbFailure = false;
});
test('payment and support controllers enforce order ownership', async () => {
  for (const route of ['/payments/initiate', '/payments/verify', '/customers/tickets']) {
    assert.equal((await request('/mob-api' + route, { method: 'POST', body: { orderId: 11 } })).status, 404);
    assert.equal((await request('/mob-api' + route, { method: 'POST', body: { orderId: 10 } })).status, 200);
  }
  assert.equal((await request('/mob-api/payments/verify', { method: 'POST', body: { orderId: 10, orderRef: 'other-order-ref' } })).status, 400);
  assert.equal((await request('/mob-api/payments/initiate', { method: 'POST', body: { orderId: { id: 10 } } })).status, 400);
});
test('admin mutations and settings outside the customer allowlist are unavailable', async () => {
  for (const [method, route] of [['POST', '/products'], ['GET', '/orders'], ['GET', '/cart/admin/abandoned'], ['POST', '/categories/seed'], ['GET', '/site-settings/secrets']]) {
    assert.equal((await request('/mob-api' + route, { method })).status, 404);
  }
  assert.equal((await request('/mob-api/variants/product/999')).status, 404);
});
test('login and recovery are reachable without a token; profile aliases are protected', async () => {
  for (const route of ['/login', '/register', '/forgot-password', '/verify-otp', '/new-password', '/reset-password']) {
    assert.equal((await request('/mob-api/auth' + route, { method: 'POST', access: null, body: {} })).status, 400);
  }
  for (const route of ['/me', '/getme', '/profile']) assert.equal((await request('/mob-api/auth' + route, { access: null })).status, 401);
});
test('Swagger shows only the requested sections while retaining the complete API definitions', async () => {
  const response = await request('/mob-api/openapi.json', { access: null });
  assert.equal(response.status, 200);
  const spec = await response.json();
  const fullSpec = require('../swagger');
  const expectedTags = ['Auth & Security', 'My Profile', 'Categories', 'Search', 'Products & Review', 'Coupons', 'Saved Addresses', 'Cart', 'Wishlist', 'Checkout', 'Delivery Zones', 'Razorpay Payments', 'My Orders', 'Returns', 'Gift Messages', 'Settings'];
  assert.deepEqual(spec.tags.map(tag => tag.name), expectedTags);
  assert.ok(spec.tags.every(tag => tag.description));
  assert.ok(fullSpec.paths['/mob-api/reviews/product/{productId}']);
  assert.deepEqual(spec.paths['/mob-api/reviews/product/{productId}'].get.tags, ['Products & Review']);
  assert.deepEqual(spec.paths['/mob-api/reviews'].post.tags, ['Products & Review']);
  assert.deepEqual(spec.paths['/mob-api/delivery-zones/check/{pincode}'].get.tags, ['Delivery Zones']);
  assert.deepEqual(spec.paths['/mob-api/delivery-zones/check'].get.tags, ['Delivery Zones']);
  assert.ok(fullSpec.paths['/mob-api/delivery-zones/check'].get);
  assert.ok(spec.paths['/mob-api/cart']);
  assert.ok(spec.paths['/mob-api/wishlist']);
  for (const route of ['/mob-api/myaccount/profile', '/mob-api/myaccount/change-password']) {
    assert.ok(spec.paths[route]);
    for (const operation of Object.values(spec.paths[route])) assert.deepEqual(operation.tags, ['My Profile']);
  }
  for (const route of ['/mob-api/orders/my', '/mob-api/orders/my/{id}', '/mob-api/orders/my/{id}/cancel', '/mob-api/orders/track/{identifier}']) {
    assert.ok(spec.paths[route]);
    for (const operation of Object.values(spec.paths[route])) assert.deepEqual(operation.tags, ['My Orders']);
  }
  assert.equal(spec.paths['/mob-api/orders'], undefined);
  assert.equal(spec.paths['/mob-api/myaccount/wishlist'], undefined);
  for (const route of ['/mob-api/payments/initiate', '/mob-api/payments/verify']) {
    assert.deepEqual(spec.paths[route].post.tags, ['Razorpay Payments']);
  }
  assert.equal(spec.paths['/mob-api/payments/geo-detect'], undefined);
  for (const route of ['/mob-api/returns/my', '/mob-api/returns/my/{id}', '/mob-api/returns/request']) {
    assert.ok(spec.paths[route]);
  }
  assert.deepEqual(spec.paths['/mob-api/gift-service'].get.tags, ['Gift Messages']);
  assert.deepEqual(spec.paths['/mob-api/checkout/place-order'].post.tags, ['Checkout', 'Gift Messages']);
  assert.ok(spec.paths['/mob-api/checkout/place-order'].post.requestBody.content['application/json'].schema.properties.giftMessage);
  assert.ok(spec.components.schemas.Error);
  assert.deepEqual(await (await request('/api/mob/openapi.json', { access: null })).json(), spec);
  for (const route of ['/mob-api/banners', '/mob-api/marketing-messages']) {
    assert.equal(spec.paths[route], undefined);
    assert.ok(fullSpec.paths[route]);
  }
  const hiddenPaths = new Set([
    '/mob-api/search/trending', '/mob-api/search/track', '/mob-api/search/autocomplete',
    '/mob-api/customers/wishlist', '/mob-api/customers/loyalty', '/mob-api/customers/tickets',
    '/mob-api/auth/profile', '/mob-api/auth/change-password',
    '/mob-api/myaccount/wishlist', '/mob-api/myaccount/loyalty', '/mob-api/myaccount/tickets',
    '/mob-api/orders',
    '/mob-api/payments/geo-detect',
  ]);
  const sourceTags = new Set(['Auth & Security', 'myaccount', 'categories', 'search', 'products', 'reviews', 'coupons', 'addresses', 'cart', 'wishlist', 'checkout', 'delivery', 'payments', 'orders', 'returns', 'gifts', 'settings']);
  for (const [route, operations] of Object.entries(fullSpec.paths)) {
    for (const [method, operation] of Object.entries(operations)) {
      assert.equal(Boolean(spec.paths[route]?.[method]), !hiddenPaths.has(route) && operation.tags.some(tag => sourceTags.has(tag)), method + ' ' + route);
    }
  }
  for (const operations of Object.values(spec.paths)) for (const operation of Object.values(operations)) {
    assert.ok(operation.tags.every(tag => expectedTags.includes(tag)));
    assert.ok(operation.description, operation.summary);
  }
  for (const [method, route, , , , schema] of endpoints) {
    const operation = fullSpec.paths['/mob-api' + route.replace(/:([A-Za-z]+)/g, '{$1}')][method];
    assert.deepEqual(operation.security, [{ bearerAuth: [] }]);
    if (schema) assert.ok(operation.requestBody);
  }
  for (const url of ['/mob-api/docs/', '/mob-api-docs/', '/api/mob/docs/']) {
    const page = await request(url, { access: null });
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Mobile Customer API/);
    const initializer = await (await request(url + 'swagger-ui-init.js', { access: null })).text();
    assert.match(initializer, /"defaultModelsExpandDepth":\s*-1/);
    assert.doesNotMatch(initializer, /"tagsSorter":\s*"alpha"/);
  }
});


test('every Swagger operation has success examples and valid structured request fixtures', () => {
  const spec = require('../swagger');
  const validate = (schema, value, context) => {
    if (!schema) return;
    if (value === null && schema.nullable) return;
    if (schema.type === 'object') {
      assert.ok(value && typeof value === 'object' && !Array.isArray(value), context);
      for (const key of schema.required || []) assert.ok(key in value, context + ' missing ' + key);
      for (const [key, item] of Object.entries(value)) validate(schema.properties?.[key], item, context + '.' + key);
    } else if (schema.type === 'array') {
      assert.ok(Array.isArray(value), context);
      for (const item of value) validate(schema.items, item, context);
    } else if (schema.type === 'integer') assert.ok(Number.isInteger(value), context);
    else if (schema.type) assert.equal(typeof value, schema.type, context);
    if (schema.enum) assert.ok(schema.enum.includes(value), context);
    if (schema.minimum !== undefined) assert.ok(value >= schema.minimum, context);
    if (schema.maximum !== undefined) assert.ok(value <= schema.maximum, context);
  };
  for (const [route, methods] of Object.entries(spec.paths)) for (const [method, operation] of Object.entries(methods)) {
    for (const [status, response] of Object.entries(operation.responses)) if (/^2\d\d$/.test(status)) {
      const media = response.content?.['application/json'];
      assert.equal(media?.example?.success, true, method + ' ' + route + ' ' + status);
      validate(media.schema, media.example, route);
    }
    for (const media of Object.values(operation.requestBody?.content || {})) {
      assert.ok(media.example, method + ' ' + route);
      validate(media.schema, media.example, route);
    }
  }
  assert.deepEqual(Object.keys(spec.paths['/mob-api/auth/login'].post.responses['200'].content['application/json'].example).sort(), ['message', 'success', 'token']);
  assert.ok(spec.paths['/mob-api/cart'].get.responses['200'].content['application/json'].example.cart.items.length);
  assert.ok(spec.paths['/mob-api/contact-enquiries'].post.responses['201']);
  assert.ok(spec.paths['/mob-api/stock-alerts'].post.responses['201']);
});
