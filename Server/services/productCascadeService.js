'use strict';

const {
  Product,
  ProductVariant,
  WarehouseStock,
  CartItem,
  Wishlist,
  Review,
  StockAlert,
  OrderItem,
  InventoryMovementLog,
  ReturnRequest,
} = require('../models');
const { deleteSpinSequence } = require('./spinSequenceService');

/**
 * Permanently deletes products, their variants, and all associated relational data,
 * safely unlinking order history to avoid MySQL foreign key constraints:
 *
 * 1. Unlinks OrderItem and ReturnRequest (sets productId and variantId to null)
 *    so customer past orders remain valid and viewable in Order History.
 * 2. Destroys all dependent records:
 *    - WarehouseStock (both variant-level and product-level)
 *    - CartItem (both variant-level and product-level)
 *    - Wishlist (both variant-level and product-level)
 *    - StockAlert (both variant-level and product-level)
 *    - InventoryMovementLog (both variant-level and product-level)
 *    - Review (product-level)
 * 3. Destroys all ProductVariant database records.
 * 4. Destroys all Product database records.
 * 5. Cleans up any 360 spin image sequence folders.
 * 6. NOTE: Product and variant image files on disk (/uploads/...) are explicitly
 *    PRESERVED so historical customer invoices, order details, and return requests
 *    continue rendering their item images without broken image icons.
 *
 * @param {number[]|number} productIds - Product ID or array of product IDs to delete
 * @param {object} transaction - Active Sequelize transaction
 * @returns {Promise<{ deletedProductCount: number, deletedVariantCount: number }>}
 */
const deleteProductsCascade = async (productIds, transaction) => {
  if (!productIds) return { deletedProductCount: 0, deletedVariantCount: 0 };
  
  const rawIds = Array.isArray(productIds) ? productIds : [productIds];
  const pIds = rawIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0);

  if (pIds.length === 0) {
    return { deletedProductCount: 0, deletedVariantCount: 0 };
  }

  // 1. Gather all variant IDs belonging to these products
  const variants = await ProductVariant.findAll({
    where: { productId: pIds },
    attributes: ['id', 'productId'],
    transaction,
  });
  const variantIds = variants.map(v => v.id);

  // 2. Clean up variant-level dependencies and unbind FKs
  if (variantIds.length > 0) {
    if (OrderItem) {
      await OrderItem.update({ variantId: null }, { where: { variantId: variantIds }, transaction });
    }
    if (ReturnRequest) {
      await ReturnRequest.update({ variantId: null }, { where: { variantId: variantIds }, transaction });
    }
    if (WarehouseStock) {
      await WarehouseStock.destroy({ where: { variantId: variantIds }, transaction });
    }
    if (CartItem) {
      await CartItem.destroy({ where: { variantId: variantIds }, transaction });
    }
    if (Wishlist) {
      await Wishlist.destroy({ where: { variantId: variantIds }, transaction });
    }
    if (StockAlert) {
      await StockAlert.destroy({ where: { variantId: variantIds }, transaction });
    }
    if (InventoryMovementLog) {
      await InventoryMovementLog.destroy({ where: { variantId: variantIds }, transaction });
    }
  }

  // 3. Clean up product-level dependencies and unbind FKs
  if (OrderItem) {
    await OrderItem.update({ productId: null }, { where: { productId: pIds }, transaction });
  }
  if (ReturnRequest) {
    await ReturnRequest.update({ productId: null }, { where: { productId: pIds }, transaction });
  }
  if (WarehouseStock) {
    await WarehouseStock.destroy({ where: { productId: pIds }, transaction });
  }
  if (CartItem) {
    await CartItem.destroy({ where: { productId: pIds }, transaction });
  }
  if (Wishlist) {
    await Wishlist.destroy({ where: { productId: pIds }, transaction });
  }
  if (Review) {
    await Review.destroy({ where: { productId: pIds }, transaction });
  }
  if (StockAlert) {
    await StockAlert.destroy({ where: { productId: pIds }, transaction });
  }
  if (InventoryMovementLog) {
    await InventoryMovementLog.destroy({ where: { productId: pIds }, transaction });
  }

  // 4. Destroy all ProductVariants
  const deletedVariantCount = await ProductVariant.destroy({
    where: { productId: pIds },
    transaction,
  });

  // 5. Destroy all Products
  const deletedProductCount = await Product.destroy({
    where: { id: pIds },
    transaction,
  });

  // 6. Clean up 360 spin temporary frame folders (does not affect source images)
  pIds.forEach(pid => {
    try {
      deleteSpinSequence(pid);
    } catch (e) {
      console.warn(`[deleteProductsCascade] Failed to delete spin sequence for product ${pid}:`, e.message);
    }
  });

  // NOTE: Product and variant image files in /uploads/ are purposefully NOT deleted from disk.

  return { deletedProductCount, deletedVariantCount };
};

module.exports = { deleteProductsCascade };
