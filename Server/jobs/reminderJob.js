'use strict';
const cron = require('node-cron');
const { Op } = require('sequelize');
const { Cart, CartItem, Product, ProductVariant, Customer } = require('../models');
const emailService = require('../services/emailService');

/**
 * Reminder Jobs — scheduled tasks for Billu Bazaar
 */

// ── Daily (09:00 AM): Automatic Abandoned Cart Recovery Emails ─────────────────
cron.schedule('0 9 * * *', async () => {
  console.log('[Cron] Running abandoned cart recovery check...');
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const abandonedCarts = await Cart.findAll({
      where: {
        updatedAt: { [Op.between]: [sevenDaysAgo, twentyFourHoursAgo] },
        [Op.or]: [
          { lastEmailSentAt: null },
          { lastEmailSentAt: { [Op.lt]: twentyFourHoursAgo } }
        ]
      },
      include: [
        {
          model: CartItem,
          as: 'items',
          required: true,
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name', 'price', 'images', 'currency'] },
            { model: ProductVariant, as: 'variant', attributes: ['id', 'sku', 'price'] }
          ]
        },
        {
          model: Customer,
          as: 'customer',
          required: true,
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    console.log(`[Cron] Found ${abandonedCarts.length} eligible abandoned carts for auto recovery.`);

    for (const cart of abandonedCarts) {
      if (!cart.customer?.email || !cart.items?.length) continue;

      let cartTotal = 0;
      let currency = 'INR';
      cart.items.forEach(item => {
        const price = parseFloat(item.variant?.price || item.priceAtAdd || 0);
        cartTotal += price * (item.quantity || 0);
        if (item.product?.currency) currency = item.product.currency;
      });

      try {
        await emailService.sendMarketingAutomationReport({
          to: cart.customer.email,
          customerName: cart.customer.name || 'Valued Customer',
          items: cart.items,
          cartTotal,
          currency,
          couponCode: 'RECOVER10',
          customNote: 'We noticed you left some items in your cart. Enjoy an exclusive 10% discount on your purchase!'
        });

        await cart.update({ lastEmailSentAt: new Date() });
        console.log(`[Cron] Auto recovery email sent to ${cart.customer.email} (Cart ID: ${cart.id})`);
      } catch (err) {
        console.error(`[Cron] Failed sending recovery email to cart ${cart.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Cron] Error running abandoned cart check:', err.message);
  }
});

// ── Weekly: loyalty points expiry check ───────────────────────────────────────
cron.schedule('0 10 * * 1', async () => {
  console.log('[Cron] Running loyalty expiry check...');
});

// ── Daily: low stock alert to admin ──────────────────────────────────────────
cron.schedule('0 8 * * *', async () => {
  console.log('[Cron] Running low stock check...');
  try {
    const lowStockThreshold = 10;
    const lowStockItems = [];

    // Check products with low master stock
    const products = await Product.findAll({
      where: {
        isActive: true,
        stock: { [Op.lte]: lowStockThreshold }
      },
      attributes: ['id', 'name', 'sku', 'stock']
    });

    products.forEach(p => {
      lowStockItems.push({
        name: p.name,
        sku: p.sku || 'N/A',
        variant: 'Standard / Master',
        stock: parseInt(p.stock, 10) || 0
      });
    });

    // Check variants with low stock
    const variants = await ProductVariant.findAll({
      where: {
        stock: { [Op.lte]: lowStockThreshold }
      },
      include: [
        { model: Product, as: 'product', where: { isActive: true }, attributes: ['id', 'name'] }
      ],
      attributes: ['id', 'sku', 'stock', 'attributes']
    });

    variants.forEach(v => {
      let varText = '';
      if (v.attributes) {
        let attrs = v.attributes;
        if (typeof attrs === 'string') {
          try { attrs = JSON.parse(attrs); } catch (e) { attrs = {}; }
        }
        if (typeof attrs === 'object') {
          varText = Object.entries(attrs).map(([k, val]) => `${k}: ${val}`).join(' · ');
        }
      }
      lowStockItems.push({
        name: v.product?.name || 'Product Variant',
        sku: v.sku || 'N/A',
        variant: varText || `Variant #${v.id}`,
        stock: parseInt(v.stock, 10) || 0
      });
    });

    if (lowStockItems.length > 0) {
      console.log(`[Cron] Found ${lowStockItems.length} products with stock <= ${lowStockThreshold}. Sending alert to admin...`);
      await emailService.sendLowStockAdminAlert(lowStockItems);
    } else {
      console.log('[Cron] All inventory levels healthy (> 10 units).');
    }
  } catch (err) {
    console.error('[Cron] Error running low stock check:', err.message);
  }
});

console.log('[Cron] Scheduled jobs registered');

