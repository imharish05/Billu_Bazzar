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
