'use strict';
const ExcelJS = require('exceljs');
const path = require('path');
const { Op } = require('sequelize');

// Load models and DB configuration
const {
  Category, SubCategory, Product,
  Banner, Customer, Order, OrderItem,
  Cart, Coupon, Affiliate, MarketingMessage, SiteSetting
} = require('../models');
const sequelize = require('../config/db');

const outputFile = path.join(__dirname, '..', '..', 'API_Endpoints_Specification.xlsx');

async function run() {
  // Connect database
  await sequelize.authenticate();
  console.log('✅ Database connected for Excel generation');
  
  // Query actual data rows
  const realCustomer = await Customer.findOne();
  const realProduct = await Product.findOne();
  const realProducts = await Product.findAll({ limit: 2 });
  const realFeatured = await Product.findAll({ where: { isFeatured: true }, limit: 2 });
  
  const realOrder = await Order.findOne({
    include: [
      { model: Customer, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
      { model: OrderItem, as: 'items' }
    ]
  });
  
  const realOrders = await Order.findAll({
    limit: 2,
    include: [
      { model: Customer, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
      { model: OrderItem, as: 'items' }
    ]
  });
  
  const realBanners = await Banner.findAll({ limit: 2 });
  const realCustomers = await Customer.findAll({ limit: 2 });
  const realMarketingMessages = await MarketingMessage.findAll({ limit: 2 });
  const realAffiliates = await Affiliate.findAll({ limit: 2 });
  const realCoupons = await Coupon.findAll({ limit: 2 });
  const realSiteSettings = await SiteSetting.findAll({ limit: 2 });
  const realSubCategories = await SubCategory.findAll({ limit: 2 });
  const flatCategories = await Category.findAll({ limit: 2 });
  
  // Category tree query (limited to 2 parent categories for readability)
  const categoriesTree = await Category.findAll({
    include: [
      {
        model: SubCategory,
        as: 'subcategories',
        required: false
      }
    ],
    order: [
      ['sortOrder', 'ASC'],
      [{ model: SubCategory, as: 'subcategories' }, 'sortOrder', 'ASC'],
      
    ],
    limit: 2
  });
  
  const treeJson = categoriesTree.map(c => {
    const cJson = c.toJSON();
    return {
      id: cJson.id,
      name: cJson.name,
      slug: cJson.slug,
      children: (cJson.subcategories || []).map(sub => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        children: []
      }))
    };
  });

  // Calculate Dashboard Stats dynamically
  const today = new Date(); today.setHours(0,0,0,0);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [totalOrders, todayOrders, monthOrders, totalCustomers, pendingOrders, deliveredOrders] = await Promise.all([
    Order.count(),
    Order.count({ where: { createdAt: { [Op.gte]: today } } }),
    Order.count({ where: { createdAt: { [Op.gte]: thisMonth } } }),
    Customer.count(),
    Order.count({ where: { status: 'PENDING' } }),
    Order.count({ where: { status: 'DELIVERED' } }),
  ]);
  const revenueData = await Order.findAll({
    where: { paymentStatus: 'PAID' },
    attributes: ['totalAmount'],
  });
  const totalRev = revenueData.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
  const realStats = {
    totalOrders,
    todayOrders,
    monthOrders,
    totalCustomers,
    pendingOrders,
    deliveredOrders,
    totalRevenue: Math.round(totalRev)
  };
  
  // Cart items query simulator
  let realCartItems = [];
  if (realCustomer) {
    const cart = await Cart.findOne({ where: { customerId: realCustomer.id } });
    if (cart) {
      const CartItem = require('../models/CartItem');
      realCartItems = await CartItem.findAll({ where: { cartId: cart.id }, limit: 2 });
    }
  }

  // Helper cleanups for stringifying response cells
  const cleanJSON = (obj) => JSON.stringify(obj, null, 2);

  const endpoints = [
    // ─── Authentication ───
    {
      name: 'Register Customer',
      method: 'POST',
      endpoint: '/api/auth/register',
      request: cleanJSON({
        name: realCustomer ? realCustomer.name : 'Priya Nair',
        email: 'new.customer@gmail.com',
        password: 'Pass@123',
        phone: '9876543299',
        address: realCustomer ? realCustomer.address : { line1: '14 Palm Beach', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }
      }),
      response: cleanJSON({
        success: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        customer: realCustomer ? {
          id: realCustomer.id,
          name: realCustomer.name,
          email: realCustomer.email,
          phone: realCustomer.phone,
          loyaltyPoints: realCustomer.loyaltyPoints
        } : { id: 1, name: 'Priya Nair', email: 'priya@gmail.com', phone: '9876543200', loyaltyPoints: 0 }
      }),
      purpose: 'Used in the customer signup/registration page to create new accounts.'
    },
    {
      name: 'Customer Login',
      method: 'POST',
      endpoint: '/api/auth/login',
      request: cleanJSON({
        email: realCustomer ? realCustomer.email : 'priya@gmail.com',
        password: 'Pass@123'
      }),
      response: cleanJSON({
        success: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        customer: realCustomer ? {
          id: realCustomer.id,
          name: realCustomer.name,
          email: realCustomer.email
        } : { id: 1, name: 'Priya Nair', email: 'priya@gmail.com' }
      }),
      purpose: 'Used in the storefront login page to authenticate customers.'
    },
    {
      name: 'Admin Login',
      method: 'POST',
      endpoint: '/api/auth/admin/login',
      request: cleanJSON({
        email: 'admin@billubazaar.com',
        password: 'Admin@123'
      }),
      response: cleanJSON({
        success: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          name: 'Sai Arjun Kumar',
          email: 'admin@billubazaar.com'
        }
      }),
      purpose: 'Used in the admin login page (`/admin/login`) to authenticate dashboard admins.'
    },
    {
      name: 'Get Customer Profile',
      method: 'GET',
      endpoint: '/api/auth/profile',
      request: 'Headers:\nAuthorization: Bearer <token>',
      response: cleanJSON({
        success: true,
        customer: realCustomer || { id: 1, name: 'Priya Nair', email: 'priya@gmail.com', phone: '9876543200', loyaltyPoints: 1450 }
      }),
      purpose: 'Used in customer dashboards, navigation header (profile greeting), and profile settings page.'
    },
    {
      name: 'Update Customer Profile',
      method: 'PUT',
      endpoint: '/api/auth/profile',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nBody:\n' + cleanJSON({
        name: realCustomer ? realCustomer.name : 'Priya Nair',
        email: realCustomer ? realCustomer.email : 'priya@gmail.com',
        phone: '9876543211',
        address: realCustomer ? realCustomer.address : { line1: '14 Palm Beach', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }
      }),
      response: cleanJSON({
        success: true,
        customer: realCustomer ? {
          ...realCustomer.toJSON(),
          phone: '9876543211'
        } : { id: 1, name: 'Priya Nair', email: 'priya@gmail.com', phone: '9876543211' }
      }),
      purpose: 'Used in customer profile settings page to save updated name, phone, or address.'
    },

    // ─── Products ───
    {
      name: 'List Products',
      method: 'GET',
      endpoint: '/api/products',
      request: 'Query Params (optional):\n- category: string (slug)\n- brand: string\n- search: string\n- minPrice: number\n- maxPrice: number\n- sort: string (price_asc|price_desc)\n- page: number (default: 1)\n- limit: number (default: 20)',
      response: cleanJSON({
        success: true,
        products: realProducts,
        total: realProducts.length,
        totalPages: 1,
        currentPage: 1
      }),
      purpose: 'Used in storefront catalog page and category listing views.'
    },
    {
      name: 'Featured Products',
      method: 'GET',
      endpoint: '/api/products/featured',
      request: 'None',
      response: cleanJSON({
        success: true,
        products: realFeatured.length ? realFeatured : realProducts
      }),
      purpose: 'Used on the storefront homepage under the "Featured Collection" slider.'
    },
    {
      name: 'Search Products',
      method: 'GET',
      endpoint: '/api/products/search',
      request: 'Query Params:\n- q: string (search keyword)',
      response: cleanJSON({
        success: true,
        products: realProducts
      }),
      purpose: 'Used in search results page when a user presses enter in the search bar.'
    },
    {
      name: 'Get Price Range',
      method: 'GET',
      endpoint: '/api/products/price-range',
      request: 'None',
      response: cleanJSON({
        success: true,
        minPrice: 649,
        maxPrice: 89999
      }),
      purpose: 'Used in the storefront filters sidebar to initialize the price slider controls.'
    },
    {
      name: 'Get Product Detail',
      method: 'GET',
      endpoint: '/api/products/:slug',
      request: 'Params:\n- slug: string (e.g. "' + (realProduct ? realProduct.slug : 'emerald-silk-kaftan') + '")',
      response: cleanJSON({
        success: true,
        product: realProduct || { id: 1, name: 'Emerald Silk Kaftan', slug: 'emerald-silk-kaftan', price: 4999 }
      }),
      purpose: 'Used in the product details view page to load description, images, sizes, and 360-spin configuration.'
    },
    {
      name: 'Create Product',
      method: 'POST',
      endpoint: '/api/products',
      request: 'Headers:\nAuthorization: Bearer <token>\nContent-Type: multipart/form-data\n\nMultipart fields:\n- images (files)\n- spin_images (files)\n- name, price, sku, stock, etc. (text fields)',
      response: cleanJSON({
        success: true,
        product: realProduct || { id: 1, name: 'New Product', price: 1999 }
      }),
      purpose: 'Used in the admin panel to add a new product (includes uploading normal images and 360-degree spin frames).'
    },
    {
      name: 'Update Product',
      method: 'PUT',
      endpoint: '/api/products/:id',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number\n\nBody/Multipart fields:\n- name, price, stock, images (files), etc.',
      response: cleanJSON({
        success: true,
        product: realProduct || { id: 1, name: 'Updated Product', price: 2199 }
      }),
      purpose: 'Used in the admin panel to edit an existing product details or add images.'
    },
    {
      name: 'Delete Product',
      method: 'DELETE',
      endpoint: '/api/products/:id',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number',
      response: cleanJSON({
        success: true,
        message: 'Product deleted successfully'
      }),
      purpose: 'Used in the admin products table page under the delete action button.'
    },

    // ─── Categories ───
    {
      name: 'Get Category Tree',
      method: 'GET',
      endpoint: '/api/categories/tree',
      request: 'None',
      response: cleanJSON({
        success: true,
        categories: treeJson.length ? treeJson : [
          { id: 2, name: 'Party Wear', slug: 'party-wear', children: [] }
        ]
      }),
      purpose: 'Used in the header navigation dropdown and mobile menus to show category hierarchy.'
    },
    {
      name: 'List Categories (Flat)',
      method: 'GET',
      endpoint: '/api/categories',
      request: 'None',
      response: cleanJSON({
        success: true,
        categories: flatCategories
      }),
      purpose: 'Used in category selector dropdowns when creating/updating products or settings.'
    },
    {
      name: 'Create Category',
      method: 'POST',
      endpoint: '/api/categories',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nBody/Multipart:\n- name, description, parentId, image (file)',
      response: cleanJSON({
        success: true,
        category: flatCategories[0] || { id: 1, name: 'New Category' }
      }),
      purpose: 'Used in the admin categories page to add a new top-level or sub-level category.'
    },
    {
      name: 'Reorder Categories',
      method: 'PATCH',
      endpoint: '/api/categories/reorder',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nBody:\n' + cleanJSON({
        order: [
          { id: 1, sortOrder: 0 },
          { id: 2, sortOrder: 1 }
        ]
      }),
      response: cleanJSON({
        success: true
      }),
      purpose: 'Used in the admin panel to adjust categories order via drag-and-drop.'
    },
    {
      name: 'Update Category',
      method: 'PUT',
      endpoint: '/api/categories/:id',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number\n\nBody/Multipart:\n- name, description, image (file)',
      response: cleanJSON({
        success: true,
        category: flatCategories[0] || { id: 1, name: 'Updated Category' }
      }),
      purpose: 'Used in the admin categories page to edit category titles, descriptions, or upload banners.'
    },
    {
      name: 'Delete Category',
      method: 'DELETE',
      endpoint: '/api/categories/:id',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number',
      response: cleanJSON({
        success: true
      }),
      purpose: 'Used in the admin categories table to delete a category and unbind its products.'
    },

    // ─── Subcategories ───
    {
      name: 'List Subcategories',
      method: 'GET',
      endpoint: '/api/subcategories',
      request: 'None',
      response: cleanJSON({
        success: true,
        subCategories: realSubCategories
      }),
      purpose: 'Used in product editing and search filtering dropdowns.'
    },
    {
      name: 'Create Subcategory',
      method: 'POST',
      endpoint: '/api/subcategories',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nBody/Multipart:\n- name, parentId (Category ID), image (file)',
      response: cleanJSON({
        success: true,
        subCategory: realSubCategories[0] || { id: 1, name: 'New Subcategory' }
      }),
      purpose: 'Used in the admin panel to create secondary categories.'
    },
    {
      name: 'Reorder Subcategories',
      method: 'PATCH',
      endpoint: '/api/subcategories/reorder',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nBody:\n' + cleanJSON({
        order: [ { id: 10, sortOrder: 1 } ]
      }),
      response: cleanJSON({
        success: true
      }),
      purpose: 'Used in the admin panel to drag-and-drop sort secondary subcategories.'
    },
    {
      name: 'Update Subcategory',
      method: 'PUT',
      endpoint: '/api/subcategories/:id',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number\n\nBody/Multipart:\n- name, parentId, image (file)',
      response: cleanJSON({
        success: true,
        subCategory: realSubCategories[0] || { id: 1, name: 'Updated Subcategory' }
      }),
      purpose: 'Used in the admin panel to update a subcategory.'
    },
    {
      name: 'Delete Subcategory',
      method: 'DELETE',
      endpoint: '/api/subcategories/:id',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number',
      response: cleanJSON({
        success: true
      }),
      purpose: 'Used in the admin panel to delete a subcategory.'
    },



    // ─── Orders ───
    {
      name: 'List Orders (Admin)',
      method: 'GET',
      endpoint: '/api/orders',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nQuery Params:\n- status: string (optional)\n- customerId: number (optional)\n- page: number (default: 1)\n- limit: number (default: 20)',
      response: cleanJSON({
        success: true,
        orders: realOrders,
        total: totalOrders
      }),
      purpose: 'Used in the admin portal (`/admin/orders`) to manage, search, and monitor all orders.'
    },
    {
      name: 'Get Dashboard Statistics',
      method: 'GET',
      endpoint: '/api/orders/stats',
      request: 'Headers:\nAuthorization: Bearer <token>',
      response: cleanJSON({
        success: true,
        stats: realStats
      }),
      purpose: 'Used in the admin landing dashboard page (`/admin/dashboard`) to render stats cards.'
    },
    {
      name: 'Customer Orders History',
      method: 'GET',
      endpoint: '/api/orders/my',
      request: 'Headers:\nAuthorization: Bearer <token>',
      response: cleanJSON({
        success: true,
        orders: realOrders
      }),
      purpose: 'Used in customer panel under "My Orders" tab.'
    },
    {
      name: 'Get Order Details',
      method: 'GET',
      endpoint: '/api/orders/:id',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number (e.g. ' + (realOrder ? realOrder.id : 1) + ')',
      response: cleanJSON({
        success: true,
        order: realOrder || { id: 1, orderNumber: 'BB10000', subtotal: 1000, totalAmount: 1050 }
      }),
      purpose: 'Used in admin orders details popups, invoices, and customer receipt page.'
    },
    {
      name: 'Place Order',
      method: 'POST',
      endpoint: '/api/orders',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nBody:\n' + cleanJSON({
        items: [
          { productId: realProduct ? realProduct.id : 1, quantity: 1 }
        ],
        shippingAddress: realCustomer ? realCustomer.address : { line1: 'Test Address', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
        paymentMethod: 'Razorpay UPI',
        couponCode: 'WELCOME20',
        referralCode: 'MEERA2024'
      }),
      response: cleanJSON({
        success: true,
        order: realOrder || { id: 1, orderNumber: 'BB10001', totalAmount: 5000, status: 'PENDING' }
      }),
      purpose: 'Used in the storefront checkout page checkout confirm action to place an order.'
    },
    {
      name: 'Update Order/Payment Status',
      method: 'PATCH',
      endpoint: '/api/orders/:id/status',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number\n\nBody:\n' + cleanJSON({
        status: 'CONFIRMED',
        paymentStatus: 'PAID'
      }),
      response: cleanJSON({
        success: true,
        order: realOrder || { id: 1, status: 'CONFIRMED', paymentStatus: 'PAID' }
      }),
      purpose: 'Used in the admin orders page dropdown select controls to process order status transitions.'
    },

    // ─── Cart ───
    {
      name: 'Get Cart',
      method: 'GET',
      endpoint: '/api/cart',
      request: 'Headers:\nAuthorization: Bearer <token>',
      response: cleanJSON({
        success: true,
        cart: {
          items: realCartItems
        }
      }),
      purpose: 'Used in storefront header cart icon preview and cart detail summary drawer/page.'
    },
    {
      name: 'Add to Cart',
      method: 'POST',
      endpoint: '/api/cart/add',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nBody:\n' + cleanJSON({
        productId: realProduct ? realProduct.id : 1,
        quantity: 1,
        selectedVariant: { size: 'M', color: 'Default' }
      }),
      response: cleanJSON({
        success: true,
        cartItem: realCartItems[0] || { id: 1, productId: 1, quantity: 1 }
      }),
      purpose: 'Used in product details page when clicking the "Add to Cart" button.'
    },
    {
      name: 'Update Cart Item Quantity',
      method: 'PUT',
      endpoint: '/api/cart/item/:itemId',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- itemId: number\n\nBody:\n' + cleanJSON({
        quantity: 3
      }),
      response: cleanJSON({
        success: true,
        cartItem: realCartItems[0] || { id: 1, quantity: 3 }
      }),
      purpose: 'Used in cart page when adjusting item quantity counter values.'
    },
    {
      name: 'Remove Item from Cart',
      method: 'DELETE',
      endpoint: '/api/cart/item/:itemId',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- itemId: number',
      response: cleanJSON({
        success: true
      }),
      purpose: 'Used in cart page when clicking the delete trashcan icon on a cart item.'
    },
    {
      name: 'Clear Cart',
      method: 'DELETE',
      endpoint: '/api/cart/clear',
      request: 'Headers:\nAuthorization: Bearer <token>',
      response: cleanJSON({
        success: true
      }),
      purpose: 'Used to empty cart items after placing an order.'
    },

    // ─── Banners ───
    {
      name: 'List Banners',
      method: 'GET',
      endpoint: '/api/banners',
      request: 'None',
      response: cleanJSON({
        success: true,
        banners: realBanners
      }),
      purpose: 'Used on storefront homepage to display slider hero banners, countdown blocks, and exclusive deals.'
    },
    {
      name: 'Create Banner',
      method: 'POST',
      endpoint: '/api/banners',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nBody/Multipart:\n- title, subtitle, ctaText, ctaLink, type, position, image (file)',
      response: cleanJSON({
        success: true,
        banner: realBanners[0] || { id: 1, title: 'New Banner' }
      }),
      purpose: 'Used in admin settings to add new marketing slide images.'
    },
    {
      name: 'Update Banner',
      method: 'PUT',
      endpoint: '/api/banners/:id',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number\n\nBody/Multipart:\n- title, ctaLink, image (file)',
      response: cleanJSON({
        success: true,
        banner: realBanners[0] || { id: 1, title: 'Updated Banner' }
      }),
      purpose: 'Used in admin settings to edit banner text or swap images.'
    },
    {
      name: 'Delete Banner',
      method: 'DELETE',
      endpoint: '/api/banners/:id',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number',
      response: cleanJSON({
        success: true
      }),
      purpose: 'Used in admin settings table to remove homepage slideshow records.'
    },

    // ─── Customers & Loyalty ───
    {
      name: 'List Customers',
      method: 'GET',
      endpoint: '/api/customers',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nQuery Params:\n- page: number (default: 1)\n- limit: number (default: 20)\n- search: string',
      response: cleanJSON({
        success: true,
        customers: realCustomers,
        total: totalCustomers
      }),
      purpose: 'Used in admin panel (`/admin/customers`) to view customer records.'
    },
    {
      name: 'Get Customer Detail',
      method: 'GET',
      endpoint: '/api/customers/:id',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number (e.g. ' + (realCustomer ? realCustomer.id : 1) + ')',
      response: cleanJSON({
        success: true,
        customer: realCustomer || { id: 1, name: 'Priya Nair' }
      }),
      purpose: 'Used in admin customer details modal overview.'
    },
    {
      name: 'Get Wishlist',
      method: 'GET',
      endpoint: '/api/customers/wishlist',
      request: 'Headers:\nAuthorization: Bearer <token>',
      response: cleanJSON({
        success: true,
        wishlist: []
      }),
      purpose: 'Used in customer panel under the "My Wishlist" tab.'
    },
    {
      name: 'Toggle Wishlist Item',
      method: 'POST',
      endpoint: '/api/customers/wishlist',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nBody:\n' + cleanJSON({
        productId: realProduct ? realProduct.id : 1
      }),
      response: cleanJSON({
        success: true,
        message: 'Product added to wishlist'
      }),
      purpose: 'Used in storefront product card heart outline/filled icon interactions.'
    },
    {
      name: 'Get Loyalty Points Ledger',
      method: 'GET',
      endpoint: '/api/customers/loyalty',
      request: 'Headers:\nAuthorization: Bearer <token>',
      response: cleanJSON({
        success: true,
        loyaltyPoints: realCustomer ? realCustomer.loyaltyPoints : 1450,
        history: []
      }),
      purpose: 'Used in customer panel under "Loyalty points ledger" history records.'
    },
    {
      name: 'Get Support Tickets',
      method: 'GET',
      endpoint: '/api/customers/tickets',
      request: 'Headers:\nAuthorization: Bearer <token>',
      response: cleanJSON({
        success: true,
        tickets: []
      }),
      purpose: 'Used in customer panel under "Support Tickets" page.'
    },
    {
      name: 'Create Support Ticket',
      method: 'POST',
      endpoint: '/api/customers/tickets',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nBody:\n' + cleanJSON({
        subject: 'Missing items',
        message: 'My order is missing the necklace piece.',
        orderId: realOrder ? realOrder.id : 1
      }),
      response: cleanJSON({
        success: true,
        ticket: { id: 1, subject: 'Missing items', status: 'OPEN' }
      }),
      purpose: 'Used in customer support center to open query tickets.'
    },

    // ─── Marketing Messages ───
    {
      name: 'Get Marketing Messages',
      method: 'GET',
      endpoint: '/api/marketing-messages',
      request: 'None',
      response: cleanJSON({
        success: true,
        messages: realMarketingMessages
      }),
      purpose: 'Used in the scrolling notification header strip at the very top of the storefront page.'
    },
    {
      name: 'Create Marketing Message',
      method: 'POST',
      endpoint: '/api/marketing-messages',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nBody:\n' + cleanJSON({
        message: 'Use code FESTIVE30 for 30% off!',
        type: 'PROMO',
        isActive: true
      }),
      response: cleanJSON({
        success: true,
        message: realMarketingMessages[0] || { id: 1, message: 'Promo code active' }
      }),
      purpose: 'Used in admin settings page to add messages to the banner ticker.'
    },
    {
      name: 'Update Marketing Message',
      method: 'PUT',
      endpoint: '/api/marketing-messages/:id',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number\n\nBody:\n' + cleanJSON({
        message: 'Use code FESTIVE30 for 30% off!',
        type: 'PROMO',
        isActive: false
      }),
      response: cleanJSON({
        success: true
      }),
      purpose: 'Used in admin settings page to toggle active status or edit text.'
    },
    {
      name: 'Delete Marketing Message',
      method: 'DELETE',
      endpoint: '/api/marketing-messages/:id',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number',
      response: cleanJSON({
        success: true
      }),
      purpose: 'Used in admin settings page to delete scrolling ticker messages.'
    },

    // ─── Affiliates ───
    {
      name: 'Track Affiliate Click',
      method: 'GET',
      endpoint: '/api/affiliates/track',
      request: 'Query Params:\n- code: string (referral code, e.g. "MEERA2024")',
      response: cleanJSON({
        success: true,
        message: 'Referral click tracked'
      }),
      purpose: 'Used in influencer landing pages or links (e.g. `?ref=MEERA2024`) to increment click count.'
    },
    {
      name: 'List Affiliates',
      method: 'GET',
      endpoint: '/api/affiliates',
      request: 'Headers:\nAuthorization: Bearer <token>',
      response: cleanJSON({
        success: true,
        affiliates: realAffiliates
      }),
      purpose: 'Used in admin portal (`/admin/affiliates`) to view commissions and partner performance.'
    },
    {
      name: 'Get Affiliate Details',
      method: 'GET',
      endpoint: '/api/affiliates/:id',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number',
      response: cleanJSON({
        success: true,
        affiliate: realAffiliates[0] || { id: 1, name: 'Meera Kapoor' }
      }),
      purpose: 'Used in admin affiliates panel detail modal overview.'
    },
    {
      name: 'Create Affiliate Partner',
      method: 'POST',
      endpoint: '/api/affiliates',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nBody/Multipart:\n- name, email, referralCode, commissionRate, avatar (file)',
      response: cleanJSON({
        success: true,
        affiliate: realAffiliates[0] || { id: 1, name: 'New Affiliate' }
      }),
      purpose: 'Used in admin panel to register a new influencer partner.'
    },
    {
      name: 'Update Affiliate Partner',
      method: 'PUT',
      endpoint: '/api/affiliates/:id',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number\n\nBody/Multipart:\n- name, referralCode, commissionRate, avatar (file)',
      response: cleanJSON({
        success: true
      }),
      purpose: 'Used in admin panel to edit influencer accounts or adjust rates.'
    },
    {
      name: 'Delete Affiliate Partner',
      method: 'DELETE',
      endpoint: '/api/affiliates/:id',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number',
      response: cleanJSON({
        success: true
      }),
      purpose: 'Used in admin panel to delete an influencer profile.'
    },
    {
      name: 'Get Affiliate Referred Orders',
      method: 'GET',
      endpoint: '/api/affiliates/:id/orders',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number',
      response: cleanJSON({
        success: true,
        orders: realOrders
      }),
      purpose: 'Used in admin affiliates details modal to inspect which specific orders used this partner\'s referral code.'
    },

    // ─── Search ───
    {
      name: 'Autocomplete Suggestions',
      method: 'GET',
      endpoint: '/api/search/autocomplete',
      request: 'Query Params:\n- q: string (user input)',
      response: cleanJSON({
        success: true,
        suggestions: realProducts
      }),
      purpose: 'Used in search input keyup event listener to suggest matching titles as user types.'
    },
    {
      name: 'Get Trending Keywords',
      method: 'GET',
      endpoint: '/api/search/trending',
      request: 'None',
      response: cleanJSON({
        success: true,
        keywords: [
          { keyword: 'Lehenga', searchCount: 142 },
          { keyword: 'Saree', searchCount: 98 }
        ]
      }),
      purpose: 'Used in global search overlay drawer to show popular searches.'
    },
    {
      name: 'Track Search Keyword',
      method: 'POST',
      endpoint: '/api/search/track',
      request: 'Body:\n' + cleanJSON({
        keyword: 'Lehenga'
      }),
      response: cleanJSON({
        success: true
      }),
      purpose: 'Used in search execution event handler to index popular keywords.'
    },

    // ─── Coupons ───
    {
      name: 'List Coupons',
      method: 'GET',
      endpoint: '/api/coupons',
      request: 'None',
      response: cleanJSON({
        success: true,
        coupons: realCoupons
      }),
      purpose: 'Used in checkout drawer "View Coupons" modal and admin coupons settings page.'
    },
    {
      name: 'Create Coupon',
      method: 'POST',
      endpoint: '/api/coupons',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nBody:\n' + cleanJSON({
        code: 'FESTIVE30',
        type: 'PERCENT',
        value: 30,
        minOrderValue: 5999,
        maxDiscount: 5000,
        validFrom: '2025-06-01',
        validUntil: '2025-09-01',
        description: '30% off orders above 5999'
      }),
      response: cleanJSON({
        success: true
      }),
      purpose: 'Used in admin coupons panel to add promotional discount codes.'
    },
    {
      name: 'Update Coupon',
      method: 'PUT',
      endpoint: '/api/coupons/:id',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number\n\nBody:\n- code, type, value, validity dates, etc.',
      response: cleanJSON({
        success: true
      }),
      purpose: 'Used in admin coupons page to edit code configuration.'
    },
    {
      name: 'Delete Coupon',
      method: 'DELETE',
      endpoint: '/api/coupons/:id',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- id: number',
      response: cleanJSON({
        success: true
      }),
      purpose: 'Used in admin coupons page to delete coupon codes.'
    },
    {
      name: 'Validate Coupon Code',
      method: 'POST',
      endpoint: '/api/coupons/validate',
      request: 'Body:\n' + cleanJSON({
        code: 'WELCOME20',
        orderValue: 2500
      }),
      response: cleanJSON({
        success: true,
        isValid: true,
        coupon: realCoupons[0] || { id: 1, code: 'WELCOME20' },
        discountAmount: 500
      }),
      purpose: 'Used on cart checkout page when user enters a coupon code to calculate direct discount.'
    },

    // ─── Site Settings ───
    {
      name: 'Get Site Setting',
      method: 'GET',
      endpoint: '/api/site-settings/:key',
      request: 'Params:\n- key: string (e.g. "SITE_LOGO", "CONTACT_PHONE")',
      response: cleanJSON({
        success: true,
        setting: realSiteSettings[0] || { key: 'CONTACT_PHONE', value: '1800-123-456' }
      }),
      purpose: 'Used dynamically on header/footer elements to fetch branding assets.'
    },
    {
      name: 'Update Site Setting',
      method: 'POST',
      endpoint: '/api/site-settings/:key',
      request: 'Headers:\nAuthorization: Bearer <token>\n\nParams:\n- key: string\n\nBody/Multipart:\n- value (text or upload file if image)',
      response: cleanJSON({
        success: true
      }),
      purpose: 'Used in admin site settings forms to update store hours, logos, banners, or tags.'
    }
  ];

  console.log('Generating Excel workbook...');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Billu Bazaar';
  workbook.lastModifiedBy = 'Billu Bazaar';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create sheet
  const sheet = workbook.addWorksheet('API Endpoint Specification', {
    views: [{ showGridLines: true }]
  });

  // Title block
  sheet.mergeCells('A1:F2');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Billu Bazaar - API Endpoints Specification';
  titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'C9A24B' } // Gold
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Summary section
  sheet.getCell('A4').value = 'Total Endpoints:';
  sheet.getCell('A4').font = { name: 'Segoe UI', size: 10, bold: true };
  sheet.getCell('B4').value = endpoints.length;
  sheet.getCell('B4').font = { name: 'Segoe UI', size: 10 };

  sheet.getCell('D4').value = 'Generation Date:';
  sheet.getCell('D4').font = { name: 'Segoe UI', size: 10, bold: true };
  sheet.getCell('E4').value = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  sheet.getCell('E4').font = { name: 'Segoe UI', size: 10 };

  // Headers
  const headerRow = sheet.getRow(6);
  headerRow.values = [
    'Name',
    'Method',
    'Endpoint',
    'Request Structure / Headers',
    'Response Structure',
    'Purpose (Where it is used)'
  ];
  headerRow.height = 25;

  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'C9A24B' }
  };

  const headerFont = {
    name: 'Segoe UI',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFF' }
  };

  const centerAlign = { vertical: 'middle', horizontal: 'center' };
  const leftAlign = { vertical: 'middle', horizontal: 'left', wrapText: true };

  // Apply header styling
  for (let col = 1; col <= 6; col++) {
    const cell = headerRow.getCell(col);
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = centerAlign;
    cell.border = {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'medium', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: 'A0A0A0' } },
      right: { style: 'thin', color: { argb: 'A0A0A0' } }
    };
  }

  // Populate data
  let currentRowNum = 7;
  endpoints.forEach((ep) => {
    const row = sheet.getRow(currentRowNum);
    row.values = [
      ep.name,
      ep.method,
      ep.endpoint,
      ep.request,
      ep.response,
      ep.purpose
    ];

    // Method specific colors
    let methodColor = 'FFFFFF';
    let methodTextColor = '000000';
    if (ep.method === 'GET') {
      methodColor = 'E2F0D9'; // Soft green
      methodTextColor = '385723';
    } else if (ep.method === 'POST') {
      methodColor = 'DDEBF7'; // Soft blue
      methodTextColor = '1F4E79';
    } else if (ep.method === 'PUT' || ep.method === 'PATCH') {
      methodColor = 'FFF2CC'; // Soft yellow/orange
      methodTextColor = '7F6000';
    } else if (ep.method === 'DELETE') {
      methodColor = 'FCE4D6'; // Soft red
      methodTextColor = 'C65911';
    }

    // Apply borders and fonts
    const thinBorder = {
      top: { style: 'thin', color: { argb: 'E0E0E0' } },
      bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
      left: { style: 'thin', color: { argb: 'E0E0E0' } },
      right: { style: 'thin', color: { argb: 'E0E0E0' } }
    };

    for (let col = 1; col <= 6; col++) {
      const cell = row.getCell(col);
      cell.border = thinBorder;
      cell.font = { name: 'Segoe UI', size: 10 };

      if (col === 2) {
        // Method cell
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: methodColor } };
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: methodTextColor } };
        cell.alignment = centerAlign;
      } else if (col === 3) {
        // Endpoint cell
        cell.font = { name: 'Consolas', size: 9.5, bold: true, color: { argb: '2C3E50' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else if (col === 4 || col === 5) {
        // Request & Response codes
        cell.font = { name: 'Consolas', size: 8.5, color: { argb: '333333' } };
        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      } else {
        cell.alignment = leftAlign;
      }
    }

    // Adjust row height based on content lines
    const linesInReq = ep.request.split('\n').length;
    const linesInRes = ep.response.split('\n').length;
    const linesInPurpose = Math.ceil(ep.purpose.length / 30);
    const maxLines = Math.max(linesInReq, linesInRes, linesInPurpose, 2);
    row.height = Math.max(25, maxLines * 13.5);

    currentRowNum++;
  });

  // Explicit column widths
  sheet.getColumn(1).width = 25; // Name
  sheet.getColumn(2).width = 12; // Method
  sheet.getColumn(3).width = 30; // Endpoint
  sheet.getColumn(4).width = 45; // Request
  sheet.getColumn(5).width = 45; // Response
  sheet.getColumn(6).width = 40; // Purpose

  // Save workbook
  try {
    await workbook.xlsx.writeFile(outputFile);
    console.log(`\n======================================================`);
    console.log(`✅ Excel report successfully regenerated at:`);
    console.log(`   ${outputFile}`);
    console.log(`======================================================\n`);
  } catch (writeErr) {
    if (writeErr.code === 'EBUSY') {
      const backupFile = outputFile.replace('.xlsx', `_new.xlsx`);
      try {
        await workbook.xlsx.writeFile(backupFile);
        console.log(`\n======================================================`);
        console.log(`⚠️  Warning: File was locked. Saved to backup file:`);
        console.log(`   ${backupFile}`);
        console.log(`   Please close the original spreadsheet to overwrite it next time.`);
        console.log(`======================================================\n`);
      } catch (backupErr) {
        const tsBackup = outputFile.replace('.xlsx', `_${Date.now()}.xlsx`);
        await workbook.xlsx.writeFile(tsBackup);
        console.log(`\n======================================================`);
        console.log(`⚠️  Warning: Files were locked. Saved to timestamped backup:`);
        console.log(`   ${tsBackup}`);
        console.log(`======================================================\n`);
      }
    } else {
      throw writeErr;
    }
  }
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error generating report:', err);
    process.exit(1);
  });
