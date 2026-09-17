'use strict';
require('dotenv').config();

const { Product, ProductVariant, WarehouseStock, Warehouse, Vendor, Category, SubCategory, sequelize } = require('../models');
const { syncProductVariants, syncWarehouseStock } = require('../controllers/variantController');

const EXCHANGE_RATE = 26.06;
const toAED = (inr) => inr && !isNaN(inr) ? parseFloat((parseFloat(inr) / EXCHANGE_RATE).toFixed(2)) : null;

const PRODUCTS_DATA = [
  // ── 1. Electronics & Gadgets > Audio ─────────────────────────────────────
  {
    subCategoryId: 2,
    categoryId: 2,
    name: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
    slug: 'sony-wh-1000xm5-wireless-noise-canceling-headphones',
    sku: 'SKU-AUD-WH1000XM5',
    shortDescription: 'Industry-leading noise canceling with Auto NC Optimizer, 30-hour battery life, and crystal-clear hands-free calling.',
    description: '<p>The <strong>Sony WH-1000XM5</strong> redefines distraction-free listening. Featuring two processors controlling eight microphones, Auto NC Optimizer for automatically optimizing noise canceling based on your wearing conditions and environment, and a specially designed driver unit.</p><ul><li>Industry-leading Active Noise Cancellation (ANC)</li><li>Up to 30 hours of battery life with quick charging (3 min for 3 hours)</li><li>Ultra-comfortable, lightweight design with soft fit leather</li><li>Multipoint connection allows quick switching between devices</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80'
    ],
    tags: ['Sony', 'Headphones', 'Wireless', 'ANC', 'Audio', 'Bluetooth'],
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    variants: [
      {
        sku: 'SKU-AUD-WH1000XM5-BLK',
        price: 28990,
        mrp: 34990,
        stock: 35,
        attributes: { Color: 'Midnight Black' },
        colorHex: '#111111',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'
        ]
      },
      {
        sku: 'SKU-AUD-WH1000XM5-SLV',
        price: 28990,
        mrp: 34990,
        stock: 25,
        attributes: { Color: 'Platinum Silver' },
        colorHex: '#e5e7eb',
        image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80'
        ]
      },
      {
        sku: 'SKU-AUD-WH1000XM5-BLU',
        price: 29990,
        mrp: 35990,
        stock: 20,
        attributes: { Color: 'Midnight Blue' },
        colorHex: '#1e3a8a',
        image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80'
        ]
      }
    ]
  },

  // ── 2. Electronics & Gadgets > Computers & Laptops ────────────────────────
  {
    subCategoryId: 3,
    categoryId: 2,
    name: 'Apple MacBook Pro 16-inch M3 Pro',
    slug: 'apple-macbook-pro-16-inch-m3-pro',
    sku: 'SKU-CMP-MBP16-M3',
    shortDescription: 'Liquid Retina XDR display, blazing-fast M3 Pro 12-core CPU / 18-core GPU, and up to 22 hours of all-day battery life.',
    description: '<p>The <strong>MacBook Pro 16-inch</strong> with M3 Pro chip takes power and efficiency further than ever. Delivering exceptional performance whether plugged in or on battery power, with an immersive Liquid Retina XDR display and advanced audio and camera arrays.</p><ul><li>Apple M3 Pro chip with 12-core CPU and 18-core GPU</li><li>16.2-inch Liquid Retina XDR display with ProMotion 120Hz</li><li>Studio-quality three-mic array and six-speaker sound system with Spatial Audio</li><li>MagSafe 3, three Thunderbolt 4 ports, HDMI, and SDXC card slot</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'
    ],
    tags: ['Apple', 'MacBook Pro', 'Laptop', 'M3 Pro', 'Computers'],
    isFeatured: true,
    isNewArrival: true,
    variants: [
      {
        sku: 'SKU-CMP-MBP16-SB-512',
        price: 239900,
        mrp: 249900,
        stock: 15,
        attributes: { Color: 'Space Black', Storage: '512GB' },
        colorHex: '#1c1d1f',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80']
      },
      {
        sku: 'SKU-CMP-MBP16-SB-1TB',
        price: 279900,
        mrp: 289900,
        stock: 12,
        attributes: { Color: 'Space Black', Storage: '1TB' },
        colorHex: '#1c1d1f',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80']
      },
      {
        sku: 'SKU-CMP-MBP16-SLV-512',
        price: 239900,
        mrp: 249900,
        stock: 10,
        attributes: { Color: 'Silver', Storage: '512GB' },
        colorHex: '#e2e8f0',
        image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80']
      }
    ]
  },

  // ── 3. Electronics & Gadgets > Smartphones & Tablets ──────────────────────
  {
    subCategoryId: 4,
    categoryId: 2,
    name: 'Apple iPhone 15 Pro Max 256GB',
    slug: 'apple-iphone-15-pro-max-256gb',
    sku: 'SKU-MOB-IPH15PM',
    shortDescription: 'Forged in aerospace-grade titanium with the groundbreaking A17 Pro chip and 5x optical Telephoto zoom camera.',
    description: '<p>The <strong>iPhone 15 Pro Max</strong> features a strong and light aerospace-grade titanium design with textured matte-glass back. It also features a Ceramic Shield front that is tougher than any smartphone glass.</p><ul><li>6.7-inch Super Retina XDR display with ProMotion up to 120Hz</li><li>A17 Pro chip delivers revolutionary graphics performance</li><li>Pro camera system: 48MP Main, Ultra Wide, and 5x Telephoto</li><li>Action button for quick access to your favorite feature</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80'
    ],
    tags: ['Apple', 'iPhone', 'Titanium', 'Smartphone', '5G'],
    isFeatured: true,
    isBestSeller: true,
    variants: [
      {
        sku: 'SKU-MOB-IPH15PM-NAT-256',
        price: 148900,
        mrp: 159900,
        stock: 30,
        attributes: { Color: 'Natural Titanium', Storage: '256GB' },
        colorHex: '#9a958d',
        image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80']
      },
      {
        sku: 'SKU-MOB-IPH15PM-BLU-256',
        price: 148900,
        mrp: 159900,
        stock: 25,
        attributes: { Color: 'Blue Titanium', Storage: '256GB' },
        colorHex: '#2e3944',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80']
      },
      {
        sku: 'SKU-MOB-IPH15PM-BLK-512',
        price: 168900,
        mrp: 179900,
        stock: 18,
        attributes: { Color: 'Black Titanium', Storage: '512GB' },
        colorHex: '#262529',
        image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80']
      }
    ]
  },

  // ── 4. Electronics & Gadgets > Smart Home & IoT ───────────────────────────
  {
    subCategoryId: 5,
    categoryId: 2,
    name: 'Amazon Echo Show 10 Smart Display & Speaker',
    slug: 'amazon-echo-show-10-smart-display-speaker',
    sku: 'SKU-SMH-ECHO10',
    shortDescription: '10.1-inch HD smart display with motion tracking, 13MP auto-framing camera, premium directional sound, and built-in Zigbee hub.',
    description: '<p>The <strong>Echo Show 10</strong> is designed to move with you: the brilliant 10.1-inch HD screen automatically turns to face you when you interact with Alexa. Perfect for video calls, following recipes, and smart home automation.</p><ul><li>Screen automatically rotates to keep you in frame during video calls</li><li>13MP camera with auto-framing and motion tracking</li><li>Premium 2.1 sound system with dual front-firing tweeters and powerful woofer</li><li>Built-in smart home hub compatible with Zigbee & Matter devices</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80',
      'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80'
    ],
    tags: ['Smart Home', 'Echo', 'Alexa', 'IoT', 'Display'],
    variants: [
      {
        sku: 'SKU-SMH-ECHO10-BLK',
        price: 24999,
        mrp: 29999,
        stock: 30,
        attributes: { Color: 'Charcoal Black' },
        colorHex: '#222222',
        image: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80']
      },
      {
        sku: 'SKU-SMH-ECHO10-WHT',
        price: 24999,
        mrp: 29999,
        stock: 25,
        attributes: { Color: 'Glacier White' },
        colorHex: '#f8f9fa',
        image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80']
      }
    ]
  },

  // ── 5. Electronics & Gadgets > Wearable Tech ──────────────────────────────
  {
    subCategoryId: 6,
    categoryId: 2,
    name: 'Apple Watch Ultra 2 Titanium GPS + Cellular',
    slug: 'apple-watch-ultra-2-titanium-gps-cellular',
    sku: 'SKU-WRB-AWULTRA2',
    shortDescription: 'Rugged 49mm titanium case, precision dual-frequency GPS, up to 36 hours of battery life, and 3000-nit Always-On Retina display.',
    description: '<p>The ultimate sports and adventure watch. <strong>Apple Watch Ultra 2</strong> features a lightweight titanium case, extreme battery life, the brightest Apple display ever, and double tap gesture control.</p><ul><li>49mm corrosion-resistant aerospace-grade titanium case</li><li>Water resistant 100m, certified for recreational scuba diving to 40m</li><li>Precision dual-frequency GPS for accurate distance, pace, and route maps</li><li>Customizable Action button for workout control and compass waypoints</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80'
    ],
    tags: ['Apple', 'Watch', 'Ultra', 'Smartwatch', 'Fitness'],
    isFeatured: true,
    variants: [
      {
        sku: 'SKU-WRB-AWULTRA2-ORG',
        price: 89900,
        mrp: 94900,
        stock: 20,
        attributes: { 'Band Style': 'Orange Ocean Band' },
        colorHex: '#ea580c',
        image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80']
      },
      {
        sku: 'SKU-WRB-AWULTRA2-BLU',
        price: 89900,
        mrp: 94900,
        stock: 18,
        attributes: { 'Band Style': 'Blue Alpine Loop' },
        colorHex: '#2563eb',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80']
      },
      {
        sku: 'SKU-WRB-AWULTRA2-GRY',
        price: 89900,
        mrp: 94900,
        stock: 15,
        attributes: { 'Band Style': 'Dark Grey Trail Loop' },
        colorHex: '#374151',
        image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80']
      }
    ]
  },

  // ── 6. Apparel & Fashion > Men's Clothing ─────────────────────────────────
  {
    subCategoryId: 7,
    categoryId: 3,
    name: 'Signature Italian Linen Tailored Shirt',
    slug: 'signature-italian-linen-tailored-shirt',
    sku: 'SKU-APP-MLSHIRT',
    shortDescription: '100% pure Normandy flax linen tailored button-down shirt with mother-of-pearl buttons and breathable slim fit.',
    description: '<p>Crafted from premium 100% European flax, this tailored linen shirt offers relaxed elegance with superior breathability for warm climates and sophisticated occasions.</p><ul><li>100% certified European flax linen</li><li>Pre-washed for extraordinary softness and minimal shrinkage</li><li>Natural mother-of-pearl buttons</li><li>Modern semi-spread collar with removable collar stays</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80'
    ],
    tags: ['Menswear', 'Linen', 'Shirt', 'Luxury', 'Fashion'],
    variants: [
      {
        sku: 'SKU-APP-MLSHIRT-WHT-M',
        price: 3499,
        mrp: 4999,
        stock: 40,
        attributes: { Size: 'M', Color: 'Crisp White' },
        colorHex: '#ffffff',
        image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80']
      },
      {
        sku: 'SKU-APP-MLSHIRT-WHT-L',
        price: 3499,
        mrp: 4999,
        stock: 35,
        attributes: { Size: 'L', Color: 'Crisp White' },
        colorHex: '#ffffff',
        image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80']
      },
      {
        sku: 'SKU-APP-MLSHIRT-BLU-M',
        price: 3499,
        mrp: 4999,
        stock: 30,
        attributes: { Size: 'M', Color: 'Sky Blue' },
        colorHex: '#38bdf8',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80']
      },
      {
        sku: 'SKU-APP-MLSHIRT-BLU-L',
        price: 3499,
        mrp: 4999,
        stock: 28,
        attributes: { Size: 'L', Color: 'Sky Blue' },
        colorHex: '#38bdf8',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80']
      }
    ]
  },

  // ── 7. Apparel & Fashion > Women's Clothing ───────────────────────────────
  {
    subCategoryId: 8,
    categoryId: 3,
    name: 'Aura Silk Pleated Evening Maxi Dress',
    slug: 'aura-silk-pleated-evening-maxi-dress',
    sku: 'SKU-APP-WMDRESS',
    shortDescription: 'Floor-length pure mulberry silk dress featuring sunburst accordion pleats, sweetheart neckline, and flowing drape.',
    description: '<p>Elevate soirée evenings with the <strong>Aura Silk Maxi Dress</strong>. Tailored from lustrous mulberry silk that catches the light gracefully with each step.</p><ul><li>100% Grade 6A Mulberry Silk charmeuse</li><li>Meticulous hand-pressed sunburst accordion pleats</li><li>Concealed rear zip closure with hook-and-eye fastening</li><li>Dry clean only; includes garment storage bag</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80'
    ],
    tags: ['Womenswear', 'Silk', 'Dress', 'Evening', 'Luxury'],
    isFeatured: true,
    variants: [
      {
        sku: 'SKU-APP-WMDRESS-GRN-S',
        price: 8999,
        mrp: 11999,
        stock: 20,
        attributes: { Size: 'S', Color: 'Emerald Green' },
        colorHex: '#047857',
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80']
      },
      {
        sku: 'SKU-APP-WMDRESS-GRN-M',
        price: 8999,
        mrp: 11999,
        stock: 25,
        attributes: { Size: 'M', Color: 'Emerald Green' },
        colorHex: '#047857',
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80']
      },
      {
        sku: 'SKU-APP-WMDRESS-RSG-S',
        price: 9499,
        mrp: 12499,
        stock: 18,
        attributes: { Size: 'S', Color: 'Rose Gold' },
        colorHex: '#b76e79',
        image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80']
      },
      {
        sku: 'SKU-APP-WMDRESS-RSG-M',
        price: 9499,
        mrp: 12499,
        stock: 22,
        attributes: { Size: 'M', Color: 'Rose Gold' },
        colorHex: '#b76e79',
        image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80']
      }
    ]
  },

  // ── 8. Apparel & Fashion > Kids & Baby ────────────────────────────────────
  {
    subCategoryId: 9,
    categoryId: 3,
    name: 'Organic Cotton Newborn Essentials Romper Set',
    slug: 'organic-cotton-newborn-essentials-romper-set',
    sku: 'SKU-KID-ROMPERSET',
    shortDescription: 'GOTS-certified 100% organic combed cotton rompers with nickel-free snap buttons for ultra-sensitive newborn skin.',
    description: '<p>Provide gentle softness for delicate skin with this 3-piece organic romper set. Features fold-over scratch mittens and expandable envelope necklines for hassle-free dressing.</p><ul><li>100% GOTS Certified Organic Cotton</li><li>Nickel-free reinforced crotch snaps for quick diaper changes</li><li>Non-toxic azo-free natural plant dyes</li><li>Tagless label design to prevent scratching</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&q=80',
      'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=80'
    ],
    tags: ['Baby', 'Kids', 'Organic', 'Cotton', 'Romper'],
    variants: [
      {
        sku: 'SKU-KID-ROMPER-YLW-03M',
        price: 1499,
        mrp: 1999,
        stock: 45,
        attributes: { 'Age / Size': '0-3 Months', Color: 'Pastel Yellow' },
        colorHex: '#fef08a',
        image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&q=80']
      },
      {
        sku: 'SKU-KID-ROMPER-YLW-36M',
        price: 1499,
        mrp: 1999,
        stock: 40,
        attributes: { 'Age / Size': '3-6 Months', Color: 'Pastel Yellow' },
        colorHex: '#fef08a',
        image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&q=80']
      },
      {
        sku: 'SKU-KID-ROMPER-GRN-03M',
        price: 1499,
        mrp: 1999,
        stock: 35,
        attributes: { 'Age / Size': '0-3 Months', Color: 'Sage Green' },
        colorHex: '#86efac',
        image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=80']
      },
      {
        sku: 'SKU-KID-ROMPER-GRN-36M',
        price: 1499,
        mrp: 1999,
        stock: 30,
        attributes: { 'Age / Size': '3-6 Months', Color: 'Sage Green' },
        colorHex: '#86efac',
        image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=80']
      }
    ]
  },

  // ── 9. Apparel & Fashion > Footwear ───────────────────────────────────────
  {
    subCategoryId: 10,
    categoryId: 3,
    name: 'Nike Air Max 270 Lifestyle Running Sneakers',
    slug: 'nike-air-max-270-lifestyle-running-sneakers',
    sku: 'SKU-FTW-AIRMAX270',
    shortDescription: 'Featuring Nike largest heel Air unit yet for a super-soft ride that feels as impossible as it looks.',
    description: '<p>The <strong>Nike Air Max 270</strong> is inspired by two icons of big Air: the Air Max 180 and Air Max 93. Boasts a stretchy inner sleeve that creates a snug, sock-like fit.</p><ul><li>Large Max Air unit delivers responsive, all-day cushioning</li><li>Engineered mesh upper for lightweight breathability and flexibility</li><li>Dual-density foam sole provides structured arch support</li><li>Durable solid rubber outsole with waffle traction pattern</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80'
    ],
    tags: ['Nike', 'Sneakers', 'Footwear', 'AirMax', 'Shoes'],
    isFeatured: true,
    isBestSeller: true,
    variants: [
      {
        sku: 'SKU-FTW-AM270-BLK-UK8',
        price: 11995,
        mrp: 13995,
        stock: 25,
        attributes: { Size: 'UK 8', Color: 'Triple Black' },
        colorHex: '#0a0a0a',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80']
      },
      {
        sku: 'SKU-FTW-AM270-BLK-UK9',
        price: 11995,
        mrp: 13995,
        stock: 30,
        attributes: { Size: 'UK 9', Color: 'Triple Black' },
        colorHex: '#0a0a0a',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80']
      },
      {
        sku: 'SKU-FTW-AM270-WHT-UK8',
        price: 11995,
        mrp: 13995,
        stock: 20,
        attributes: { Size: 'UK 8', Color: 'White & Volt' },
        colorHex: '#f4f4f5',
        image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80']
      },
      {
        sku: 'SKU-FTW-AM270-WHT-UK9',
        price: 11995,
        mrp: 13995,
        stock: 22,
        attributes: { Size: 'UK 9', Color: 'White & Volt' },
        colorHex: '#f4f4f5',
        image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80']
      }
    ]
  },

  // ── 10. Apparel & Fashion > Accessories ───────────────────────────────────
  {
    subCategoryId: 11,
    categoryId: 3,
    name: 'Handcrafted Full-Grain Italian Leather Bi-Fold Wallet',
    slug: 'handcrafted-full-grain-italian-leather-bi-fold-wallet',
    sku: 'SKU-ACC-LTHWALLET',
    shortDescription: 'Vegetable-tanned full-grain Tuscan cowhide with RFID blocking protection, 8 card slots, and dual currency compartments.',
    description: '<p>Every wallet is hand-stitched by master artisans in Tuscany using time-honored vegetable tanning techniques that develop a rich, personal patina over years of use.</p><ul><li>100% Full-Grain Vegetable-Tanned Italian Leather</li><li>Certified RFID-blocking shield layer protects against electronic theft</li><li>8 dedicated credit card slots, 2 receipt pockets, 2 currency billfolds</li><li>Presented in an embossed luxury gift box</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'
    ],
    tags: ['Leather', 'Wallet', 'Accessories', 'Italian', 'RFID'],
    variants: [
      {
        sku: 'SKU-ACC-LTHWALLET-TAN',
        price: 2499,
        mrp: 3499,
        stock: 45,
        attributes: { Color: 'Cognac Tan' },
        colorHex: '#92400e',
        image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80']
      },
      {
        sku: 'SKU-ACC-LTHWALLET-BLK',
        price: 2499,
        mrp: 3499,
        stock: 50,
        attributes: { Color: 'Classic Jet Black' },
        colorHex: '#171717',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80']
      }
    ]
  },

  // ── 11. Home & Living > Furniture ─────────────────────────────────────────
  {
    subCategoryId: 12,
    categoryId: 4,
    name: 'Nordic Minimalist Solid Oak Lounge Armchair',
    slug: 'nordic-minimalist-solid-oak-lounge-armchair',
    sku: 'SKU-FUR-NORDCHAIR',
    shortDescription: 'Sculptural solid European white oak frame with high-density ergonomic cushioning and tactile boucle wool upholstery.',
    description: '<p>The <strong>Nordic Lounge Chair</strong> merges Scandinavian mid-century proportions with modern textural luxury. Constructed from solid sustainably-harvested white oak with mortise-and-tenon joinery.</p><ul><li>Solid European White Oak with protective matte natural oil finish</li><li>Plush dual-layer pocket spring and high-resilience foam core</li><li>Stain-resistant textured boucle fabric</li><li>Floor-protective felt glides pre-installed</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1580481077191-4b13a7788644?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1580481077191-4b13a7788644?w=800&q=80',
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80'
    ],
    tags: ['Furniture', 'Chair', 'Oak', 'Nordic', 'Living Room'],
    isFeatured: true,
    variants: [
      {
        sku: 'SKU-FUR-NORDCHAIR-CRM',
        price: 24999,
        mrp: 32999,
        stock: 15,
        attributes: { Finish: 'Cream Boucle' },
        colorHex: '#f5f5f4',
        image: 'https://images.unsplash.com/photo-1580481077191-4b13a7788644?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1580481077191-4b13a7788644?w=800&q=80']
      },
      {
        sku: 'SKU-FUR-NORDCHAIR-GRY',
        price: 24999,
        mrp: 32999,
        stock: 12,
        attributes: { Finish: 'Charcoal Grey Wool' },
        colorHex: '#334155',
        image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80']
      }
    ]
  },

  // ── 12. Home & Living > Kitchen & Dining ──────────────────────────────────
  {
    subCategoryId: 13,
    categoryId: 4,
    name: 'Cast Iron Enamelled Dutch Oven 5.5 Quart Pot',
    slug: 'cast-iron-enamelled-dutch-oven-5-5-quart-pot',
    sku: 'SKU-KIT-DUTCHOVEN',
    shortDescription: 'Heavy-duty enamelled cast iron pot with tight-fitting lid and stainless steel knob for slow simmering, braising, and baking artisan bread.',
    description: '<p>An indispensable kitchen masterpiece. Outstanding heat retention and distribution make this 5.5-quart Dutch oven ideal for everything from crusty sourdough bread to savory slow-cooked stews.</p><ul><li>Vibrant, shock-resistant vitreous enamel interior and exterior</li><li>Self-basting lid condensation rings ensure succulent roasts</li><li>Oven-safe up to 260°C (500°F) on gas, electric, ceramic, and induction cooktops</li><li>Dishwasher safe for effortless cleanup</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&q=80',
      'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80'
    ],
    tags: ['Kitchen', 'Cookware', 'Cast Iron', 'Baking', 'Dining'],
    variants: [
      {
        sku: 'SKU-KIT-DUTCHOVEN-RED',
        price: 5999,
        mrp: 7999,
        stock: 30,
        attributes: { Color: 'Cherry Crimson' },
        colorHex: '#b91c1c',
        image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&q=80']
      },
      {
        sku: 'SKU-KIT-DUTCHOVEN-BLK',
        price: 5999,
        mrp: 7999,
        stock: 25,
        attributes: { Color: 'Matte Cast Black' },
        colorHex: '#18181b',
        image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80']
      }
    ]
  },

  // ── 13. Home & Living > Bedding & Bath ────────────────────────────────────
  {
    subCategoryId: 14,
    categoryId: 4,
    name: '100% Organic French Flax Linen Duvet Cover Set',
    slug: '100-organic-french-flax-linen-duvet-cover-set',
    sku: 'SKU-BED-FLAXDUVET',
    shortDescription: 'Woven from 175 GSM pure Normandy flax, stonewashed for unmatched softness, temperature-regulating in all seasons.',
    description: '<p>Indulge in five-star hotel comfort at home. Pure French flax linen breathes naturally to keep you cool throughout summer and cozy in winter, becoming softer with every wash.</p><ul><li>Includes 1 duvet cover and 2 standard matching pillow shams</li><li>Corner ties and interior coconut-shell button closures</li><li>Certified OEKO-TEX Standard 100 chemical-free guarantee</li><li>Naturally hypoallergenic and antimicrobial</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80'
    ],
    tags: ['Bedding', 'Linen', 'Duvet', 'Home', 'Sleep'],
    variants: [
      {
        sku: 'SKU-BED-FLAXDUVET-OAT-Q',
        price: 6499,
        mrp: 8999,
        stock: 20,
        attributes: { Size: 'Queen', Color: 'Oatmeal Natural' },
        colorHex: '#d6d3d1',
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80']
      },
      {
        sku: 'SKU-BED-FLAXDUVET-OAT-K',
        price: 7499,
        mrp: 9999,
        stock: 18,
        attributes: { Size: 'King', Color: 'Oatmeal Natural' },
        colorHex: '#d6d3d1',
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80']
      },
      {
        sku: 'SKU-BED-FLAXDUVET-TER-Q',
        price: 6499,
        mrp: 8999,
        stock: 22,
        attributes: { Size: 'Queen', Color: 'Terracotta Clay' },
        colorHex: '#c2410c',
        image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80']
      },
      {
        sku: 'SKU-BED-FLAXDUVET-TER-K',
        price: 7499,
        mrp: 9999,
        stock: 15,
        attributes: { Size: 'King', Color: 'Terracotta Clay' },
        colorHex: '#c2410c',
        image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80']
      }
    ]
  },

  // ── 14. Home & Living > Home Decor ────────────────────────────────────────
  {
    subCategoryId: 15,
    categoryId: 4,
    name: 'Artisan Hand-Blown Fluted Glass Vase',
    slug: 'artisan-hand-blown-fluted-glass-vase',
    sku: 'SKU-DEC-FLUTEDVASE',
    shortDescription: 'Contemporary sculptural centerpiece vase individually mouth-blown by master glassblowers with organic vertical ribbing.',
    description: '<p>A modern architectural focal point for any console, dining table, or bookshelf. Each vase displays subtle unique bubbles and contours characteristic of true artisanal handcraft.</p><ul><li>Individually hand-blown soda-lime crystal glass</li><li>Elegant vertical fluted texture enhances botanical arrangements</li><li>Weighted 12mm base prevents tipping</li><li>Dimensions: 30cm height × 14cm diameter</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=80',
      'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800&q=80'
    ],
    tags: ['Decor', 'Vase', 'Glass', 'Handmade', 'Living'],
    variants: [
      {
        sku: 'SKU-DEC-FLUTEDVASE-AMB',
        price: 1899,
        mrp: 2799,
        stock: 35,
        attributes: { Color: 'Amber Glow' },
        colorHex: '#d97706',
        image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=80']
      },
      {
        sku: 'SKU-DEC-FLUTEDVASE-SMK',
        price: 1899,
        mrp: 2799,
        stock: 30,
        attributes: { Color: 'Smoky Obsidian' },
        colorHex: '#475569',
        image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800&q=80']
      }
    ]
  },

  // ── 15. Home & Living > Garden & Outdoor ──────────────────────────────────
  {
    subCategoryId: 16,
    categoryId: 4,
    name: 'Solar Powered Weatherproof LED Pathway Lanterns (Set of 4)',
    slug: 'solar-powered-weatherproof-led-pathway-lanterns-set-of-4',
    sku: 'SKU-GAR-SOLARLANTERN',
    shortDescription: 'Heavy cast aluminum solar lanterns with monocrystalline solar panels, warm 2700K ambient illumination, and IP65 waterproof rating.',
    description: '<p>Illuminate garden pathways, driveways, and borders without trenching or wires. Charges automatically in daylight and powers up for up to 10 hours at dusk.</p><ul><li>Set of 4 heavy cast aluminum solar ground bollards</li><li>High-efficiency monocrystalline solar cell with auto dusk-to-dawn sensor</li><li>Warm 2700K 50-lumen glare-free optic diffuser</li><li>IP65 all-weather protection withstands rain, frost, and snow</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&q=80',
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80'
    ],
    tags: ['Garden', 'Solar', 'Outdoor', 'Lighting', 'LED'],
    variants: [
      {
        sku: 'SKU-GAR-SOLARLANTERN-BRZ',
        price: 3299,
        mrp: 4499,
        stock: 40,
        attributes: { Finish: 'Antique Bronze' },
        colorHex: '#78350f',
        image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&q=80']
      },
      {
        sku: 'SKU-GAR-SOLARLANTERN-BLK',
        price: 3299,
        mrp: 4499,
        stock: 45,
        attributes: { Finish: 'Matte Textured Black' },
        colorHex: '#1c1917',
        image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80']
      }
    ]
  },

  // ── 16. Beauty & Personal Care > Skincare ─────────────────────────────────
  {
    subCategoryId: 17,
    categoryId: 5,
    name: 'Hydra-Restore Hyaluronic Acid & Vitamin C Serum 50ml',
    slug: 'hydra-restore-hyaluronic-acid-vitamin-c-serum-50ml',
    sku: 'SKU-SKN-HYDRASERUM',
    shortDescription: 'Multi-molecular weight hyaluronic acid combined with stabilized 15% Vitamin C and soothing niacinamide for radiant, bouncy skin.',
    description: '<p>Deliver immediate 72-hour deep moisture saturation. The synergistic blend of 4 molecular weights of Hyaluronic Acid penetrates multiple skin layers to visibly plump fine lines and brighten dull tone.</p><ul><li>4D Multi-weight Hyaluronic Acid complex</li><li>15% Stabilized Ethyl Ascorbic Acid (Vitamin C)</li><li>Fragrance-free, non-comedogenic, and 100% cruelty-free</li><li>Dermatologically approved for all skin types including sensitive</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
      'https://images.unsplash.com/photo-1608248597359-2475653b47f7?w=800&q=80'
    ],
    tags: ['Skincare', 'Serum', 'Hyaluronic Acid', 'Vitamin C', 'Beauty'],
    isFeatured: true,
    variants: [
      {
        sku: 'SKU-SKN-HYDRASERUM-DAY',
        price: 1299,
        mrp: 1899,
        stock: 50,
        attributes: { Formulation: 'Daily Hydration (50ml)' },
        colorHex: '#bae6fd',
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80']
      },
      {
        sku: 'SKU-SKN-HYDRASERUM-NGT',
        price: 1499,
        mrp: 2099,
        stock: 45,
        attributes: { Formulation: 'Intensive Night Repair (50ml)' },
        colorHex: '#e0e7ff',
        image: 'https://images.unsplash.com/photo-1608248597359-2475653b47f7?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1608248597359-2475653b47f7?w=800&q=80']
      }
    ]
  },

  // ── 17. Beauty & Personal Care > Makeup ───────────────────────────────────
  {
    subCategoryId: 18,
    categoryId: 5,
    name: 'Velvet Matte Long-Wear Hydrating Lipstick',
    slug: 'velvet-matte-long-wear-hydrating-lipstick',
    sku: 'SKU-MKP-MATTELIP',
    shortDescription: 'Ultra-pigmented transfer-resistant bullet lipstick enriched with jojoba oil and vitamin E for weightless 12-hour comfort wear.',
    description: '<p>Achieve bold, couture color in a single swipe without drying lips. The featherweight formula blurs lip texture and locks in hydration with organic plant-derived waxes.</p><ul><li>Weightless creamy velvet matte finish with intense color payoff</li><li>Non-bleeding and smudge-resistant formula lasting up to 12 hours</li><li>Infused with wild mango butter and argan oil</li><li>Housed in a weighted magnetic luxury metal casing</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80',
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80'
    ],
    tags: ['Makeup', 'Lipstick', 'Cosmetics', 'Beauty', 'Matte'],
    variants: [
      {
        sku: 'SKU-MKP-MATTELIP-RED',
        price: 999,
        mrp: 1499,
        stock: 60,
        attributes: { Shade: 'Ruby Royalty Red' },
        colorHex: '#991b1b',
        image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80']
      },
      {
        sku: 'SKU-MKP-MATTELIP-CAR',
        price: 999,
        mrp: 1499,
        stock: 55,
        attributes: { Shade: 'Warm Nude Caramel' },
        colorHex: '#d97706',
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80']
      }
    ]
  },

  // ── 18. Beauty & Personal Care > Haircare ─────────────────────────────────
  {
    subCategoryId: 19,
    categoryId: 5,
    name: 'Moroccan Argan Oil Deep Hydration Hair Mask',
    slug: 'moroccan-argan-oil-deep-hydration-hair-mask',
    sku: 'SKU-HAR-ARGANMASK',
    shortDescription: 'Intensive restorative conditioner with cold-pressed virgin Moroccan argan oil and hydrolyzed keratin for brittle, chemically-treated hair.',
    description: '<p>Transform coarse, dull, and damaged tresses into silky-smooth hair in just 5 minutes. Formulated with authentic Moroccan argan oil and biomimetic amino acids to seal split ends.</p><ul><li>Restores hair elasticity, softness, and radiant mirror shine</li><li>Sulfate-free, paraben-free, color-safe formula</li><li>Infused with essential fatty acids Omega 6 and 9</li><li>Delicate warm amber and floral aroma</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&q=80',
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80'
    ],
    tags: ['Haircare', 'Argan Oil', 'Hair Mask', 'Keratin', 'Beauty'],
    variants: [
      {
        sku: 'SKU-HAR-ARGANMASK-250',
        price: 1199,
        mrp: 1699,
        stock: 50,
        attributes: { Capacity: '250ml Jar' },
        colorHex: '#fef3c7',
        image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&q=80']
      },
      {
        sku: 'SKU-HAR-ARGANMASK-500',
        price: 1899,
        mrp: 2699,
        stock: 35,
        attributes: { Capacity: '500ml Salon Size' },
        colorHex: '#fde68a',
        image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80']
      }
    ]
  },

  // ── 19. Beauty & Personal Care > Fragrances ───────────────────────────────
  {
    subCategoryId: 20,
    categoryId: 5,
    name: 'Eau de Parfum Luxury Amber & Calabrian Bergamot',
    slug: 'eau-de-parfum-luxury-amber-calabrian-bergamot',
    sku: 'SKU-FRG-AMBEREDP',
    shortDescription: '20% concentration artisanal unisex perfume blending crisp Italian citrus, smoky cedarwood, and hypnotic Madagascar amber.',
    description: '<p>A captivating scent of contrasts. Crisp Italian bergamot and pink pepper open into an opulent heart of iris and French lavender, settling over a lingering base of smoky amber and Bourbon vanilla.</p><ul><li>Extrait concentration (20% fragrance oil) providing 14+ hours longevity</li><li>Handcrafted with sustainably harvested natural essences from Grasse, France</li><li>Heavy crystalline flacon with gold-embossed cap and magnetic collar</li><li>Unisex fragrance profile suited for year-round signature wear</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80',
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80'
    ],
    tags: ['Fragrance', 'Perfume', 'Luxury', 'Amber', 'Eau De Parfum'],
    isFeatured: true,
    variants: [
      {
        sku: 'SKU-FRG-AMBEREDP-50',
        price: 4499,
        mrp: 5999,
        stock: 30,
        attributes: { Capacity: '50ml Travel Spray' },
        colorHex: '#f59e0b',
        image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80']
      },
      {
        sku: 'SKU-FRG-AMBEREDP-100',
        price: 6999,
        mrp: 8999,
        stock: 25,
        attributes: { Capacity: '100ml Signature Flacon' },
        colorHex: '#b45309',
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80']
      }
    ]
  },

  // ── 20. Beauty & Personal Care > Personal Care ────────────────────────────
  {
    subCategoryId: 21,
    categoryId: 5,
    name: 'Sonic Electric Toothbrush with UV Sanitizing Case',
    slug: 'sonic-electric-toothbrush-with-uv-sanitizing-case',
    sku: 'SKU-PRS-SONICTOOTH',
    shortDescription: '40,000 VPM maglev sonic motor, 5 custom brushing modes, wireless charging base, and travel case with UV-C sterilizer.',
    description: '<p>Experience a superior clean. Sonic micro-bubbles drive deep between teeth and along the gumline to remove up to 10x more plaque than a conventional manual toothbrush.</p><ul><li>40,000 vibrations per minute sonic motor</li><li>5 brushing modes: Clean, White, Polish, Gum Care, Sensitive</li><li>UV-C sanitizing travel case eliminates 99.9% of bacteria in 10 minutes</li><li>60-day battery life on a single USB-C fast charge</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1559591937-e1032b498f7e?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1559591937-e1032b498f7e?w=800&q=80',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80'
    ],
    tags: ['Personal Care', 'Dental', 'Electric Toothbrush', 'Sonic', 'Wellness'],
    variants: [
      {
        sku: 'SKU-PRS-SONIC-BLK',
        price: 3499,
        mrp: 4999,
        stock: 40,
        attributes: { Color: 'Matte Midnight Black' },
        colorHex: '#18181b',
        image: 'https://images.unsplash.com/photo-1559591937-e1032b498f7e?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1559591937-e1032b498f7e?w=800&q=80']
      },
      {
        sku: 'SKU-PRS-SONIC-WHT',
        price: 3499,
        mrp: 4999,
        stock: 35,
        attributes: { Color: 'Pearl White Gold' },
        colorHex: '#fdf4ff',
        image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80']
      }
    ]
  },

  // ── 21. Sports & Outdoors > Fitness & Exercise ────────────────────────────
  {
    subCategoryId: 22,
    categoryId: 6,
    name: 'Hex Rubber Encased Dumbbell Ergonomic Pair',
    slug: 'hex-rubber-encased-dumbbell-ergonomic-pair',
    sku: 'SKU-FIT-HEXDUMBBELL',
    shortDescription: 'Commercial-grade solid cast iron dumbbell pair with virgin rubber hexagonal heads and knurled chrome contoured grips.',
    description: '<p>Built for demanding daily workouts. The anti-roll hex design protects home and commercial gym flooring while the contoured knurled steel handle delivers maximum grip security.</p><ul><li>Heavy-duty solid cast iron core with thick vulcanized virgin rubber heads</li><li>Hexagonal anti-roll design provides stability during floor exercises</li><li>Ergonomic medium-knurl chrome plated steel handle</li><li>Permanently friction-welded head construction</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80',
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=80'
    ],
    tags: ['Fitness', 'Weights', 'Gym', 'Dumbbells', 'Exercise'],
    variants: [
      {
        sku: 'SKU-FIT-HEXDUMB-5KG',
        price: 1999,
        mrp: 2799,
        stock: 35,
        attributes: { Weight: '5kg Pair (10kg total)' },
        colorHex: '#374151',
        image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80']
      },
      {
        sku: 'SKU-FIT-HEXDUMB-10KG',
        price: 3799,
        mrp: 4999,
        stock: 30,
        attributes: { Weight: '10kg Pair (20kg total)' },
        colorHex: '#1f2937',
        image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=80']
      }
    ]
  },

  // ── 22. Sports & Outdoors > Camping & Hiking ──────────────────────────────
  {
    subCategoryId: 23,
    categoryId: 6,
    name: 'Ultralight 2-Person 3-Season Waterproof Backpacking Tent',
    slug: 'ultralight-2-person-3-season-waterproof-backpacking-tent',
    sku: 'SKU-OUT-ULTRATENT',
    shortDescription: 'Weighs only 1.8kg with 7001 aircraft aluminum poles, 20D ripstop silicone-coated nylon, and 5000mm hydrostatic head rating.',
    description: '<p>Built for the alpine explorer. Sets up freestanding in under 3 minutes with dual vestibules, double doors, and high-density no-see-um mesh canopy for bug-free stargazing.</p><ul><li>Trail weight: 1.8kg including poles, rainfly, and titanium stakes</li><li>20D silicone-coated nylon fly with 5000mm waterproof PU taped seams</li><li>DAC Featherlite 7001 aviation-grade aluminum interlocking poles</li><li>Dual oversized doors and generous gear vestibules</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
      'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&q=80'
    ],
    tags: ['Camping', 'Hiking', 'Tent', 'Outdoor', 'Backpacking'],
    isFeatured: true,
    variants: [
      {
        sku: 'SKU-OUT-ULTRATENT-GRN',
        price: 8499,
        mrp: 11999,
        stock: 20,
        attributes: { Color: 'Alpine Forest Green' },
        colorHex: '#15803d',
        image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80']
      },
      {
        sku: 'SKU-OUT-ULTRATENT-ORG',
        price: 8499,
        mrp: 11999,
        stock: 18,
        attributes: { Color: 'Sunset Trail Orange' },
        colorHex: '#ea580c',
        image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&q=80']
      }
    ]
  },

  // ── 23. Sports & Outdoors > Cycling ───────────────────────────────────────
  {
    subCategoryId: 24,
    categoryId: 6,
    name: 'Aero Dynamic Carbon Road Bike Cycling Helmet',
    slug: 'aero-dynamic-carbon-road-bike-cycling-helmet',
    sku: 'SKU-CYC-AEROHELMET',
    shortDescription: 'Wind-tunnel tested carbon composite shell with MIPS rotational brain protection and 22 internal air channels for maximum cooling.',
    description: '<p>Engineered for peloton speeds. Combining aerodynamic airflow efficiency with the industry-leading MIPS safety system to dramatically reduce rotational forces during impacts.</p><ul><li>Integrated MIPS Air Node rotational impact protection system</li><li>Ultralight in-mold polycarbonate shell with EPS structural cage</li><li>22 wind-tunnel tested vents with internal channeled airflow</li><li>Dial-adjustable 360-degree micro retention cradle</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=800&q=80',
      'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&q=80'
    ],
    tags: ['Cycling', 'Helmet', 'Bike', 'Aero', 'MIPS'],
    variants: [
      {
        sku: 'SKU-CYC-AERO-BLK-M',
        price: 5499,
        mrp: 7499,
        stock: 25,
        attributes: { Size: 'Medium (55-59cm)', Color: 'Matte Black' },
        colorHex: '#111827',
        image: 'https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=800&q=80']
      },
      {
        sku: 'SKU-CYC-AERO-BLK-L',
        price: 5499,
        mrp: 7499,
        stock: 22,
        attributes: { Size: 'Large (59-62cm)', Color: 'Matte Black' },
        colorHex: '#111827',
        image: 'https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=800&q=80']
      },
      {
        sku: 'SKU-CYC-AERO-WHT-M',
        price: 5499,
        mrp: 7499,
        stock: 20,
        attributes: { Size: 'Medium (55-59cm)', Color: 'Polar White' },
        colorHex: '#f9fafb',
        image: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&q=80']
      },
      {
        sku: 'SKU-CYC-AERO-WHT-L',
        price: 5499,
        mrp: 7499,
        stock: 18,
        attributes: { Size: 'Large (59-62cm)', Color: 'Polar White' },
        colorHex: '#f9fafb',
        image: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&q=80']
      }
    ]
  },

  // ── 24. Sports & Outdoors > Water Sports ──────────────────────────────────
  {
    subCategoryId: 25,
    categoryId: 6,
    name: "Inflatable Stand Up Paddle Board 10'6\" Complete Package",
    slug: 'inflatable-stand-up-paddle-board-10-6-complete-package',
    sku: 'SKU-WAT-SUPBOARD',
    shortDescription: 'Military-grade dual-layer drop-stitch construction with carbon fiber hybrid paddle, dual-action pump, leash, and dry bag.',
    description: '<p>The complete touring and yoga paddle board package. Extremely rigid when inflated to 15 PSI, delivering unmatched gliding stability in lakes, rivers, and coastal waves.</p><ul><li>Dimensions: 10\'6\" length × 32\" width × 6\" thickness; supports up to 160kg</li><li>Military-grade dual-layer PVC with ultra-dense drop-stitch core</li><li>Diamond grooved non-slip EVA deck pad with rear kick tail</li><li>Complete kit includes 3-piece adjustable paddle, coil leash, dual-action pump, and carry backpack</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
      'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&q=80'
    ],
    tags: ['Paddleboard', 'SUP', 'Water Sports', 'Outdoor', 'Inflatable'],
    isFeatured: true,
    variants: [
      {
        sku: 'SKU-WAT-SUP-AZU',
        price: 26999,
        mrp: 34999,
        stock: 15,
        attributes: { Color: 'Pacific Azure Blue' },
        colorHex: '#0284c7',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80']
      },
      {
        sku: 'SKU-WAT-SUP-TRQ',
        price: 26999,
        mrp: 34999,
        stock: 12,
        attributes: { Color: 'Coral Turquoise' },
        colorHex: '#0d9488',
        image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&q=80']
      }
    ]
  },

  // ── 25. Toys, Hobbies & Media > Toys & Games ──────────────────────────────
  {
    subCategoryId: 26,
    categoryId: 7,
    name: 'Grandmaster Handcrafted Wooden Chess & Checkers Set',
    slug: 'grandmaster-handcrafted-wooden-chess-checkers-set',
    sku: 'SKU-TOY-CHESSSET',
    shortDescription: '16-inch folding tournament chessboard handcrafted from solid walnut and maple with weighted, felted Staunton pieces.',
    description: '<p>A timeless heirloom set. Hand-carved solid hardwood pieces are triple-weighted with lead cores and billiard cloth bases for an authoritative, smooth glide across the board.</p><ul><li>Solid American Walnut and Canadian Maple inlaid wooden board</li><li>Classic 3.75-inch King Staunton regulation tournament pieces</li><li>Includes matching wooden checkers draughts pieces</li><li>Built-in individual plush velvet storage slots for every piece</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&q=80',
      'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800&q=80'
    ],
    tags: ['Toys', 'Games', 'Chess', 'Handmade', 'Wood'],
    variants: [
      {
        sku: 'SKU-TOY-CHESS-WAL',
        price: 3499,
        mrp: 4999,
        stock: 35,
        attributes: { 'Wood Finish': 'Classic Walnut & Maple' },
        colorHex: '#78350f',
        image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&q=80']
      },
      {
        sku: 'SKU-TOY-CHESS-EBN',
        price: 3999,
        mrp: 5499,
        stock: 25,
        attributes: { 'Wood Finish': 'Ebony & Sycamore' },
        colorHex: '#1e1b4b',
        image: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800&q=80']
      }
    ]
  },

  // ── 26. Toys, Hobbies & Media > Video Games ───────────────────────────────
  {
    subCategoryId: 27,
    categoryId: 7,
    name: 'Pro Wireless Ergonomic Gaming Controller with Hall-Effect Triggers',
    slug: 'pro-wireless-ergonomic-gaming-controller-hall-effect',
    sku: 'SKU-GAM-CTRLPRO',
    shortDescription: 'Zero-drift Hall Effect magnetic thumbsticks and analog triggers, mechanical tactile switches, and low-latency 2.4GHz wireless connection.',
    description: '<p>Eliminate stick drift forever. The <strong>Pro Wireless Gaming Controller</strong> uses electromagnetic Hall sensors for pinpoint precision and lifelong durability across PC, consoles, and mobile.</p><ul><li>Hall Effect magnetic joysticks and triggers with zero mechanical friction wear</li><li>Microswitch mechanical face buttons with 0.3mm rapid actuation</li><li>4 remappable rear paddle buttons and on-the-fly macro configuration</li><li>1000Hz polling rate via 2.4GHz USB wireless dongle or USB-C cable</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&q=80',
      'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=80'
    ],
    tags: ['Gaming', 'Controller', 'Video Games', 'Hall Effect', 'Wireless'],
    isFeatured: true,
    variants: [
      {
        sku: 'SKU-GAM-CTRLPRO-BLK',
        price: 4999,
        mrp: 6999,
        stock: 40,
        attributes: { Color: 'Stealth Shadow Black' },
        colorHex: '#09090b',
        image: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&q=80']
      },
      {
        sku: 'SKU-GAM-CTRLPRO-WHT',
        price: 4999,
        mrp: 6999,
        stock: 35,
        attributes: { Color: 'Arctic Cyber White' },
        colorHex: '#f8fafc',
        image: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=80']
      }
    ]
  },

  // ── 27. Toys, Hobbies & Media > Books ─────────────────────────────────────
  {
    subCategoryId: 28,
    categoryId: 7,
    name: 'The Art of Innovation: Luxury Illustrated Collector Hardcover',
    slug: 'the-art-of-innovation-luxury-illustrated-collector-hardcover',
    sku: 'SKU-BOK-ARTINNOV',
    shortDescription: 'A monumental visual journey through modern design, architecture, and technology, printed on archival 150 GSM matte art paper.',
    description: '<p>A stunning coffee-table tour de force. Over 400 full-color photographic spreads celebrating visionary creations that shaped our modern world, curated by award-winning historians and architects.</p><ul><li>432 full-color pages printed on heavy 150 GSM acid-free archival art paper</li><li>Gold foil debossed linen hardcover with satin ribbon bookmark</li><li>Featuring exclusive interviews and blueprints from leading global creators</li><li>Dimensions: 28cm × 36cm large format display monograph</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80'
    ],
    tags: ['Books', 'Art', 'Design', 'Hardcover', 'Collector'],
    variants: [
      {
        sku: 'SKU-BOK-ARTINNOV-STD',
        price: 2499,
        mrp: 3499,
        stock: 30,
        attributes: { Edition: 'Standard Clothbound Hardcover' },
        colorHex: '#1e3a8a',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80']
      },
      {
        sku: 'SKU-BOK-ARTINNOV-DLX',
        price: 4999,
        mrp: 6999,
        stock: 20,
        attributes: { Edition: 'Deluxe Leather-Bound Boxed Slipcase' },
        colorHex: '#831843',
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80']
      }
    ]
  },

  // ── 28. Sample Category > sample 1 ────────────────────────────────────────
  {
    subCategoryId: 33,
    categoryId: 21,
    name: 'Essential Lifestyle Heavyweight Canvas Everyday Tote Bag',
    slug: 'essential-lifestyle-heavyweight-canvas-everyday-tote-bag',
    sku: 'SKU-SMP-CANVASTOTE',
    shortDescription: '16oz heavy organic cotton canvas with full-grain leather reinforced shoulder straps, interior laptop sleeve, and brass magnetic closure.',
    description: '<p>The ultimate daily carryall. Heavyweight 16oz cotton canvas combines rugged durability with understated minimalist aesthetics, complete with water-resistant interior lining.</p><ul><li>16oz 100% heavy organic cotton duck canvas</li><li>Reinforced vegetable-tanned leather shoulder handles and copper rivets</li><li>Padded interior sleeve fits up to 15-inch laptops</li><li>Reinforced dual-layer base stands upright on flat surfaces</li></ul>',
    defaultProductImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80'
    ],
    tags: ['Tote', 'Bag', 'Canvas', 'Eco', 'Lifestyle'],
    variants: [
      {
        sku: 'SKU-SMP-TOTE-WHT',
        price: 1899,
        mrp: 2499,
        stock: 40,
        attributes: { Color: 'Natural Off-White' },
        colorHex: '#f5f5f4',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80']
      },
      {
        sku: 'SKU-SMP-TOTE-NAV',
        price: 1899,
        mrp: 2499,
        stock: 35,
        attributes: { Color: 'Washed Navy' },
        colorHex: '#1e3a8a',
        image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80']
      }
    ]
  }
];

async function run() {
  console.log('🚀 --- Starting Product Seeding Per SubCategory ---');
  try {
    const warehouse = await Warehouse.findOne({ where: { isFulfillment: true, isActive: true } }) || await Warehouse.findOne();
    const warehouseId = warehouse ? warehouse.id : 11;

    const vendor = await Vendor.findOne() || { id: 8 };
    const vendorId = vendor ? vendor.id : 8;

    console.log(`📦 Assigned Warehouse: ${warehouse ? warehouse.name : 'ID ' + warehouseId} (ID: ${warehouseId})`);
    console.log(`🏢 Assigned Vendor: ${vendor ? vendor.name : 'ID ' + vendorId} (ID: ${vendorId})`);

    let createdProducts = 0;
    let createdVariants = 0;

    for (const item of PRODUCTS_DATA) {
      const subCat = await SubCategory.findByPk(item.subCategoryId);
      if (!subCat) {
        console.warn(`⚠️ SubCategory ID ${item.subCategoryId} not found in DB! Skipping...`);
        continue;
      }

      console.log(`\n📂 SubCategory: "${subCat.name}" (ID: ${subCat.id}, Category ID: ${item.categoryId})`);

      // 1. Calculate aggregated dimensions
      const minPrice = Math.min(...item.variants.map(v => v.price));
      const maxMrp = Math.max(...item.variants.map(v => v.mrp));
      const totalStock = item.variants.reduce((acc, v) => acc + (v.stock || 0), 0);

      // Collect attributes map e.g. { "Color": ["Black", "White"] }
      const attrMap = {};
      item.variants.forEach(v => {
        Object.entries(v.attributes || {}).forEach(([k, val]) => {
          if (!attrMap[k]) attrMap[k] = [];
          if (!attrMap[k].includes(val)) attrMap[k].push(val);
        });
      });

      // 2. Create or Update Product
      let [product, pCreated] = await Product.findOrCreate({
        where: { slug: item.slug },
        defaults: {
          name: item.name,
          slug: item.slug,
          sku: item.sku,
          shortDescription: item.shortDescription,
          description: item.description,
          price: minPrice,
          comparePrice: maxMrp,
          priceAED: toAED(minPrice),
          comparePriceAED: toAED(maxMrp),
          currency: 'INR',
          stock: totalStock,
          categoryId: item.categoryId,
          subCategoryId: item.subCategoryId,
          vendorId: vendorId,
          warehouseId: warehouseId,
          defaultProductImage: item.defaultProductImage,
          images: item.images,
          tags: item.tags,
          attributes: attrMap,
          isFeatured: Boolean(item.isFeatured),
          isNewArrival: Boolean(item.isNewArrival),
          isBestSeller: Boolean(item.isBestSeller),
          rating: 4.8,
          reviewCount: Math.floor(8 + Math.random() * 25),
          showAuthenticity: true,
          isActive: true,
          gstRate: '18%'
        }
      });

      if (!pCreated) {
        // Update product to ensure correct metadata and images
        await product.update({
          name: item.name,
          sku: item.sku,
          shortDescription: item.shortDescription,
          description: item.description,
          price: minPrice,
          comparePrice: maxMrp,
          priceAED: toAED(minPrice),
          comparePriceAED: toAED(maxMrp),
          stock: totalStock,
          categoryId: item.categoryId,
          subCategoryId: item.subCategoryId,
          vendorId: vendorId,
          warehouseId: warehouseId,
          defaultProductImage: item.defaultProductImage,
          images: item.images,
          tags: item.tags,
          attributes: attrMap,
          isActive: true,
          showAuthenticity: true
        });
        console.log(`  ✓ Updated existing product: [ID ${product.id}] ${product.name}`);
      } else {
        createdProducts++;
        console.log(`  ✨ Created new product: [ID ${product.id}] ${product.name}`);
      }

      // 3. Create / update variants
      for (const vData of item.variants) {
        let [variant, vCreated] = await ProductVariant.findOrCreate({
          where: { sku: vData.sku },
          defaults: {
            productId: product.id,
            sku: vData.sku,
            price: vData.price,
            mrp: vData.mrp,
            priceAED: toAED(vData.price),
            mrpAED: toAED(vData.mrp),
            stock: vData.stock,
            attributes: vData.attributes,
            colorHex: vData.colorHex || null,
            image: vData.image,
            images: vData.images,
            warehouseId: warehouseId,
            lowStockThreshold: 10,
            gstRate: '18%'
          }
        });

        if (!vCreated) {
          await variant.update({
            productId: product.id,
            price: vData.price,
            mrp: vData.mrp,
            priceAED: toAED(vData.price),
            mrpAED: toAED(vData.mrp),
            stock: vData.stock,
            attributes: vData.attributes,
            colorHex: vData.colorHex || null,
            image: vData.image,
            images: vData.images,
            warehouseId: warehouseId
          });
        } else {
          createdVariants++;
        }

        // 4. Create / update warehouse stock
        await WarehouseStock.findOrCreate({
          where: { warehouseId, productId: product.id, variantId: variant.id },
          defaults: { warehouseId, productId: product.id, variantId: variant.id, quantity: vData.stock, reservedQty: 0, reorderLevel: 10 }
        });

        await WarehouseStock.update(
          { quantity: vData.stock, reorderLevel: 10 },
          { where: { warehouseId, productId: product.id, variantId: variant.id } }
        );

        console.log(`     🔹 Variant: [${variant.sku}] ${JSON.stringify(vData.attributes)} | ₹${vData.price} (AED ${toAED(vData.price)}) | Stock: ${vData.stock}`);
      }

      // 5. Run syncProductVariants to recalculate parent product aggregates cleanly
      await syncProductVariants(product.id);
    }

    console.log('\n=============================================================');
    console.log('🎉 ALL PRODUCTS AND VARIANTS SUCCESSFULLY SEEDED!');
    console.log(`Total Products: ${PRODUCTS_DATA.length}`);
    console.log(`Newly Created Products: ${createdProducts}`);
    console.log(`Newly Created Variants: ${createdVariants}`);
    console.log('=============================================================\n');

  } catch (err) {
    console.error('❌ Error seeding products:', err);
  } finally {
    process.exit(0);
  }
}

run();
