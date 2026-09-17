'use strict';
const router = require('express').Router();
const controller = require('./checkoutController');
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, keyGenerator: req => String(req.customer.id) });

router.get('/checkout', controller.getCheckout);
router.post('/checkout/place-order', controller.placeOrder);
router.post('/checkout/payments/initiate', controller.initiatePayment);
router.post('/checkout/payments/verify', controller.verifyPayment);

router.post('/checkout/send-otp', limiter, controller.sendCheckoutOtp);
router.post('/checkout/verify-otp', limiter, controller.verifyCheckoutOtp);
router.post('/auth/send-checkout-otp', limiter, controller.sendCheckoutOtp);
router.post('/auth/verify-checkout-otp', limiter, controller.verifyCheckoutOtp);

module.exports = router;
