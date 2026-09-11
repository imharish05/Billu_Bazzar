'use strict';
// Local, interactive Razorpay sandbox verification. Email stays in a test sink.
require('dotenv').config({ quiet: true });
if (process.env.NODE_ENV === 'production' || !['127.0.0.1', 'localhost'].includes(process.env.DB_HOST) || !process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')) throw Error('Local DB and Razorpay test key required');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const email = require('../services/emailService');
for (const key of Object.keys(email)) if (typeof email[key] === 'function') email[key] = async () => true;
const db = require('../models');
const sequelize = require('../config/db');
sequelize.options.logging = false;
const results = { startedAt: new Date().toISOString(), mode: 'Actual Razorpay test-mode gateway; notification sink; no real charge', checks: [] };
const save = () => fs.writeFileSync(path.join(__dirname, 'payment-results.json'), JSON.stringify(results, null, 2));
(async () => {
  await sequelize.authenticate();
  const stamp = Date.now();
  const customer = await db.Customer.create({ name: '[API QA] Payment', email: `mobile.payment.${stamp}@example.com`, password: await require('bcryptjs').hash(crypto.randomBytes(24).toString('hex'), 12) });
  const category = await db.Category.create({ name: '[API QA] Payment', slug: `qa-payment-${stamp}` });
  const product = await db.Product.create({ name: '[API QA] Payment', slug: `qa-payment-${stamp}`, categoryId: category.id, price: 1, stock: 10 });
  results.fixtures = { customerId: customer.id, productId: product.id, categoryId: category.id };
  const token = require('../config/jwt').signMobileToken({ id: customer.id });
  const app = express(); app.use(express.json()); app.use('/mob-api', require('../mob-api'));
  const server = app.listen(5101, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const base = 'http://127.0.0.1:5101';
  const api = async (route, body) => {
    const response = await fetch(base + '/mob-api' + route, { method: body ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, data: await response.json() };
  };
  const address = { name: '[API QA]', email: customer.email, phone: '+919876543210', address: 'QA test address', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', country: 'India' };
  const placed = await api('/orders', { shippingAddress: address, billingAddress: address, paymentMethod: 'Razorpay Secure Online', geoCountry: 'IN', requestedCurrency: 'INR', isBuyNow: true, buyNowItem: { productId: product.id, quantity: 1 }, notes: '[API QA] Actual sandbox payment; no physical shipment' });
  if (placed.status !== 201) throw Error('QA order placement failed: ' + placed.status);
  const orderId = placed.data.order.id; results.fixtures.orderId = orderId;
  const payment = await api('/payments/initiate', { orderId });
  const realOrder = payment.status === 200 && payment.data.order_id && !payment.data.order_id.startsWith('order_sim_');
  results.checks.push({ name: 'Actual sandbox initiation through mobile API', status: realOrder ? 'PASS' : 'FAIL', httpStatus: payment.status }); save();
  if (!realOrder) throw Error('Gateway did not return a real sandbox order');
  const sessionPath = '/qa-' + crypto.randomBytes(16).toString('hex');
  app.get(sessionPath, (req, res) => res.type('html').send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mobile API sandbox payment</title></head><body><h1>Razorpay test payment</h1><p>Dedicated QA order ${orderId}. Use Razorpay test details only. No physical shipment.</p><button id="pay">Open test checkout</button><pre id="result"></pre><script src="https://checkout.razorpay.com/v1/checkout.js"></script><script>
document.getElementById('pay').onclick=()=>new Razorpay({key:${JSON.stringify(payment.data.key)},order_id:${JSON.stringify(payment.data.order_id)},amount:${JSON.stringify(payment.data.amount)},currency:'INR',name:'Billu Bazaar QA',description:'Sandbox mobile API verification',handler:async function(response){const r=await fetch(location.pathname+'/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(response)});document.getElementById('result').textContent=JSON.stringify(await r.json(),null,2);}}).open();
</script></body></html>`));
  app.post(sessionPath + '/complete', async (req, res) => {
    try {
      const payload = { orderId, razorpayPaymentId: req.body.razorpay_payment_id, razorpayOrderId: req.body.razorpay_order_id, razorpaySignature: req.body.razorpay_signature };
      const verified = await api('/payments/verify', payload);
      const persisted = await db.Order.findByPk(orderId);
      const passed = verified.status === 200 && persisted.paymentStatus === 'PAID';
      results.checks.push({ name: 'Real sandbox callback verified and payment persisted', status: passed ? 'PASS' : 'FAIL', httpStatus: verified.status });
      if (passed) {
        const replay = await api('/payments/verify', payload);
        results.checks.push({ name: 'Paid callback replay', status: replay.status === 200 ? 'PASS' : 'FAIL', httpStatus: replay.status });
        await product.update({ isActive: false }); await category.update({ isActive: false });
      }
      save(); res.status(passed ? 200 : 400).json({ success: passed, message: passed ? 'Sandbox payment verified. QA records retained; no shipment.' : 'Verification failed; check sanitized payment-results.json.' });
    } catch { res.status(500).json({ success: false, message: 'Verification error' }); }
  });
  fs.writeFileSync(path.join(__dirname, 'payment-session.local.json'), JSON.stringify({ url: base + sessionPath }, null, 2));
  console.log('Sandbox checkout ready: ' + base + sessionPath);
})().catch(error => { results.checks.push({ name: 'Setup', status: 'FAIL', error: error.message }); save(); console.error(error.message); process.exit(1); });
