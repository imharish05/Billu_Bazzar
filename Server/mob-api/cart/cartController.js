'use strict';
const { Cart, CartItem } = require('../../models');
const { fail, integer, itemId, selection, resolveProduct, mutate, handler, include, formatItem } = require('../common/shopping');
const findCart = (req, transaction) => Cart.findOne({ where: { customerId: req.customer.id }, transaction });
const ensureCart = async (req, transaction) => await findCart(req, transaction) || Cart.create({ customerId: req.customer.id, sessionId: null }, { transaction });
const checkStock = (quantity, stock) => {
  if (quantity > stock) fail(409, 'Requested quantity exceeds available stock', { code: 'INSUFFICIENT_STOCK', availableStock: stock, requestedQty: quantity });
};
const values = (item, resolved) => ({ ...item, priceAtAdd: resolved.price, selectedVariant: resolved.variant?.attributes || {} });
const getCartData = async req => {
  const cart = await findCart(req);
  if (!cart) return { cart: { id: null, items: [], subtotal: 0, itemCount: 0, currency: null } };
  const rows = await CartItem.findAll({ where: { cartId: cart.id }, include, order: [['id', 'ASC']] });
  const items = await Promise.all(rows.map(async row => {
    const item = await formatItem(row, req);
    const availableStock = item.product?.isActive && (!item.variantId || item.variant) ? Math.max(0, Number((item.variantId ? item.variant : item.product).stock) || 0) : 0;
    const unitPrice = Number(item.variant?.price ?? item.product?.price ?? item.priceAtAdd);
    return { ...item, unitPrice, lineTotal: Math.round(unitPrice * item.quantity * 100) / 100, availableStock,
      gstRate: item.variant?.gstRate ?? item.product?.gstRate ?? '0%',
      stockStatus: availableStock === 0 ? 'OUT_OF_STOCK' : item.quantity > availableStock ? 'INSUFFICIENT_STOCK' : 'VALID' };
  }));
  return { cart: { id: cart.id, items, subtotal: Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0), currency: items[0]?.product?.currency || null } };
};
exports.getCartData = getCartData;
exports.getCart = handler(getCartData);
exports.addToCart = handler(async req => {
  const input = selection(req.body, true);
  return mutate(req, async transaction => {
    const resolved = await resolveProduct(input, transaction);
    const cart = await ensureCart(req, transaction);
    const rows = await CartItem.findAll({ where: { cartId: cart.id }, include, transaction });
    if (rows.some(row => row.product && (row.product.currency || 'INR') !== (resolved.product.currency || 'INR'))) fail(400, 'Mixed currency carts are not allowed');
    const existing = rows.find(row => row.productId === input.productId && row.variantId === input.variantId);
    const quantity = (existing?.quantity || 0) + input.quantity;
    checkStock(quantity, resolved.stock);
    const item = existing ? await existing.update(values({ ...input, quantity }, resolved), { transaction }) : await CartItem.create({ cartId: cart.id, ...values(input, resolved) }, { transaction });
    return { message: 'Added to cart', itemId: item.id, quantity };
  });
});
exports.syncCart = handler(async req => {
  if (!Array.isArray(req.body?.items) || req.body.items.length > 100) fail(400, 'items must be an array with at most 100 entries');
  const inputs = req.body.items.map(item => selection(item, true));
  const keys = inputs.map(item => `${item.productId}:${item.variantId}`);
  if (new Set(keys).size !== keys.length) fail(400, 'Duplicate products or variants in items');
  return mutate(req, async transaction => {
    const rows = [], currencies = new Set();
    for (const input of inputs) {
      const resolved = await resolveProduct(input, transaction);
      checkStock(input.quantity, resolved.stock);
      currencies.add(resolved.product.currency || 'INR');
      rows.push(values(input, resolved));
    }
    if (currencies.size > 1) fail(400, 'Mixed currency carts are not allowed');
    const cart = await ensureCart(req, transaction);
    await CartItem.destroy({ where: { cartId: cart.id }, transaction });
    if (rows.length) await CartItem.bulkCreate(rows.map(row => ({ ...row, cartId: cart.id })), { transaction });
    return { message: 'Cart synced successfully', cartId: cart.id };
  });
});
exports.updateCartItem = handler(async req => {
  const id = itemId(req.params.itemId), quantity = integer(req.body?.quantity, 'quantity', 0);
  return mutate(req, async transaction => {
    const cart = await findCart(req, transaction);
    const item = cart && await CartItem.findOne({ where: { id, cartId: cart.id }, transaction });
    if (!item) fail(404, 'Cart item not found');
    if (quantity === 0) await item.destroy({ transaction });
    else {
      const resolved = await resolveProduct(item, transaction);
      checkStock(quantity, resolved.stock);
      await item.update({ quantity, priceAtAdd: resolved.price }, { transaction });
    }
    return { message: quantity ? 'Cart updated successfully' : 'Item removed from cart' };
  });
});
exports.removeFromCart = handler(async req => {
  const id = itemId(req.params.itemId);
  return mutate(req, async transaction => {
    const cart = await findCart(req, transaction);
    if (!cart || !await CartItem.destroy({ where: { id, cartId: cart.id }, transaction })) fail(404, 'Cart item not found');
    return { message: 'Removed from cart' };
  });
});
exports.clearCart = handler(req => mutate(req, async transaction => {
  const cart = await findCart(req, transaction);
  if (cart) await CartItem.destroy({ where: { cartId: cart.id }, transaction });
  return { message: 'Cart cleared' };
}));
