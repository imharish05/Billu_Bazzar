# Mobile customer API

Each feature has its own folder containing its controller, routes, and Swagger documentation. For example:

    mob-api/
      Auth/                   Original authentication implementation
      categories/
        categoriesController.js
        categoriesRoutes.js
        categoriesSwagger.js
      products/
        productsController.js
        productsRoutes.js
        productsSwagger.js
      banners/
      offers/
      cart/
      checkout/
      orders/
      payments/
      myaccount/
      reviews/
      returns/
      delivery/
      stock/
      search/
      settings/
      currency/
      gifts/
      contact/
      personalshopper/
      affiliates/
      common/                 Shared authentication, ownership, request checks
      index.js                Explicit feature router mounts
      swagger.js              Collects feature documentation
      swaggerUi.js            Serves Swagger

## Usage

API base: /mob-api (also /api/mob).
Swagger: /mob-api/docs/ or /mob-api-docs/.
OpenAPI JSON: /mob-api/openapi.json.

Start the existing Server with npm start. All mobile feature endpoints, including products, categories, banners, offers, search, reviews, delivery checks and settings, require an active customer token. Log in through /mob-api/auth/login and send Authorization: Bearer <token> on every subsequent feature request. Only POST registration, login, and password recovery endpoints are public and rate-limited. Profile and checkout aliases under /auth still require authentication. Missing, invalid, expired, admin, or password-reset tokens are rejected with HTTP 401. Both API base paths enforce the same policy. Swagger UI and OpenAPI documentation remain public for developer access.

Auth's original authController.js, authRoutes.js, authValidation.js, and JWT signing behavior are retained, including the original 10-year mobile token lifetime. Auth/authAliases.js adds client URL aliases /auth/me and /auth/reset-password without editing those original files. Recovery uses the original OTP -> resetToken -> new-password flow. Mobile clients use that long-lived token; web refresh-token endpoints are not duplicated.

## Client processes

- banners: banners and marketing messages.
- categories: category tree, categories, subcategories, sub-subcategories.
- products: product list, details, featured products, search, price range, variants. New arrivals and best sellers use product-list filters.
- offers: /offers and /offers/validate; /coupons URLs also work.
- cart: fetch, add, sync, update/remove item, clear.
- checkout: /checkout/send-otp and /checkout/verify-otp, also available at the client's /auth/send-checkout-otp and /auth/verify-checkout-otp URLs.
- orders: place, list my orders, details, cancel, track by ID or order number.
- payments: region detection, initiate, verify. Ownership and gateway-reference checks run before shared payment logic.
- myaccount: profile, change password, wishlist, loyalty, tickets. /auth/profile, /auth/change-password, and /customers/* aliases are preserved.
- reviews and returns: customer review and return processes, including return evidence uploads.
- delivery, stock, currency, gifts, contact, personalshopper, affiliates, search: corresponding storefront processes.
- settings: about, loyalty, tax, OTP threshold and newsletter subscription. Both /settings/:key and /site-settings/:key work.

Feature controllers call the existing backend commerce controllers to share business rules and response formats. Mobile-specific ownership and storefront checks live in the relevant feature folder. Admin CRUD, reports, seeding, and webhook endpoints are not mounted in this API. Existing gateway webhook URLs stay under /api/payments/webhook/*.

## Checks

From Server, run npm run test:mob and npm run swagger:mob (use npm.cmd on PowerShell if needed). Tests stub database and gateway dependencies; live MySQL, email, upload, and payment integration still require environment testing.

## Mobile developer handover

Ready for development integration after deploying/restarting the updated server. Share the reachable HTTPS server URL, `/mob-api/docs/`, `swagger-mob-output.json`, and the Postman collection plus its shared placeholder environment in `Server/postman`. Set Postman's `baseUrl` to the server origin (without `/mob-api`). A physical phone cannot reach the developer machine through `127.0.0.1`; use a reachable test server address.

Register or log in, store the returned `token` securely, and attach `Authorization: Bearer <token>` to all feature requests. Handle HTTP 401 by returning to login. Do not send a recovery `resetToken` as an access token. Share documentation and placeholder configuration; keep Server/.env and local QA credential files private.

Verification for this change: all 9 mocked mobile test groups passed, with missing-token checks for every feature route on both mounts; OpenAPI was regenerated. Production acceptance remains pending a fresh live collection run, successful gateway payment verification, multipart return video upload, and a recheck of historical affiliate latency/timeouts. Earlier live results are preserved in `Server/postman/REPORT.md` and are not results for this change.

## Swagger examples and dummy data

Every documented operation now includes a success response example, including HTTP 201 creation responses. JSON requests have editable dummy payloads; common path/query parameters have sample values. Return form fields include example values while video fields remain file inputs.

Open `/mob-api/docs/`, expand an endpoint, and view **Responses > Example Value**. Use **Try it out** to edit its request, then Authorize with a real customer login token for protected routes.

`dummy-data.json` contains the same per-operation request/response fixtures and primary success status for mobile mocks. `npm run swagger:mob` regenerates it alongside `swagger-mob-output.json`. Fixtures show representative controller response structures; database-backed objects can contain additional fields. Values are synthetic and are not inserted into the database. Each operation illustrates its own scenario (for example, a pending order versus an eligible delivered purchase).

For live tests, register with an email/phone you control, use returned product/order/cart IDs, and replace OTP, reset-token and gateway placeholders with actual test-session values. Return requests require an owned delivered order/item and real video evidence; the example.com video URL is only a placeholder. Payments require a completed sandbox gateway flow. Money, stock, settings, timestamps and messages may vary with configuration and state.


## Mobile product search and filters

`GET /mob-api/products` browses products. `GET /mob-api/products/search` uses the same filters and requires `q`. Both require a customer bearer token and also work under `/api/mob`.

- `categoryId`, `subCategoryId`: positive IDs. Missing/inactive selections return 404; a subcategory belonging to another selected category returns 400.
- `q`: product name search, up to 200 characters.
- `minPrice`, `maxPrice`: inclusive product price bounds in INR (not individual variant prices).
- `collection`: `new-arrivals`, `best-sellers`, `featured`; comma-separated collections match any selected collection.
- `minDiscount`, `maxDiscount`: inclusive 0?100 percentage bounds. Discount is calculated from product price and comparePrice and rounded to a whole percentage. No discount counts as 0%.
- `sort`: `price_asc`, `price_desc`, `newest` (default), or `rating` (highest first).
- `page`: starts at 1; `limit`: defaults to 20, capped at 100 by mobile middleware.

Example: `/mob-api/products/search?q=shirt&categoryId=12&subCategoryId=30&minPrice=500&maxPrice=2000&collection=new-arrivals,best-sellers&minDiscount=10&maxDiscount=50&sort=price_asc&limit=10&page=1`.

Success returns `success`, `products` (with variants), `total`, `page`, `limit`, `totalPages`, and `hasMore`. An empty result is 200 with `products: []`. Invalid input is 400, authentication failures are 401, unknown category/subcategory selections are 404, and database failures are 500.

### Cart and wishlist

All endpoints require a customer bearer token and use the authenticated customer only.

- `GET /mob-api/cart`: items, live unit prices, line totals, subtotal, quantity count, currency, and stock status. Reading does not change saved quantities. Subtotal includes unavailable items; checkout must revalidate availability.
- `POST /mob-api/cart/add`: `{ "productId": 224, "variantId": null, "quantity": 1 }`; increments an existing selection.
- `POST /mob-api/cart/sync`: `{ "items": [...] }`; atomically replaces the cart (maximum 100 selections). Empty items clears it. Duplicate selections are rejected.
- `PUT /mob-api/cart/item/:itemId`: `{ "quantity": 2 }`; zero removes the item.
- `DELETE /mob-api/cart/item/:itemId` and `DELETE /mob-api/cart/clear`.
- `GET /mob-api/wishlist`: saved products/variants and total count.
- `POST /mob-api/wishlist/add`: `{ "productId": 224, "variantId": null }`; idempotent add.
- `POST /mob-api/wishlist/toggle`: the same body adds or removes a selection.
- `DELETE /mob-api/wishlist/item/:itemId` and `DELETE /mob-api/wishlist/clear`.

IDs and quantities in JSON must be integers; quantity defaults to one. Cart writes reject inactive products, unrelated variants, mixed currencies, and insufficient stock (409). Rejected writes leave the cart unchanged. Wishlist permits saving out-of-stock active products. Existing `/myaccount/wishlist` and `/customers/wishlist` GET/POST aliases remain available (POST toggles). Mutation responses acknowledge the operation; GET retrieves the refreshed collection. Product media uses the mobile catalog formatter. The `/api/mob` mount supports the same routes.

### Saved addresses

Customer-authenticated endpoints (also available under `/api/mob`):

- `GET /mob-api/addresses`: list your addresses, default first.
- `POST /mob-api/addresses`: save an address (201).
- `GET /mob-api/addresses/:addressId`: retrieve one address.
- `PUT /mob-api/addresses/:addressId`: partially update address fields.
- `PUT /mob-api/addresses/:addressId/default`: select the default.
- `DELETE /mob-api/addresses/:addressId`: delete an address.

Required create fields: `name`, `phone`, `address`, `city`, `state`, `pincode`, `country` (strings). Optional: `label` (defaults to Home), `email`, `addressLine2`, `landmark`, `isDefault` (boolean). Unknown fields, including customerId, are rejected. The authenticated customer owns every address; another customer's address returns 404. First address is default. Deleting the default promotes the oldest remaining address. Choose another default instead of unsetting the current one. The legacy single profile address is unchanged and is not automatically imported.

`POST /mob-api/orders` accepts `shippingAddressId` and optional `billingAddressId` instead of inline address objects. IDs must belong to the authenticated customer. Do not send an ID and inline object for the same address. Billing falls back to shipping if omitted. Checkout stores a snapshot, so changing or deleting a saved address cannot change existing orders. Selecting the default at checkout remains explicit.

The additive `CustomerAddresses` table is created by the existing model sync on server startup. No existing address or order data is replaced.

### Mobile coupons and wishlist variants

- `GET /mob-api/coupons?page=1&limit=20`: currently available coupons for the signed-in customer. Optional `subtotal=1000` filters minimum spend and adds discount previews. Returns coupons, total, page, limit, totalPages and hasMore. `/offers` is a compatibility alias.
- `POST /mob-api/coupons/validate` with `{ "code": "WELCOME10", "subtotal": 1000 }`: returns valid, coupon, subtotal, discountAmount, discountedSubtotal and freeShipping. Invalid or ineligible codes return 400/404 with valid=false. `/offers/validate` remains an alias.
- Both require a customer bearer token. Subtotal is a non-negative JSON number with at most two decimal places. Code is trimmed and uppercased. `cartSubtotal` remains accepted as a legacy alias. Usage limits are per customer; all non-cancelled orders count, including pending orders. Zero/null limit means unlimited. Client-supplied customer IDs do not affect eligibility.
- Validation is a preview, not a redemption or reservation. Send `couponCode` with `POST /mob-api/orders` to apply it. Checkout recalculates prices, checks availability and customer usage, and applies free shipping when that coupon is retained. Existing loyalty rules may replace a coupon with a better loyalty discount. Coupon monetary amounts have no currency field in the existing model; supply the subtotal in the same currency as checkout. Discounted subtotal excludes shipping and tax.
- To save a specific variant: `POST /mob-api/wishlist/add` with `{ "productId": 224, "variantId": 10 }`. Discover IDs through `GET /mob-api/variants/product/224`. A different variant is a separate saved item. Add is idempotent; `POST /mob-api/wishlist/toggle` with the same IDs removes an existing selection or saves it if absent.

### Checkout APIs and website address selection

- `GET /mob-api/checkout`: returns `checkout.cart`, `checkout.addresses`, `defaultAddressId`, `stockIssues` and `totalsAreFinal: false`. This is checkout preparation; final delivery, tax, coupon and loyalty amounts come from the order response.
- `POST /mob-api/checkout/place-order`: submit `{ "shippingAddressId": 1, "billingAddressId": 2, "paymentMethod": "Razorpay Secure Online", "requestedCurrency": "INR" }`. Omit billing to use shipping. Saved addresses must belong to the caller. Alternatively use inline address objects. India delivery requires a six-digit pincode. For buy-now use `isBuyNow: true` and `buyNowItem: { productId, variantId, quantity }`.
- `POST /mob-api/checkout/payments/initiate`: `{ "orderId": 57 }`; returns gateway details for the authenticated customer's pending order.
- Open the returned gateway in the mobile SDK. Then `POST /mob-api/checkout/payments/verify` with the same body as `/payments/verify` (Razorpay: orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature; Telr: orderId and orderRef).
- Existing checkout OTP endpoints remain available. All checkout APIs require a customer bearer token and work at `/api/mob` as well.

Website saved addresses are managed at `/account/addresses` and selected independently for billing and delivery at `/checkout`. The existing same-as-billing switch remains available. Choosing a saved address fills editable fields; editing them changes this order's snapshot, not the saved address. Save a new address explicitly or edit it from the account page. Website CRUD uses `/api/customers/addresses` with the same ownership checks and data as mobile. Guests can still enter addresses manually.
