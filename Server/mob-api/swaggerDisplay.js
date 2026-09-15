'use strict';

const fullSpec = require('./swagger');

// Documentation visibility only. Feature routes and their complete specs remain intact.
// Enable a section here when it is ready to appear in the mobile documentation.
const sections = [
  ['Auth & Security', 'Auth & Security', true, 'Register, sign in, recover a password using email OTP, and retrieve the signed-in customer. Use the returned access token in Authorize.'],
  ['myaccount', 'Myaccount', true, 'View and update your profile, change your password, manage your wishlist, check loyalty points, and contact support. Requires a customer access token.'],
  ['banners', 'Banners', true, 'Load active promotional banners and storefront messages for the home screen.'],
  ['categories', 'Categories', true, 'Build catalog navigation using categories, subcategories, and sub-subcategories, or fetch the complete category tree.'],
  ['search', 'Search', true, 'Suggest keywords and products while typing, display trending searches, and record submitted searches.'],
  ['products', 'Products', true, 'Browse and filter products, load featured items, search the catalog, retrieve price bounds, and inspect product details and variants.'],
  ['reviews', 'Reviews', false, 'Read product reviews and manage customer reviews.'],
  ['offers', 'Offers', false, 'Browse available offers and coupons.'],
  ['cart', 'Cart', false, 'Manage the customer shopping cart.'],
  ['checkout', 'Checkout', false, 'Prepare and submit checkout.'],
  ['delivery', 'Delivery', false, 'Check delivery availability and options.'],
  ['payments', 'Payments', false, 'Initiate and verify order payments.'],
  ['orders', 'Orders', false, 'View and manage customer orders.'],
  ['returns', 'Returns', false, 'Request and track returns.'],
  ['stock', 'Stock', false, 'Manage product stock alerts.'],
  ['currency', 'Currency', false, 'Retrieve supported currencies and exchange rates.'],
  ['gifts', 'Gifts', false, 'Access gifting options.'],
  ['contact', 'Contact', false, 'Submit contact requests.'],
  ['personalshopper', 'Personal Shopper', false, 'Request personal shopping assistance.'],
  ['affiliates', 'Affiliates', false, 'Access customer affiliate features.'],
  ['settings', 'Settings', false, 'Retrieve customer-facing storefront settings.'],
];

const descriptions = {
  'My wishlist': 'Return the signed-in customer\'s saved wishlist items.',
  'Toggle my wishlist item': 'Add the selected product or variant to your wishlist, or remove it if it is already saved.',
  'My loyalty balance and ledger': 'Return your current loyalty points balance and the history of points earned or spent.',
  'My support tickets': 'List support tickets belonging to the signed-in customer.',
  'Create my support ticket': 'Submit a new support request. If an order is supplied, it must belong to the signed-in customer.',
  'My profile': 'Return the signed-in customer\'s account profile.',
  'Update my profile': 'Update the supplied profile fields for the signed-in customer.',
  'Change my password': 'Verify your current password and replace it with the supplied new password.',
  'Active storefront banners': 'Return active promotional banners for display in the storefront. Use the type filter to request a banner placement.',
  'Active storefront messages': 'Return active marketing messages for display in the storefront.',
  'Active category tree': 'Return active categories with their nested subcategories and sub-subcategories for hierarchical navigation.',
  'Active categories': 'List active top-level product categories.',
  'Active subcategories': 'List active subcategories. Use categoryId to restrict the list to a parent category.',
  'Active sub-subcategories': 'List active sub-subcategories. Use subCategoryId to restrict the list to a parent subcategory.',
  'Search suggestions': 'Use q to return matching keyword suggestions and a small selection of matching products while the customer types.',
  'Trending searches': 'Return popular search keywords to display before the customer enters a query.',
  'Record a search': 'Submit q when a customer performs a search to update the keyword\'s search counts used for popularity and trending results.',
  'Browse active products': 'Return a paginated product listing. Use the documented filters for category, search text, price, promotions, and sorting.',
  'Featured products': 'Return active products marked as featured for storefront highlights.',
  'Search products': 'Use q to find matching products in the catalog.',
  'Product price range': 'Return the catalog price bounds used to configure a price filter.',
  'Product details by slug': 'Return one product by its URL slug, including available variant information for the product detail screen.',
  'Variants of an active product': 'Return variants for the specified active product, including option attributes, prices, stock, and images.',
};

const visibleSections = sections.filter(([, , visible]) => visible);
const names = new Map(visibleSections.map(([source, name]) => [source, name]));
const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);
const paths = {};
for (const [path, item] of Object.entries(fullSpec.paths)) {
  const operations = Object.entries(item).filter(([method, operation]) =>
    methods.has(method) && operation.tags?.some(tag => names.has(tag)));
  if (!operations.length) continue;
  paths[path] = Object.fromEntries(Object.entries(item).filter(([key]) => !methods.has(key)));
  for (const [method, operation] of operations) {
    paths[path][method] = {
      ...operation,
      tags: operation.tags.filter(tag => names.has(tag)).map(tag => names.get(tag)),
      description: operation.description || descriptions[operation.summary],
    };
  }
}

module.exports = {
  ...fullSpec,
  tags: visibleSections.map(([, name, , description]) => ({ name, description })),
  paths,
};
