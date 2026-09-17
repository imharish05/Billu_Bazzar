'use strict';

const fullSpec = require('./swagger');

// Documentation visibility only. Feature routes and their complete specs remain intact.
// Enable a section here when it is ready to appear in the mobile documentation.
const sections = [
  ['Auth & Security', 'Auth & Security', true, 'Register, sign in, recover a password using email OTP, and retrieve the signed-in customer. Use the returned access token in Authorize.'],
  ['myaccount', 'My Profile', true, 'View and update your profile or change your password. Requires a customer access token.'],
  ['banners', 'Banners', false, 'Load active promotional banners and storefront messages for the home screen.'],
  ['categories', 'Categories', true, 'Build catalog navigation using categories, subcategories, or fetch the complete category tree.'],
  ['search', 'Search', true, 'Suggest keywords and products while typing'],
  ['products', 'Products & Review', true, 'Browse and filter products, inspect details and variants, read product reviews, and manage reviews for purchased products.'],
  ['reviews', 'Reviews', false, 'Read product reviews and manage customer reviews.'],
  ['coupons', 'Coupons', true, 'List available coupons and preview discounts for the signed-in customer.'],
  ['offers', 'Offers', false, 'Legacy coupon aliases.'],
  ['addresses', 'Saved Addresses', true, 'Manage your saved addresses and choose a default address.'],
  ['cart', 'Cart', true, 'Manage the customer shopping cart.'],
  ['wishlist', 'Wishlist', true, 'Save products and variants, view saved items, and remove or clear them.'],
  ['checkout', 'Checkout', true, 'Load your cart and addresses, submit an order, and initiate or verify payment.'],
  ['delivery', 'Delivery Zones', true, 'Check delivery availability and shipping charges by pincode.'],
  ['payments', 'Payments', false, 'Initiate and verify order payments.'],
  ['orders', 'My Orders', true, 'List your orders, view details and tracking, or cancel an eligible order.'],
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
  'My orders': 'List orders belonging to the signed-in customer.',
  'My order details and tracking': 'Get details and tracking information for an order belonging to the signed-in customer.',
  'Cancel my order': 'Cancel an eligible order belonging to the signed-in customer.',
  'Track my order by ID or order number': 'Find an owned order by its ID or order number and return its tracking details.',
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
  'Product reviews': 'Read reviews for the specified product.',
  'My items eligible for review': 'List products from the signed-in customer\'s delivered orders that are eligible for review.',
  'Review my purchased product': 'Submit a review for an eligible product from a delivered order.',
  'Update my review': 'Change a review written by the signed-in customer.',
  'Delete my review': 'Remove a review written by the signed-in customer.',
  'Check delivery availability': 'Check whether a pincode is serviceable and return its delivery charge and free-delivery threshold.',
};

const visibleSections = sections.filter(([, , visible]) => visible);
const names = new Map(visibleSections.map(([source, name]) => [source, name]));
// Keep review routes in the complete spec while showing them with products in Swagger UI.
names.set('reviews', 'Products & Review');
const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);
// Hide legacy/search analytics operations only in the published documentation.
const hiddenPaths = new Set([
  '/mob-api/search/trending', '/mob-api/search/track', '/mob-api/search/autocomplete',
  '/mob-api/customers/wishlist', '/mob-api/customers/loyalty', '/mob-api/customers/tickets',
  '/mob-api/auth/profile', '/mob-api/auth/change-password',
  '/mob-api/myaccount/wishlist', '/mob-api/myaccount/loyalty', '/mob-api/myaccount/tickets',
  '/mob-api/orders',
]);
const paths = {};
for (const [path, item] of Object.entries(fullSpec.paths)) {
  if (hiddenPaths.has(path)) continue;
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
