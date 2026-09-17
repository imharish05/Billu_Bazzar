'use strict';
const { Wishlist } = require('../../models');
const { fail, itemId, selection, resolveProduct, mutate, handler, include, formatItem } = require('../common/shopping');
exports.getWishlist = handler(async req => {
  const rows = await Wishlist.findAll({ where: { customerId: req.customer.id }, include, order: [['id', 'DESC']] });
  return { wishlist: await Promise.all(rows.map(row => formatItem(row, req))), total: rows.length };
});
const save = toggle => handler(async req => {
  const input = selection(req.body);
  return mutate(req, async transaction => {
    const where = { customerId: req.customer.id, ...input };
    const existing = await Wishlist.findOne({ where, transaction });
    if (existing) {
      if (toggle) await existing.destroy({ transaction });
      return { action: toggle ? 'removed' : 'added', itemId: existing.id };
    }
    const resolved = await resolveProduct(input, transaction);
    const item = await Wishlist.create({ ...where, selectedVariant: resolved.variant?.attributes || {} }, { transaction });
    return { action: 'added', itemId: item.id };
  });
});
exports.addToWishlist = save(false);
exports.toggleWishlist = save(true);
exports.removeFromWishlist = handler(async req => {
  const id = itemId(req.params.itemId);
  return mutate(req, async transaction => {
    if (!await Wishlist.destroy({ where: { id, customerId: req.customer.id }, transaction })) fail(404, 'Wishlist item not found');
    return { message: 'Removed from wishlist' };
  });
});
exports.clearWishlist = handler(req => mutate(req, async transaction => {
  await Wishlist.destroy({ where: { customerId: req.customer.id }, transaction });
  return { message: 'Wishlist cleared' };
}));
