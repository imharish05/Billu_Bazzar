'use strict';
// Shared by mobile previews and final order pricing.
const couponReason = (coupon, subtotal, used = 0, now = new Date()) => {
  if (!coupon || !coupon.isActive) return 'Coupon is unavailable';
  const from = new Date(coupon.validFrom).getTime(), until = new Date(coupon.validUntil).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(until) || from > until) return 'Coupon is unavailable';
  if (from > now.getTime()) return 'Coupon is not active yet';
  if (until < now.getTime()) return 'Coupon has expired';
  if (!['PERCENT', 'FLAT', 'FREE_SHIPPING'].includes(coupon.type) || !Number.isFinite(Number(coupon.value)) || Number(coupon.value) < 0) return 'Coupon is unavailable';
  if (subtotal !== undefined && subtotal < Number(coupon.minOrderValue || 0)) return `Minimum order value is ${Number(coupon.minOrderValue || 0)}`;
  if (Number(coupon.usageLimit) > 0 && used >= Number(coupon.usageLimit)) return 'Coupon redemption limit reached for this customer';
  return null;
};
const couponDiscount = (coupon, subtotal) => {
  let discount = 0;
  if (coupon.type === 'PERCENT') discount = Math.min(subtotal * Number(coupon.value) / 100, Number(coupon.maxDiscount || Infinity));
  if (coupon.type === 'FLAT') discount = Number(coupon.value);
  return Math.round(Math.max(0, Math.min(discount, subtotal)) * 100) / 100;
};
module.exports = { couponReason, couponDiscount };
