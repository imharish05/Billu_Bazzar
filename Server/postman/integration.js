'use strict';
// Real HTTP + configured test MySQL. Email is intercepted in this process only.
// Never use this against a production database. No gateway success is simulated.
require('dotenv').config({ quiet: true });
if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1'].includes(process.env.DB_HOST)) {
  throw new Error('Integration fixtures require a local test database');
}
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const newman = require(process.env.NEWMAN_MODULE || 'newman');
const email = require('../services/emailService');
let recoveryOtp;
let checkoutOtp;
const notifications = [];
const originalLog = console.log;
console.log = (...args) => {
  if (args.some(value => /OTP generated|resetToken/i.test(String(value)))) return;
  originalLog(...args);
};
for (const key of Object.keys(email)) if (typeof email[key] === 'function') {
  email[key] = async (...args) => {
    notifications.push(key);
    if (key === 'sendOtpEmail') recoveryOtp = String(args[2]);
    if (key === 'sendFraudOtpEmail') checkoutOtp = String(args[2]);
    return true;
  };
}
const db = require('../models');
const sequelize = require('../config/db');
sequelize.options.logging = false;
const rows = [];
let server;
let base;
let token;
const runId = Date.now();
const fixtures = {};
async function check(name, method, route, expected, body, access = token, formdata) {
  const item = { name, request: { method, url: base + '/mob-api' + route,
    header: [...(formdata ? [] : [{ key: 'Content-Type', value: 'application/json' }]), ...(access ? [{ key: 'Authorization', value: 'Bearer ' + access }] : [])],
    ...(formdata ? { body: { mode: 'formdata', formdata } } : body ? { body: { mode: 'raw', raw: JSON.stringify(body) } } : {}) },
    event: [{ listen: 'test', script: { exec: [`pm.test('Expected status',()=>pm.expect(pm.response.code).to.eql(${expected}));`, ...(expected < 300 ? ["pm.test('Application success',()=>pm.expect(pm.response.json().success).to.eql(true));"] : [])] } }] };
  const summary = await new Promise((resolve, reject) => newman.run({ collection: { info: { name, schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' }, item: [item] }, reporters: [], timeoutRequest: 30000 }, (err, result) => err ? reject(err) : resolve(result)));
  const execution = summary.run.executions[0];
  const actual = execution?.response?.code;
  const result = { name, method, route, expected, actual, status: actual === expected && !summary.run.failures.length ? 'PASS' : 'FAIL' };
  rows.push(result);
  console.log(`${result.status}: ${name} (${actual})`);
  let data = {};
  try { data = JSON.parse(execution.response.stream.toString()); } catch {}
  return data;
}
(async () => {
  try {
    await sequelize.authenticate();
    const password = crypto.randomBytes(18).toString('hex') + '!Aa1';
    const customer = await db.Customer.create({ name: '[API QA] Integration', email: `mobile.integration.${runId}@example.com`, password: await bcrypt.hash(password, 12) });
    fixtures.customerId = customer.id;
    token = require('../config/jwt').signMobileToken({ id: customer.id });
    const customerB = await db.Customer.create({ name: '[API QA] Integration B', email: `mobile.integration.b.${runId}@example.com`, password: await bcrypt.hash(password, 12) });
    fixtures.customerBId = customerB.id;
    const tokenB = require('../config/jwt').signMobileToken({ id: customerB.id });
    const category = await db.Category.create({ name: '[API QA] Integration', slug: `qa-integration-${runId}` });
    fixtures.categoryId = category.id;
    const product = await db.Product.create({ name: '[API QA] Integration', slug: `qa-integration-${runId}`, categoryId: category.id, price: 100, stock: 10 });
    fixtures.productId = product.id;
    const other = await db.Product.create({ name: '[API QA] Not purchased', slug: `qa-other-${runId}`, categoryId: category.id, price: 100, stock: 10 });
    fixtures.otherProductId = other.id;
    const coupon = await db.Coupon.create({ code: `QA${runId}`, type: 'FLAT', value: 10, minOrderValue: 50, validFrom: new Date(Date.now()-60000), validUntil: new Date(Date.now()+3600000), usageLimit: 1 });
    fixtures.couponId = coupon.id;
    const address = { name: '[API QA]', email: customer.email, phone: '+919876543210', address: 'QA test address', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', country: 'India' };
    const order = await db.Order.create({ orderNumber: `QA-${runId}`, customerId: customer.id, subtotal: 100, totalAmount: 100, shippingAddress: address, status: 'DELIVERED', paymentStatus: 'PAID', paymentMethod: 'QA fixture', deliveredAt: new Date(), notes: '[API QA] Seeded delivered fixture; no gateway payment or physical delivery occurred' });
    fixtures.deliveredOrderId = order.id;
    const item = await db.OrderItem.create({ orderId: order.id, productId: product.id, productName: product.name, quantity: 1, unitPrice: 100, totalPrice: 100 });
    fixtures.orderItemId = item.id;
    const app = express(); app.use(express.json()); app.use('/mob-api', require('../mob-api'));
    server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
    base = 'http://127.0.0.1:' + server.address().port;
    await check('Valid dedicated coupon', 'POST', '/offers/validate', 200, { code: coupon.code, subtotal: 100 });
    await check('Coupon minimum rejected', 'POST', '/offers/validate', 400, { code: coupon.code, subtotal: 1 });
    const placed = await check('Place online buy-now QA order', 'POST', '/orders', 201, { shippingAddress: address, billingAddress: address, paymentMethod: 'Razorpay Secure Online', geoCountry: 'IN', requestedCurrency: 'INR', isBuyNow: true, buyNowItem: { productId: product.id, quantity: 1 }, notes: '[API QA] Pending online order; no payment' });
    if (placed.order?.id) {
      fixtures.placedOrderId = placed.order.id;
      await check('Other customer cannot read order', 'GET', `/orders/my/${placed.order.id}`, 404, null, tokenB);
      await check('Other customer cannot initiate payment', 'POST', '/payments/initiate', 404, { orderId: placed.order.id }, tokenB);
      await check('Other customer cannot cancel order', 'POST', `/orders/my/${placed.order.id}/cancel`, 404, { reason: 'QA' }, tokenB);
      await check('Cancel own pending order', 'POST', `/orders/my/${placed.order.id}/cancel`, 200, { reason: '[API QA] Test complete' });
    }
    await check('Read owned delivered fixture', 'GET', `/orders/my/${order.id}`, 200);
    await check('Track owned delivered fixture', 'GET', `/orders/track/${order.id}`, 200);
    await check('Delivered review eligibility', 'GET', '/reviews/my-delivered-items', 200);
    await check('Cannot review unpurchased product', 'POST', '/reviews', 403, { productId: other.id, orderId: order.id, rating: 5, body: 'QA mismatch' });
    const review = await check('Create delivered-product review', 'POST', '/reviews', 201, { productId: product.id, orderId: order.id, rating: 5, body: 'QA integration review' });
    if (review.review?.id) {
      await check('Other customer cannot update review', 'PUT', `/reviews/${review.review.id}`, 403, { rating: 1, body: 'QA ownership probe' }, tokenB);
      await check('Update owned review', 'PUT', `/reviews/${review.review.id}`, 200, { rating: 4, body: 'QA updated review' });
      await check('Delete owned review', 'DELETE', `/reviews/${review.review.id}`, 200);
    }
    const returnBody = { orderId: order.id, orderItemId: item.id, quantity: 1, reason: 'DAMAGED', reasonDetails: '[API QA] Test evidence URL, not a real shipment', unboxingVideoUrl: 'https://example.com/qa-unboxing.mp4' };
    const returned = await check('Return delivered fixture with video URL', 'POST', '/returns/request', 201, returnBody);
    if (returned.returnRequest?.id) {
      await check('Read owned return', 'GET', `/returns/my/${returned.returnRequest.id}`, 200);
      await check('Other customer cannot read return', 'GET', `/returns/my/${returned.returnRequest.id}`, 404, null, tokenB);
    }
    await check('Duplicate return rejected', 'POST', '/returns/request', 400, returnBody);
    const uploadItem = await db.OrderItem.create({ orderId: order.id, productId: product.id, productName: '[API QA] Upload fixture', quantity: 1, unitPrice: 100, totalPrice: 100 });
    const videoPath = path.resolve(process.env.RETURN_VIDEO_PATH || path.join(__dirname, 'fixtures/qa-video.mp4'));
    const formdata = [
      { key: 'orderId', type: 'text', value: String(order.id) },
      { key: 'orderItemId', type: 'text', value: String(uploadItem.id) },
      { key: 'quantity', type: 'text', value: '1' },
      { key: 'reason', type: 'text', value: 'DAMAGED' },
      { key: 'reasonDetails', type: 'text', value: '[API QA] Generated video transport fixture' },
      { key: 'video', type: 'file', src: videoPath },
    ];
    const uploaded = await check('Multipart return video upload', 'POST', '/returns/request', 201, null, token, formdata);
    if (uploaded.returnRequest?.id) {
      const stored = await db.ReturnRequest.findByPk(uploaded.returnRequest.id);
      const savedPath = path.join(__dirname, '../uploads/returns', path.basename(stored.unboxingVideoUrl));
      const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
      rows.push({ name: 'Stored video bytes equal uploaded MP4', status: hash(videoPath) === hash(savedPath) ? 'PASS' : 'FAIL' });
    }
    await check('Contact enquiry with notification sink', 'POST', '/contact-enquiries', 201, { name: '[API QA] Contact', email: customer.email, phone: '+919876543210', subject: '[API QA] Notification test', message: 'Dedicated integration test; no response required.' });
    await check('Checkout OTP delivery to sink', 'POST', '/checkout/send-otp', 200, { email: customer.email, name: customer.name });
    await check('Checkout OTP verification', 'POST', '/checkout/verify-otp', 200, { email: customer.email, otp: checkoutOtp });
    await check('Checkout OTP replay rejected', 'POST', '/checkout/verify-otp', 400, { email: customer.email, otp: checkoutOtp });
    await check('Recovery email captured by local sink', 'POST', '/auth/forgot-password', 200, { email: customer.email }, null);
    const recovery = await check('Verify recovery OTP from sink', 'POST', '/auth/verify-otp', 200, { email: customer.email, otp: recoveryOtp }, null);
    if (recovery.resetToken) {
      const newPassword = crypto.randomBytes(18).toString('hex') + '!Bb2';
      await check('Reset dedicated QA password', 'POST', '/auth/reset-password', 200, { resetToken: recovery.resetToken, password: newPassword }, null);
      await check('Login using reset password', 'POST', '/auth/login', 200, { email: customer.email, password: newPassword }, null);
      await check('Old password rejected after reset', 'POST', '/auth/login', 401, { email: customer.email, password }, null);
    }
  } catch (error) {
    console.error('Integration setup/run failed:', error.name);
    rows.push({ name: 'Integration setup/run', status: 'FAIL', error: error.name });
    process.exitCode = 1;
  } finally {
    // Retain clearly labelled QA records for review; hide catalog/coupon fixtures.
    for (const id of [fixtures.productId, fixtures.otherProductId].filter(Boolean)) await db.Product.update({ isActive: false }, { where: { id } });
    if (fixtures.categoryId) await db.Category.update({ isActive: false }, { where: { id: fixtures.categoryId } });
    if (fixtures.couponId) await db.Coupon.update({ isActive: false }, { where: { id: fixtures.couponId } });
    fs.writeFileSync(path.join(__dirname, 'integration-results.json'), JSON.stringify({ executedAt: new Date().toISOString(), mode: 'Newman HTTP + real MySQL; seeded delivered order; email sink; video URL and generated MP4 multipart upload; no gateway verification', fixtures, notifications, rows }, null, 2));
    if (server) await new Promise(resolve => server.close(resolve));
    await sequelize.close();
    if (rows.some(row => row.status === 'FAIL')) process.exitCode = 1;
  }
})();
