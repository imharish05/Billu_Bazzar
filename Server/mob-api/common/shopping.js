'use strict';
const { Customer, Product, ProductVariant } = require('../../models');
const sequelize = require('../../config/db');
const { formatMobileProducts } = require('../products/productResponse');
const fail = (status, message, extra = {}) => { throw Object.assign(new Error(message), { status, extra }); };
const integer = (value, name, minimum = 1) => {
  if (!Number.isSafeInteger(value) || value < minimum || value > 2147483647) fail(400, `${name} must be an integer between ${minimum} and 2147483647`);
  return value;
};
const itemId = value => {
  if (!/^[1-9]\d*$/.test(String(value))) fail(400, 'Invalid itemId');
  return integer(Number(value), 'itemId');
};
const selection = (body, quantity = false) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'A JSON object is required');
  return { productId: integer(body.productId, 'productId'), variantId: body.variantId == null ? null : integer(body.variantId, 'variantId'),
    ...(quantity ? { quantity: integer(body.quantity === undefined ? 1 : body.quantity, 'quantity') } : {}) };
};
const resolveProduct = async ({ productId, variantId }, transaction) => {
  const product = await Product.findByPk(productId, { transaction });
  if (!product || !product.isActive) fail(404, 'Product not found or inactive');
  const variant = variantId == null ? null : await ProductVariant.findOne({ where: { id: variantId, productId }, transaction });
  if (variantId != null && !variant) fail(404, 'Product variant not found');
  return { product, variant, price: Number(variant?.price ?? product.price), stock: Math.max(0, Number(variant?.stock ?? product.stock) || 0) };
};
// Serialize mobile mutations, including first-cart creation and nullable variant keys.
const mutate = (req, work) => sequelize.transaction(async transaction => {
  const customer = await Customer.findByPk(req.customer.id, { transaction, lock: transaction.LOCK.UPDATE });
  if (!customer) fail(401, 'Customer not found');
  return work(transaction);
});
const handler = work => async (req, res) => {
  try { res.json({ success: true, ...await work(req) }); }
  catch (error) {
    if (!error.status) console.error('[Mobile shopping]', error.message);
    res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Unable to process shopping request', ...error.extra });
  }
};
const include = [{ model: Product, as: 'product' }, { model: ProductVariant, as: 'variant' }];
const formatItem = async (row, req) => {
  const item = row.toJSON();
  if (!item.product) return { ...item, product: null, variant: null };
  const [product] = await formatMobileProducts([{ ...item.product, variants: item.variant ? [item.variant] : [] }], req);
  const variant = product.variants[0] || null;
  delete product.variants;
  return { ...item, product, variant };
};
module.exports = { fail, integer, itemId, selection, resolveProduct, mutate, handler, include, formatItem };
