'use strict';
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/db');
const { Affiliate, Order, OrderItem, Customer, Product } = require('../models');

async function seedOrders() {
  await sequelize.authenticate();
  console.log('Database connected successfully.');

  // 1. Locate affiliate
  const targetCode = process.argv[2] ? process.argv[2].toUpperCase() : 'BB-AFF-F4B3U';
  const affiliate = await Affiliate.findOne({ where: { referralCode: targetCode } });
  if (!affiliate) {
    console.error(`Affiliate with code ${targetCode} not found.`);
    process.exit(1);
  }

  console.log(`Found affiliate: ${affiliate.name} (ID: ${affiliate.id}, Code: ${affiliate.referralCode}, Commission: ${affiliate.commissionRate}%)`);

  // 2. Fetch existing orders
  const existingOrders = await Order.findAll({
    where: { affiliateId: affiliate.id },
    order: [['createdAt', 'DESC']]
  });
  console.log(`Existing orders in DB for this affiliate: ${existingOrders.length}`);

  // Determine how many orders to seed
  const targetTotal = 10;
  const countToSeed = Math.max(0, targetTotal - existingOrders.length);

  if (countToSeed === 0) {
    console.log(`Affiliate already has ${existingOrders.length} orders (>= ${targetTotal}).`);
  } else {
    console.log(`Seeding ${countToSeed} new orders to reach total of ${targetTotal} orders...`);
  }

  // 3. Load available customers and products
  const customers = await Customer.findAll({ limit: 10 });
  const products = await Product.findAll({
    where: { stock: { [require('sequelize').Op.gt]: 0 } },
    limit: 15
  });

  if (customers.length === 0 || products.length === 0) {
    console.error('Customers or products table is empty. Cannot seed orders.');
    process.exit(1);
  }

  // Define realistic orders data
  const orderPresets = [
    {
      custIdx: 0, // Nanthakumar B
      prodIndices: [7], // Apple Watch Ultra 2 (₹89,900)
      qty: 1,
      status: 'DELIVERED',
      daysAgo: 3,
      paymentMethod: 'Razorpay Secure Online'
    },
    {
      custIdx: 3, // Mob Tester
      prodIndices: [11], // Nike Air Max 270 (₹11,995)
      qty: 1,
      status: 'DELIVERED',
      daysAgo: 5,
      paymentMethod: 'Razorpay Secure Online'
    },
    {
      custIdx: 4, // Nantha Kumar
      prodIndices: [6], // Amazon Echo Show 10 (₹24,999)
      qty: 1,
      status: 'SHIPPED',
      daysAgo: 7,
      paymentMethod: 'Cash on Delivery (COD)'
    },
    {
      custIdx: 7, // QA Customer A
      prodIndices: [8], // Signature Italian Linen Tailored Shirt (₹3,499)
      qty: 2,
      status: 'DELIVERED',
      daysAgo: 10,
      paymentMethod: 'Razorpay Secure Online'
    },
    {
      custIdx: 8, // QA Customer B
      prodIndices: [9], // Aura Silk Pleated Evening Maxi Dress (₹8,999)
      qty: 1,
      status: 'CONFIRMED',
      daysAgo: 12,
      paymentMethod: 'Razorpay Secure Online'
    },
    {
      custIdx: 9, // QA Customer Updated
      prodIndices: [10], // Organic Cotton Newborn Essentials (₹1,499)
      qty: 3,
      status: 'PROCESSING',
      daysAgo: 14,
      paymentMethod: 'Cash on Delivery (COD)'
    },
    {
      custIdx: 1, // Harish
      prodIndices: [3], // Sony WH-1000XM5 Headphones (₹28,990)
      qty: 1,
      status: 'DELIVERED',
      daysAgo: 18,
      paymentMethod: 'Razorpay Secure Online'
    },
    {
      custIdx: 0, // Nanthakumar B
      prodIndices: [8], // Signature Italian Linen Tailored Shirt (₹3,499)
      qty: 1,
      status: 'PAID',
      daysAgo: 21,
      paymentMethod: 'Razorpay Secure Online'
    },
    {
      custIdx: 3, // Mob Tester
      prodIndices: [7], // Apple Watch Ultra 2 (₹89,900)
      qty: 1,
      status: 'DELIVERED',
      daysAgo: 25,
      paymentMethod: 'Razorpay Secure Online'
    }
  ];

  const transaction = await sequelize.transaction();
  try {
    for (let i = 0; i < countToSeed; i++) {
      const preset = orderPresets[i % orderPresets.length];
      const customer = customers[preset.custIdx % customers.length];
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - preset.daysAgo);
      orderDate.setHours(10 + (i * 2) % 12, 15 + (i * 7) % 45, 0, 0);

      // Select items
      const orderItemsData = [];
      let subtotal = 0;

      for (const pIdx of preset.prodIndices) {
        const prod = products[pIdx % products.length];
        const unitPrice = parseFloat(prod.price);
        const qty = preset.qty || 1;
        const lineTotal = unitPrice * qty;
        subtotal += lineTotal;

        let img = prod.defaultProductImage || null;
        if (!img && prod.images) {
          try {
            const arr = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
            if (Array.isArray(arr) && arr.length > 0) img = arr[0];
          } catch (e) {}
        }

        orderItemsData.push({
          productId: prod.id,
          productName: prod.name,
          productImage: img || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
          quantity: qty,
          unitPrice: unitPrice,
          totalPrice: lineTotal,
          gstRate: '18%',
          returnStatus: 'NONE'
        });
      }

      const shippingAmount = subtotal >= 1499 ? 0 : 99;
      const taxAmount = Math.round((subtotal * 18) / 118);
      const totalAmount = Math.round(subtotal + shippingAmount);

      const shippingAddress = {
        fullName: customer.name || 'Valued Customer',
        phone: customer.phone || '+919876543210',
        email: customer.email,
        flatHouse: `${100 + i * 12}, Luxury Boulevard, Suite ${i + 1}`,
        landmark: 'Near City Centre',
        city: i % 2 === 0 ? 'Chennai' : 'Bengaluru',
        state: i % 2 === 0 ? 'Tamil Nadu' : 'Karnataka',
        pincode: i % 2 === 0 ? '600001' : '560001',
        country: 'India'
      };

      const orderNumber = `BB${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

      const newOrder = await Order.create({
        orderNumber,
        customerId: customer.id,
        sessionId: null,
        affiliateId: affiliate.id,
        status: preset.status,
        paymentStatus: preset.status === 'CANCELLED' ? 'UNPAID' : 'PAID',
        paymentMethod: preset.paymentMethod,
        inventoryProcessed: true,
        subtotal,
        discountAmount: 0,
        couponDiscount: 0,
        loyaltyDiscount: 0,
        redeemedPoints: 0,
        shippingAmount,
        taxAmount,
        taxRate: 18.0,
        totalAmount,
        currency: 'INR',
        shippingAddress: JSON.stringify(shippingAddress),
        billingAddress: JSON.stringify(shippingAddress),
        notes: `Affiliate referral order via ${affiliate.referralCode}`,
        statusTimeline: JSON.stringify({
          PENDING: orderDate.toISOString(),
          CONFIRMED: orderDate.toISOString(),
          [preset.status]: new Date(orderDate.getTime() + 86400000).toISOString()
        }),
        createdAt: orderDate,
        updatedAt: orderDate
      }, { transaction });

      for (const itemData of orderItemsData) {
        await OrderItem.create({
          orderId: newOrder.id,
          ...itemData,
          createdAt: orderDate,
          updatedAt: orderDate
        }, { transaction });
      }

      console.log(`Created Order ${newOrder.orderNumber} - ₹${totalAmount.toLocaleString('en-IN')} (${preset.status}) for ${customer.name}`);
    }

    await transaction.commit();
    console.log('Orders successfully committed.');
  } catch (err) {
    await transaction.rollback();
    console.error('Error seeding orders:', err);
    process.exit(1);
  }

  // 4. Synchronize Affiliate counters
  const allOrders = await Order.findAll({
    where: { affiliateId: affiliate.id }
  });

  const commRate = parseFloat(affiliate.commissionRate) || 5.0;
  const recalculatedEarnings = allOrders.reduce((sum, ord) => {
    return sum + (parseFloat(ord.totalAmount) * commRate) / 100;
  }, 0);

  await affiliate.update({
    totalOrders: allOrders.length,
    totalEarnings: recalculatedEarnings.toFixed(2),
    totalClicks: Math.max(affiliate.totalClicks || 0, allOrders.length * 3) // realistic click-through
  });

  console.log('--- AFFILIATE SYNCHRONIZED ---');
  console.log(`Affiliate Name: ${affiliate.name}`);
  console.log(`Referral Code: ${affiliate.referralCode}`);
  console.log(`Total Orders in DB: ${allOrders.length}`);
  console.log(`Total Revenue Generated: ₹${allOrders.reduce((s, o) => s + parseFloat(o.totalAmount), 0).toLocaleString('en-IN')}`);
  console.log(`Total Commission Earned: ₹${recalculatedEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  process.exit(0);
}

seedOrders().catch(err => {
  console.error(err);
  process.exit(1);
});
