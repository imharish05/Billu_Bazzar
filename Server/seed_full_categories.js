'use strict';
require('dotenv').config();
const sequelize = require('./config/db');
const { Category, SubCategory } = require('./models');

const slugify = (text, prefix = '') => {
  let str = (prefix ? `${prefix}-` : '') + text;
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const getSmallPlaceholderImage = (title) => {
  const encodedTitle = encodeURIComponent(title);
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23f4f4f5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="600" fill="%23a1a1aa">${encodedTitle}</text></svg>`;
};

const data = [
  {
    root: "Electronics & Gadgets",
    parents: [
      {
        name: "Audio",
        children: ["Headphones", "Earbuds", "Bluetooth Speakers", "Soundbars"]
      },
      {
        name: "Computers & Laptops",
        children: ["Laptops", "Desktops", "Monitors", "Components (RAM, SSDs)"]
      },
      {
        name: "Smartphones & Tablets",
        children: ["Phones", "Tablets", "Cases", "Chargers", "Power Banks"]
      },
      {
        name: "Smart Home & IoT",
        children: ["Smart Speakers", "Security Cameras", "Smart Lighting"]
      },
      {
        name: "Wearable Tech",
        children: ["Smartwatches", "Fitness Trackers"]
      }
    ]
  },
  {
    root: "Apparel & Fashion",
    parents: [
      {
        name: "Men's Clothing",
        children: ["Shirts", "T-Shirts", "Pants", "Jackets", "Activewear"]
      },
      {
        name: "Women's Clothing",
        children: ["Dresses", "Tops", "Skirts", "Jeans", "Outerwear", "Activewear"]
      },
      {
        name: "Kids & Baby",
        children: ["Infant Rompers", "Toddler Clothes", "School Uniforms"]
      },
      {
        name: "Footwear",
        children: ["Sneakers", "Boots", "Sandals", "Formal Shoes"]
      },
      {
        name: "Accessories",
        children: ["Bags & Backpacks", "Wallets", "Belts", "Sunglasses", "Jewelry", "Watches"]
      }
    ]
  },
  {
    root: "Home & Living",
    parents: [
      {
        name: "Furniture",
        children: ["Living Room (Sofas, Tables)", "Bedroom (Beds, Wardrobes)", "Office Chairs"]
      },
      {
        name: "Kitchen & Dining",
        children: ["Cookware", "Dinnerware", "Small Appliances (Blenders, Coffee Makers)"]
      },
      {
        name: "Bedding & Bath",
        children: ["Sheets", "Pillows", "Towels", "Shower Curtains"]
      },
      {
        name: "Home Decor",
        children: ["Rugs", "Lighting", "Wall Art", "Candles", "Vases"]
      },
      {
        name: "Garden & Outdoor",
        children: ["Patio Furniture", "Grills", "Gardening Tools", "Outdoor Lighting"]
      }
    ]
  },
  {
    root: "Beauty & Personal Care",
    parents: [
      {
        name: "Skincare",
        children: ["Cleansers", "Moisturizers", "Serums", "Sunscreen"]
      },
      {
        name: "Makeup",
        children: ["Face", "Eyes", "Lips", "Brushes & Tools"]
      },
      {
        name: "Haircare",
        children: ["Shampoo", "Conditioner", "Styling Products", "Hair Dryers"]
      },
      {
        name: "Fragrances",
        children: ["Perfumes", "Colognes", "Body Sprays"]
      },
      {
        name: "Personal Care",
        children: ["Oral Care", "Deodorants", "Shaving & Grooming"]
      }
    ]
  },
  {
    root: "Sports & Outdoors",
    parents: [
      {
        name: "Fitness & Exercise",
        children: ["Dumbbells", "Yoga Mats", "Resistance Bands", "Treadmills"]
      },
      {
        name: "Camping & Hiking",
        children: ["Tents", "Sleeping Bags", "Backpacks", "Navigation"]
      },
      {
        name: "Cycling",
        children: ["Bicycles", "Helmets", "Bike Accessories"]
      },
      {
        name: "Water Sports",
        children: ["Kayaks", "Swim Gear", "Paddleboards"]
      }
    ]
  },
  {
    root: "Toys, Hobbies & Media",
    parents: [
      {
        name: "Toys & Games",
        children: ["Board Games", "Puzzles", "Action Figures", "Dolls", "Building Blocks"]
      },
      {
        name: "Video Games",
        children: ["Consoles", "Controller Accessories", "Game Discs/Codes"]
      },
      {
        name: "Books",
        children: ["Fiction", "Non-Fiction", "Children's Books", "E-books"]
      }
    ]
  }
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    let rootCount = 0;
    let parentCount = 0;

    for (let rIdx = 0; rIdx < data.length; rIdx++) {
      const item = data[rIdx];
      const rootSlug = slugify(item.root);

      let [rootCat] = await Category.findOrCreate({
        where: { slug: rootSlug },
        defaults: {
          name: item.root,
          slug: rootSlug,
          description: `Curated collection of ${item.root}`,
          image: getSmallPlaceholderImage(item.root),
          sortOrder: rIdx + 1,
          isActive: true,
          showHeader: true
        }
      });
      rootCount++;

      for (let pIdx = 0; pIdx < item.parents.length; pIdx++) {
        const parent = item.parents[pIdx];
        const parentSlug = slugify(parent.name, rootSlug);

        let [parentCat] = await SubCategory.findOrCreate({
          where: { slug: parentSlug },
          defaults: {
            categoryId: rootCat.id,
            name: parent.name,
            slug: parentSlug,
            description: `${parent.name} under ${item.root}`,
            image: getSmallPlaceholderImage(parent.name),
            sortOrder: pIdx + 1,
            isActive: true
          }
        });
        parentCount++;
      }
    }

    console.log(`SUCCESSFULLY SEEDED:`);
    console.log(`- ${rootCount} Root Categories (Category)`);
    console.log(`- ${parentCount} Parent Categories (SubCategory)`);

  } catch (err) {
    console.error('Error seeding categories:', err);
  } finally {
    process.exit();
  }
}

seed();
