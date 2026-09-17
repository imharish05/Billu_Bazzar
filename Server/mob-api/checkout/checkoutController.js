'use strict';
const auth = require('../../controllers/authController');
const { CustomerAddress } = require('../../models');
const { getCartData } = require('../cart/cartController');
const { resolveOrderAddresses } = require('../addresses/addressesController');
const order = require('../../controllers/orderController');
const payments = require('../payments/paymentsController');

exports.sendCheckoutOtp = (req, res, next) => auth.sendCheckoutOtp(req, res, next);
exports.verifyCheckoutOtp = (req, res, next) => auth.verifyCheckoutOtp(req, res, next);
exports.getCheckout = async (req, res, next) => {
  try {
    const [{ cart }, addresses] = await Promise.all([
      getCartData(req),
      CustomerAddress.findAll({ where: { customerId: req.customer.id }, order: [['isDefault', 'DESC'], ['id', 'ASC']] }),
    ]);
    return res.json({ success: true, checkout: {
      cart, addresses, defaultAddressId: addresses.find(address => address.isDefault)?.id || null,
      stockIssues: cart.items.filter(item => item.stockStatus !== 'VALID').map(item => ({ itemId: item.id, productId: item.productId, variantId: item.variantId, stockStatus: item.stockStatus, availableStock: item.availableStock })),
      totalsAreFinal: false,
    } });
  } catch (error) { return next(error); }
};
const bad = message => Object.assign(new Error(message), { status: 400 });
const normalizeAddress = (input, customer) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw bad('A shipping address is required');
  const address = { ...input, fullName: input.fullName || input.name, flatHouse: input.flatHouse || [input.address, input.addressLine2].filter(Boolean).join(', '), email: input.email || customer.email };
  for (const field of ['fullName', 'phone', 'flatHouse', 'city', 'state', 'country', 'pincode']) {
    if (typeof address[field] !== 'string' || !address[field].trim() || address[field].length > 500) throw bad(`Address ${field} is required and must be a valid string`);
    address[field] = address[field].trim();
  }
  if (!/^\+?[\d ()-]{7,20}$/.test(address.phone) || address.phone.replace(/\D/g, '').length < 7) throw bad('Invalid address phone');
  return address;
};
exports.placeOrder = async (req, res, next) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw bad('A JSON object is required');
    if (!['COD', 'Cash on Delivery (COD)', 'Razorpay Secure Online', 'Telr Secure Online'].includes(body.paymentMethod)) throw bad('Choose a supported paymentMethod');
    if (body.requestedCurrency !== undefined && !['INR', 'AED'].includes(body.requestedCurrency)) throw bad('requestedCurrency must be INR or AED');
    for (const field of ['isBuyNow', 'isGiftWrap', 'redeemPoints']) if (body[field] !== undefined && typeof body[field] !== 'boolean') throw bad(`${field} must be a boolean`);
    if (body.couponCode !== undefined && (typeof body.couponCode !== 'string' || body.couponCode.trim().length > 30)) throw bad('Invalid couponCode');
    if (body.isBuyNow) {
      const item = body.buyNowItem;
      if (!item || !Number.isSafeInteger(item.productId) || item.productId < 1 || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 2147483647 || (item.variantId != null && (!Number.isSafeInteger(item.variantId) || item.variantId < 1))) throw bad('buyNowItem requires positive integer productId and quantity, and an optional variantId');
    }
    return resolveOrderAddresses(req, res, error => {
      if (error) return next(error);
      try {
        req.body.shippingAddress = normalizeAddress(req.body.shippingAddress, req.customer);
        if (!['india', 'in'].includes(req.body.shippingAddress.country.toLowerCase()) || !/^\d{6}$/.test(req.body.shippingAddress.pincode)) throw bad('Delivery requires an Indian address with a six-digit pincode');
        req.body.shippingAddress.country = 'India';
        if (req.body.billingAddress !== undefined) req.body.billingAddress = normalizeAddress(req.body.billingAddress, req.customer);
        return order.placeOrder(req, res, next);
      } catch (err) { if (err.status) return res.status(err.status).json({ success: false, message: err.message }); return next(err); }
    });
  } catch (error) { if (error.status) return res.status(error.status).json({ success: false, message: error.message }); return next(error); }
};
exports.initiatePayment = payments.initiatePayment;
exports.verifyPayment = payments.verifyPayment;
