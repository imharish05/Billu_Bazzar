'use strict';

// Synthetic documentation fixtures, checked against mobile/shared controller response envelopes.
// IDs, URLs, OTPs and gateway references are illustrative, not seeded records or credentials.
const examples = {};
const add = (method, route, response, request, status = 200) => {
  examples[`${method} /mob-api${route}`] = { status, response, ...(request ? { request } : {}) };
};
const ok = message => ({ success: true, message });
const date = '2026-09-11T09:00:00.000Z';
const email = 'mobile.demo@example.com';
const phone = '+919876543210';
const address = { name: 'Demo Customer', email, phone, address: '10 Demo Street', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', country: 'India' };
const customer = { id: 7, name: 'Demo Customer', email, phone, loyaltyPoints: 0, preferredCurrency: 'INR', isActive: true, createdAt: date, updatedAt: date };
const product = { id: 224, name: 'Demo Cotton Shirt', slug: 'demo-cotton-shirt', price: '999.00', comparePrice: '1299.00', currency: 'INR', stock: 25, images: ['https://example.com/uploads/demo-shirt.jpg'], gstRate: '0%', isActive: true, rating: '0.00', reviewCount: 0 };
const category = { id: 12, name: 'Clothing', slug: 'clothing', isActive: true };
const subCategory = { id: 30, categoryId: 12, name: 'Shirts', slug: 'shirts', isActive: true };
const cartItem = { id: 1, cartId: 1, productId: 224, variantId: null, quantity: 1, priceAtAdd: '999.00', selectedVariant: {}, product: { id: product.id, name: product.name, price: product.price, images: product.images, stock: product.stock, slug: product.slug, gstRate: product.gstRate }, variant: null, gstRate: '0%', stockStatus: 'VALID', availableStock: 25 };
const cart = { id: 1, customerId: 7, sessionId: null, items: [cartItem], subtotal: 999 };
const order = { id: 57, orderNumber: 'BBDEMO0001', customerId: 7, status: 'PENDING_PAYMENT', paymentStatus: 'UNPAID', paymentMethod: 'Razorpay Secure Online', subtotal: '999.00', discountAmount: '0.00', shippingAmount: '40.00', taxAmount: '0.00', totalAmount: '1039.00', currency: 'INR', shippingAddress: address, billingAddress: address, createdAt: date, updatedAt: date, items: [{ id: 1, orderId: 57, productId: 224, productName: product.name, quantity: 1, unitPrice: '999.00', totalPrice: '999.00' }] };
const coupon = { id: 1, code: 'DEMO10', type: 'PERCENT', value: '10.00', minOrderValue: '500.00', maxDiscount: '200.00', isActive: true, validFrom: date, validUntil: '2026-12-31T23:59:59.000Z' };
const ticket = { id: 1, customerId: 7, subject: 'Delivery question', description: 'Please confirm the estimated delivery date.', category: 'GENERAL', status: 'OPEN', createdAt: date, updatedAt: date };
const review = { id: 1, productId: 224, customerId: 7, orderId: 57, rating: 5, title: 'Good quality', body: 'The fabric matches the description.', isVerifiedPurchase: true, isApproved: false, createdAt: date, updatedAt: date };
const productStats = { rating: 0, reviewCount: 0 };
const returnRequest = { id: 1, returnNumber: 'RET-DEMO0001', orderId: 57, orderItemId: 1, customerId: 7, productId: 224, productName: product.name, quantity: 1, refundAmount: '999.00', currency: 'INR', reason: 'Damaged item', reasonDetails: 'Seam damaged on arrival.', unboxingVideoUrl: 'https://example.com/evidence/demo-unboxing.mp4', images: [], status: 'REQUESTED', createdAt: date, updatedAt: date };

add('POST', '/auth/register', { ...ok('Customer registered successfully'), token: 'REPLACE_WITH_LOGIN_ACCESS_TOKEN' }, { name: customer.name, email, phone, password: 'DemoPassword123!' }, 201);
add('POST', '/auth/login', { ...ok('Login successful'), token: 'REPLACE_WITH_LOGIN_ACCESS_TOKEN' }, { email, password: 'DemoPassword123!' });
add('POST', '/auth/forgot-password', ok('A 6-digit verification code has been sent to your email'), { email });
add('POST', '/auth/verify-otp', { ...ok('OTP verified successfully'), resetToken: 'REPLACE_WITH_VERIFIED_RESET_TOKEN' }, { email, otp: '123456' });
add('POST', '/auth/new-password', ok('Password has been updated successfully. You can now login.'), { resetToken: 'REPLACE_WITH_VERIFIED_RESET_TOKEN', newPassword: 'NewDemoPassword123!' });
add('GET', '/auth/getme', { success: true, customer: { id: 7, name: customer.name, email, phone, loyaltyPoints: 0, preferredCurrency: 'INR', createdAt: date }, cartCount: 1 });
add('GET', '/auth/profile', { success: true, customer });
add('PUT', '/auth/profile', { success: true, customer }, { name: customer.name, phone, address, whatsappOptIn: false });
add('PUT', '/auth/change-password', ok('Password updated successfully'), { currentPassword: 'DemoPassword123!', newPassword: 'NewDemoPassword123!' });
add('GET', '/products', { success: true, products: [{ ...product, categoryId: category.id, subCategoryId: null, variants: [] }], total: 1, page: 1, limit: 20, totalPages: 1, hasMore: false });
add('GET', '/products/featured', { success: true, products: [{ ...product, isFeatured: true, category: { name: category.name, slug: category.slug } }] });
add('GET', '/products/search', { success: true, products: [{ ...product, categoryId: category.id, subCategoryId: null, variants: [] }], total: 1, page: 1, limit: 20, totalPages: 1, hasMore: false });
add('GET', '/products/price-range', { success: true, minPrice: 999, maxPrice: 999 });
add('GET', '/products/{slug}', { success: true, product: { ...product, category, variants: [] } });
add('GET', '/variants/product/{productId}', { success: true, variants: [{ id: 10, productId: 224, sku: 'DEMO-SHIRT-M', price: '999.00', stock: 25, attributes: { Size: 'M', Color: 'Blue' } }] });
add('GET', '/categories', { success: true, categories: [category] });
add('GET', '/subcategories', { success: true, subCategories: [subCategory] });
add('GET', '/categories/tree', { success: true, categories: [{ ...category, subcategories: [{ ...subCategory, children: [] }] }] });
add('GET', '/cart', { success: true, cart: { id: cart.id, items: cart.items.map(item => ({ ...item, unitPrice: 999, lineTotal: 999, availableStock: 25, stockStatus: 'VALID' })), subtotal: 999, itemCount: 1, currency: 'INR' } });
add('POST', '/cart/add', { ...ok('Added to cart'), itemId: 1, quantity: 1 }, { productId: 224, quantity: 1 });
add('POST', '/cart/sync', { ...ok('Cart synced successfully'), cartId: 1 }, { items: [{ productId: 224, quantity: 1 }] });
add('PUT', '/cart/item/{itemId}', ok('Cart updated successfully'), { quantity: 2 });
add('DELETE', '/cart/item/{itemId}', ok('Removed from cart'));
add('DELETE', '/cart/clear', ok('Cart cleared'));
add('GET', '/orders/my', { success: true, orders: [order] });
add('GET', '/orders/my/{id}', { success: true, order });
add('POST', '/orders', { success: true, order }, { shippingAddress: address, billingAddress: address, paymentMethod: 'Razorpay Secure Online', geoCountry: 'IN', requestedCurrency: 'INR' }, 201);
add('POST', '/orders/my/{id}/cancel', { ...ok('Order cancelled successfully'), order: { ...order, status: 'CANCELLED' } }, { reason: 'Ordered the wrong size' });
add('GET', '/orders/track/{identifier}', { success: true, order });
add('GET', '/payments/geo-detect', { success: true, countryCode: 'IN', countryName: 'India', currency: 'INR', gateway: 'razorpay', isAllowed: true });
add('POST', '/payments/initiate', { success: true, gateway: 'razorpay', key: 'rzp_test_REPLACE_WITH_GATEWAY_KEY', amount: 103900, currency: 'INR', name: 'Billu Bazzar', description: 'Payment for Order BBDEMO0001', order_id: 'order_REPLACE_WITH_GATEWAY_ORDER_ID' }, { orderId: 57 });
add('POST', '/payments/verify', { success: true, status: 'PAID' }, { orderId: 57, razorpayPaymentId: 'pay_REPLACE_WITH_GATEWAY_PAYMENT_ID', razorpayOrderId: 'order_REPLACE_WITH_GATEWAY_ORDER_ID', razorpaySignature: 'REPLACE_WITH_GATEWAY_SIGNATURE' });
add('GET', '/myaccount/wishlist', { success: true, wishlist: [{ id: 1, customerId: 7, productId: 224, product }] });
add('POST', '/myaccount/wishlist', { success: true, action: 'added' }, { productId: 224 });
add('GET', '/myaccount/loyalty', { success: true, ledger: [], balance: 0 });
add('GET', '/myaccount/tickets', { success: true, tickets: [ticket] });
add('POST', '/myaccount/tickets', { success: true, ticket }, { subject: ticket.subject, description: ticket.description, category: 'GENERAL' }, 201);
add('GET', '/coupons', { success: true, coupons: [{ ...coupon, description: 'Save 10%', usageLimit: 1 }], total: 1, page: 1, limit: 20, totalPages: 1, hasMore: false });
add('POST', '/coupons/validate', { success: true, valid: true, coupon: { ...coupon, description: 'Save 10%', usageLimit: 1 }, subtotal: 1000, discountAmount: 100, discountedSubtotal: 900, freeShipping: false }, { code: 'DEMO10', subtotal: 1000 });
add('GET', '/delivery-zones/check/{pincode}', { success: true, deliverable: true, pincode: '600001', zoneName: 'Chennai', city: 'Chennai', state: 'Tamil Nadu', deliveryCharge: 40, minOrderAmountForFreeDelivery: 1500 });
add('GET', '/stock-status', { success: true, productId: 224, variantId: null, stock: 25, cartQty: 1, availableStock: 24, stockStatus: 'IN_STOCK', stockLabel: 'In Stock', canAddToCart: true, canBuyNow: true });
add('POST', '/stock-alerts', { ...ok('Restock alert set! We will email mobile.demo@example.com as soon as "Demo Cotton Shirt" is back in stock.'), alert: { id: 1, productId: 224, email, phone } }, { productId: 224, email, phone }, 201);
add('GET', '/settings/{key}', { success: true, key: 'otp_threshold', data: { inrThreshold: 20000, aedThreshold: 800, requireCodOtp: true } });
add('POST', '/settings/newsletter-subscribe', { ...ok('Thank you!'), pointsAwarded: 0 }, { email });
add('GET', '/banners', { success: true, banners: [{ id: 1, title: 'New collection', image: 'https://example.com/uploads/demo-banner.jpg', type: 'HERO', ctaText: 'Shop now', ctaLink: '/products', position: 0, isActive: true }] });
add('GET', '/marketing-messages', { success: true, messages: [{ id: 1, message: 'Explore our new collection', position: 0, isActive: true }] });
add('GET', '/search/autocomplete', { success: true, query: 'shirt', suggestions: [{ id: product.id, name: product.name }] });
add('GET', '/search/suggestions', { success: true, query: 'shirt', suggestions: [{ id: product.id, name: product.name }] });
add('GET', '/search/trending', { success: true, trending: ['cotton shirt', 'saree'] });
add('POST', '/search/track', ok('Search tracked successfully'), { q: 'cotton shirt' });
add('GET', '/currency/rate', { success: true, base: 'AED', target: 'INR', rate: 23.5, note: 'Rate is cached and refreshed every 6 hours from open.er-api.com' });
add('GET', '/gift-service', { success: true, giftService: { id: 'gift_wrap_1', label: 'Gift wrapping', amount: 99, description: 'Gift box and ribbon', isActive: true, updatedAt: date } });
const enquiry = { name: customer.name, email, phone, subject: 'Delivery question', message: 'Do you deliver to Chennai?' };
add('POST', '/contact-enquiries', { ...ok('Thank you! Your message has been sent successfully.'), data: { id: 1, ...enquiry, status: 'PENDING', createdAt: date, updatedAt: date } }, enquiry, 201);
const shopper = { name: customer.name, email, phone, occasion: 'Wedding', budget: '5000', style: 'Traditional', notes: 'Please suggest an outfit.' };
add('POST', '/personal-shopper', { ...ok('Styling request sent — our stylist will reach out within 24h'), data: { id: 1, ...shopper, status: 'PENDING', createdAt: date, updatedAt: date } }, shopper, 201);
add('GET', '/affiliates', { success: true, affiliates: [{ id: 1, name: 'Demo Stylist', handle: '@demo', avatar: 'https://example.com/demo-avatar.jpg', productsCurated: 10, followers: '1K', referralCode: 'DEMOREF', isActive: true }] });
add('GET', '/affiliates/track', { ...ok('Click tracked successfully'), currentClicks: 1 });
add('POST', '/checkout/send-otp', ok('Verification OTP sent to mobile.demo@example.com'), { email, name: customer.name });
add('POST', '/checkout/verify-otp', ok('Security verification successful'), { email, otp: '123456' });
add('GET', '/reviews/product/{productId}', { success: true, productId: 224, averageRating: 0, totalCount: 0, ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, reviews: [], userCanReview: true, userReview: null, eligibleOrderId: 57 });
add('GET', '/reviews/my-delivered-items', { success: true, items: [{ orderId: 57, orderNumber: order.orderNumber, deliveredAt: date, productId: 224, productName: product.name, productSlug: product.slug, productImage: product.images[0], existingReview: null }] });
add('POST', '/reviews', { ...ok('Review submitted successfully!'), review, productStats, bonusPointsEarned: 0 }, { productId: 224, orderId: 57, rating: 5, title: review.title, body: review.body }, 201);
add('PUT', '/reviews/{id}', { ...ok('Review updated successfully!'), review, productStats }, { rating: 5, title: review.title, body: review.body });
add('DELETE', '/reviews/{id}', { ...ok('Review deleted successfully.'), productStats });
add('GET', '/returns/my', { success: true, returns: [returnRequest] });
add('GET', '/returns/my/{id}', { success: true, returnRequest });
add('POST', '/returns/request', { ...ok('Return request submitted successfully with unboxing video proof.'), returnRequest }, { orderId: 57, orderItemId: 1, quantity: 1, reason: returnRequest.reason, reasonDetails: returnRequest.reasonDetails, unboxingVideoUrl: returnRequest.unboxingVideoUrl }, 201);

add('GET', '/wishlist', { success: true, wishlist: [{ id: 1, customerId: 7, productId: 224, variantId: null, selectedVariant: {}, product, variant: null }], total: 1 });
add('POST', '/wishlist/add', { success: true, action: 'added', itemId: 1 }, { productId: 224, variantId: 10 });
add('POST', '/wishlist/toggle', { success: true, action: 'added', itemId: 1 }, { productId: 224, variantId: 10 });
add('DELETE', '/wishlist/item/{itemId}', ok('Removed from wishlist'));
add('DELETE', '/wishlist/clear', ok('Wishlist cleared'));
examples['GET /mob-api/myaccount/wishlist'] = examples['GET /mob-api/wishlist'];
examples['POST /mob-api/myaccount/wishlist'] = examples['POST /mob-api/wishlist/toggle'];

const savedAddress = { id: 1, customerId: 7, label: 'Home', ...address, addressLine2: '', landmark: '', isDefault: true, createdAt: date, updatedAt: date };
add('GET', '/addresses', { success: true, addresses: [savedAddress] });
add('POST', '/addresses', { success: true, address: savedAddress }, { label: 'Home', ...address, isDefault: true }, 201);
add('GET', '/addresses/{addressId}', { success: true, address: savedAddress });
add('PUT', '/addresses/{addressId}', { success: true, address: { ...savedAddress, label: 'Work' } }, { label: 'Work' });
add('PUT', '/addresses/{addressId}/default', { success: true, address: savedAddress });
add('DELETE', '/addresses/{addressId}', ok('Saved address deleted'));

add('GET', '/checkout', { success: true, checkout: { cart: examples['GET /mob-api/cart'].response.cart, addresses: [savedAddress], defaultAddressId: 1, stockIssues: [], totalsAreFinal: false } });
examples['POST /mob-api/checkout/place-order'] = { ...examples['POST /mob-api/orders'], request: { shippingAddressId: 1, billingAddressId: 1, paymentMethod: 'Razorpay Secure Online', requestedCurrency: 'INR', isGiftWrap: true, giftMessage: 'Happy birthday! With love.' } };
examples['POST /mob-api/checkout/payments/initiate'] = examples['POST /mob-api/payments/initiate'];
examples['POST /mob-api/checkout/payments/verify'] = examples['POST /mob-api/payments/verify'];

const aliases = {
  '/auth/me': '/auth/getme', '/auth/reset-password': '/auth/new-password',
  '/site-settings/{key}': '/settings/{key}', '/offers': '/coupons', '/offers/validate': '/coupons/validate',
  '/auth/send-checkout-otp': '/checkout/send-otp', '/auth/verify-checkout-otp': '/checkout/verify-otp',
  '/myaccount/profile': '/auth/profile', '/myaccount/change-password': '/auth/change-password',
  '/customers/wishlist': '/myaccount/wishlist', '/customers/loyalty': '/myaccount/loyalty', '/customers/tickets': '/myaccount/tickets'
};
for (const [alias, source] of Object.entries(aliases)) for (const method of ['GET', 'POST', 'PUT']) {
  const example = examples[`${method} /mob-api${source}`];
  if (example) examples[`${method} /mob-api${alias}`] = example;
}

function schemaFromExample(value) {
  if (value === null) return { nullable: true };
  if (Array.isArray(value)) return { type: 'array', items: value.length ? schemaFromExample(value[0]) : {} };
  if (typeof value === 'object') return { type: 'object', properties: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, schemaFromExample(item)])) };
  return { type: typeof value === 'number' ? (Number.isInteger(value) ? 'integer' : 'number') : typeof value };
}

function enrichSpecWithExamples(spec) {
  for (const [route, operations] of Object.entries(spec.paths)) for (const [method, operation] of Object.entries(operations)) {
    const entry = examples[`${method.toUpperCase()} ${route}`];
    if (!entry) throw new Error(`Missing mobile example: ${method} ${route}`);
    // Remove generic success codes that these handlers never return.
    if (entry.status === 201 && !['/mob-api/reviews', '/mob-api/stock-alerts'].includes(route)) delete operation.responses['200'];
    operation.responses[entry.status] ||= { description: entry.status === 201 ? 'Created successfully' : 'Successful response' };
    for (const [status, response] of Object.entries(operation.responses)) {
      if (!/^2\d\d$/.test(status)) continue;
      let value = entry.response;
      if (status === '200' && route === '/mob-api/reviews') value = examples['PUT /mob-api/reviews/{id}'].response;
      if (status === '200' && route === '/mob-api/stock-alerts') value = { ...entry.response, message: 'You are already subscribed to restock alerts for "Demo Cotton Shirt". We\'ll notify mobile.demo@example.com when it\'s available!' };
      response.content ||= {};
      const media = response.content['application/json'] ||= {};
      media.schema ||= schemaFromExample(value);
      media.example = value;
    }
    const parameterValues = { page: 1, limit: 10, productId: 224, variantId: 10, itemId: 1, id: 57, slug: 'demo-cotton-shirt', identifier: 'BBDEMO0001', key: 'otp_threshold', pincode: '600001', q: 'cotton shirt', search: 'cotton', ref: 'DEMOREF', geo: 'IN' };
    for (const parameter of operation.parameters || []) {
      if (parameterValues[parameter.name] !== undefined) parameter.example = parameterValues[parameter.name];
    }
    for (const [type, media] of Object.entries(operation.requestBody?.content || {})) {
      if (!entry.request) throw new Error(`Missing request example: ${method} ${route}`);
      media.example = entry.request;
      if (type === 'multipart/form-data') {
        for (const [key, value] of Object.entries(entry.request)) if (media.schema?.properties?.[key]) media.schema.properties[key].example = value;
      }
    }
  }
}
module.exports = { examples, enrichSpecWithExamples };
