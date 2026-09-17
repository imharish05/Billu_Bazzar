'use strict';
const { Coupon, Order } = require('../../models');
const { Op } = require('sequelize');
const { couponReason, couponDiscount } = require('../../services/couponRules');
const publicFields = ['id', 'code', 'type', 'value', 'minOrderValue', 'maxDiscount', 'validFrom', 'validUntil', 'description', 'usageLimit'];
const serialize = row => {
  const coupon = typeof row.toJSON === 'function' ? row.toJSON() : row;
  return Object.fromEntries(publicFields.map(field => [field, coupon[field] ?? null]));
};
const readSubtotal = (value, query = false) => {
  if (query && typeof value === 'string' && /^\d+(\.\d{1,2})?$/.test(value)) value = Number(value);
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 99999999.99 || Math.abs(value * 100 - Math.round(value * 100)) > 0.00001) {
    throw Object.assign(new Error('subtotal must be a non-negative number with at most two decimal places'), { status: 400 });
  }
  return value;
};
const usageWhere = customerId => ({ customerId, status: { [Op.ne]: 'CANCELLED' } });
exports.getCoupons = async (req, res, next) => {
  try {
    const subtotal = req.query.subtotal === undefined ? undefined : readSubtotal(req.query.subtotal, true);
    const page = Number(req.query.page || 1), limit = Number(req.query.limit || 20);
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger((page - 1) * limit)) return res.status(400).json({ success: false, message: 'Invalid pagination' });
    const now = new Date();
    const [rows, orders] = await Promise.all([
      Coupon.findAll({ where: { isActive: true, validFrom: { [Op.lte]: now }, validUntil: { [Op.gte]: now } }, order: [['createdAt', 'DESC'], ['id', 'DESC']] }),
      Order.findAll({ where: usageWhere(req.customer.id), attributes: ['couponId'] }),
    ]);
    const usage = new Map();
    for (const order of orders) if (order.couponId) usage.set(order.couponId, (usage.get(order.couponId) || 0) + 1);
    const eligible = rows.filter(coupon => !couponReason(coupon, subtotal, usage.get(coupon.id) || 0, now));
    const coupons = eligible.slice((page - 1) * limit, page * limit).map(coupon => ({ ...serialize(coupon),
      ...(subtotal === undefined ? {} : { discountAmount: couponDiscount(coupon, subtotal), freeShipping: coupon.type === 'FREE_SHIPPING' }) }));
    return res.json({ success: true, coupons, total: eligible.length, page, limit, totalPages: Math.ceil(eligible.length / limit), hasMore: page * limit < eligible.length });
  } catch (error) { if (error.status) return res.status(error.status).json({ success: false, message: error.message }); return next(error); }
};
exports.validate = async (req, res, next) => {
  try {
    const body = req.body || {};
    if (typeof body.code !== 'string' || !body.code.trim() || body.code.trim().length > 30) return res.status(400).json({ success: false, valid: false, message: 'code must contain 1 to 30 characters' });
    const subtotal = readSubtotal(body.subtotal ?? body.cartSubtotal);
    const code = body.code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ where: { code } });
    if (!coupon) return res.status(404).json({ success: false, valid: false, message: 'Invalid coupon code' });
    const used = Number(coupon.usageLimit) > 0 ? await Order.count({ where: { ...usageWhere(req.customer.id), couponId: coupon.id } }) : 0;
    const reason = couponReason(coupon, subtotal, used);
    if (reason) return res.status(400).json({ success: false, valid: false, message: reason });
    const discountAmount = couponDiscount(coupon, subtotal);
    return res.json({ success: true, valid: true, coupon: serialize(coupon), subtotal, discountAmount,
      discountedSubtotal: Math.round((subtotal - discountAmount) * 100) / 100, freeShipping: coupon.type === 'FREE_SHIPPING' });
  } catch (error) { if (error.status) return res.status(error.status).json({ success: false, valid: false, message: error.message }); return next(error); }
};
