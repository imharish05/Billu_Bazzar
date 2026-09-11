# Mobile API Postman test report

> Historical results: this run predates the all-feature authentication policy. Guest browsing now returns 401. The regenerated collection has 221 scenarios and has not been rerun live; scenario IDs below refer to the historical collection. Current mocked mobile tests pass all 9 groups.

Executed with Newman 6.2.2 against http://127.0.0.1:5000. This is an HTTP integration run against the running backend and its MySQL database, not the earlier mocked unit tests. Postman desktop was not used.

**172 passed, 0 failed, 1 connection errors, 18 not run; 191 scenarios total.** A passing negative test proves rejection, not successful completion of the corresponding business flow.

## Actual test data

| Variable | Actual value |
|---|---|
| baseUrl | http://127.0.0.1:5000 |
| qaEmail | mobile.qa.1789036744395@example.com |
| qaEmailB | mobile.qa.b.1789036744395@example.com |
| qaPhone | +919036744395 |
| qaPhoneB | +918036744395 |
| customerId | 19 |
| productId | 224 |
| productSlug | sample |
| productName | sample |
| productPrice | 450.00 |
| productStock | 469 |
| variantId | 31 |
| categoryId | 12 |
| cartItemId | 116 |
| pincode | 600001 |

Passwords and tokens are omitted from this report. They are stored only in ignored local environment/result files. Product and cart IDs were captured from API responses. Pincode 600001 was independently confirmed as an active Chennai delivery zone.

## Failures

No failed executed scenarios.

## Request errors

- **MOB-106: Reject GET /affiliates/track?ref=QA_MISSING** — ESOCKETTIMEDOUT; no HTTP response within the runner timeout.

## Performance checks

- MOB-027: Read /affiliates took 40.5 seconds.

The latest run allows 60 seconds per request. Earlier affiliate requests timed out at 30 seconds. Eventual functional success does not resolve this latency. Direct reads of Affiliates also stalled, while SELECT 1 and an indexed ID lookup responded. The local MySQL log contains InnoDB consistency warnings, but a causal link to this latency has not been established. No database repair or restart was performed.

## Additional live email checks

- Checkout OTP email delivery: PASS. HTTP 200 from Newman; user confirmed email receipt. Fresh delivery was also successful. Historical supplementary check; scenario IDs may change when regenerated.
- First checkout OTP verification: FAIL. HTTP 400 incorrect/expired. The backend uses an in-memory store; a development restart occurred between delivery and verification. Password unchanged.
- Fresh checkout OTP verification: PASS. Executed through Newman with the fresh user-provided code; HTTP 200, Security verification successful. Historical supplementary check; scenario IDs may change when regenerated.
- Used checkout OTP replay: PASS. Reusing the same code returned HTTP 400. The code was not saved in this report.

## Dedicated fixture integration run

Newman HTTP + real MySQL; seeded delivered order; email sink; video URL validation only; no gateway verification. Executed 2026-09-10T11:08:34.833Z. These are separate scenarios, not replacements for skipped main-collection requests.

- PASS: Valid dedicated coupon (HTTP 200).
- PASS: Coupon minimum rejected (HTTP 400).
- PASS: Place online buy-now QA order (HTTP 201).
- PASS: Other customer cannot read order (HTTP 404).
- PASS: Other customer cannot initiate payment (HTTP 404).
- PASS: Other customer cannot cancel order (HTTP 404).
- PASS: Cancel own pending order (HTTP 200).
- PASS: Read owned delivered fixture (HTTP 200).
- PASS: Track owned delivered fixture (HTTP 200).
- PASS: Delivered review eligibility (HTTP 200).
- PASS: Cannot review unpurchased product (HTTP 403).
- PASS: Create delivered-product review (HTTP 201).
- PASS: Other customer cannot update review (HTTP 403).
- PASS: Update owned review (HTTP 200).
- PASS: Delete owned review (HTTP 200).
- PASS: Return delivered fixture with video URL (HTTP 201).
- PASS: Read owned return (HTTP 200).
- PASS: Other customer cannot read return (HTTP 404).
- PASS: Duplicate return rejected (HTTP 400).
- PASS: Recovery email captured by local sink (HTTP 200).
- PASS: Verify recovery OTP from sink (HTTP 200).
- PASS: Reset dedicated QA password (HTTP 200).
- PASS: Login using reset password (HTTP 200).
- PASS: Old password rejected after reset (HTTP 401).

The run creates labelled QA customers, products, a coupon, a seeded delivered order, and a pending order through the API. Catalog/coupon fixtures are deactivated afterward; QA records remain for inspection. Notifications are captured locally. A video URL was supplied; multipart video upload and physical delivery were not tested. Successful gateway payment verification remains pending.

## Fixes found during live testing

- Subcategory and sub-subcategory routes previously called the root-category controller. They now call their own handlers, and the collection checks subCategories/subSubCategories response arrays.
- Marketing-message requests previously called the banner controller. The route now returns the messages array from the marketing-message controller.
- Wishlist variant JSON was returned as a serialized string by this database. The comparison now normalizes serialized JSON before matching, so the second toggle removes the item. The final run verifies the added -> removed transition.
- Test fixtures now use India-format phone numbers accepted by account/profile validation, and the stock-alert JSON payload was corrected.

Auth implementation and token behavior were not changed. All nine mocked boundary-test groups passed, including guest access and private-route protection.

- Guest discovery now allows browsing before login; private commerce still requires an active customer.
- Review creation now rejects products absent from the delivered order, including single-item orders. The missing ProductVariant import and product-hook Op import were corrected.

## Pending integration scenarios

- MOB-040: Validate real active offer. Required fixture was not captured: couponCode, couponSubtotal.
- MOB-172: Place online order. Integration prerequisites; runManual=false. Requires isolated test inventory and an approved order lifecycle.
- MOB-173: Initiate sandbox payment. Integration prerequisites; runManual=false. Requires configured sandbox gateway.
- MOB-174: Verify successful sandbox payment. Integration prerequisites; runManual=false.
- MOB-175: Get owned order. Integration prerequisites; runManual=false.
- MOB-176: Track owned order. Integration prerequisites; runManual=false.
- MOB-177: Customer B cannot pay customer A order. Integration prerequisites; runManual=false.
- MOB-178: Cancel QA order. Integration prerequisites; runManual=false. May send a cancellation email; order must be cancellable.
- MOB-179: Request recovery OTP. Integration prerequisites; runManual=false. Requires a test mailbox/SMTP sink; replace qaEmail with that account.
- MOB-180: Verify recovery OTP. Integration prerequisites; runManual=false.
- MOB-181: Set new password with reset token. Integration prerequisites; runManual=false.
- MOB-182: Send checkout OTP. Integration prerequisites; runManual=false. Requires test mailbox/SMTP sink.
- MOB-183: Verify valid checkout OTP. Integration prerequisites; runManual=false.
- MOB-184: Submit contact enquiry. Integration prerequisites; runManual=false. Sends an admin notification; requires approved sandbox email delivery.
- MOB-185: Review delivered QA purchase. Integration prerequisites; runManual=false.
- MOB-186: Update owned review. Integration prerequisites; runManual=false.
- MOB-187: Delete owned review. Integration prerequisites; runManual=false.
- MOB-188: Return delivered QA item with video. Integration prerequisites; runManual=false. Requires a delivered QA order within the return window, real unboxing video, and sandbox notification delivery.

The main collection keeps email/payment cases disabled by default; separately executed mailbox checks are listed above. Successful gateway verification needs sandbox credentials and a completed gateway transaction. Reviews/returns need a delivered order owned by the QA customer, with eligible items and return evidence. No skipped main-collection case is counted as passed.

## What was tested

Authentication and recovery validation; catalog and settings; offers; cart create/update/sync/remove; two-customer cart ownership; profile and password updates; wishlist, loyalty, support, personal shopping, stock alerts; invalid orders/payments/reviews/returns; admin-route isolation; missing-token rejection for every documented protected operation.

## Test records and cleanup

The run creates two QA customers and their signup loyalty entries. It also creates a QA support ticket, personal-shopping request, and stock alert, and records a search. The cleanup folder clears both QA carts; the wishlist toggle is reversed and the QA password is restored. QA accounts and service records are retained for review rather than deleted directly from the database. Check the individual cleanup results below before assuming cleanup succeeded. No completed purchase, payment charge, delivered order, return shipment is claimed.

Earlier exploratory runs created additional clearly labeled QA accounts/service records. Their records, including wishlist entries created before the fix, remain for inspection. before-fixes-results.json preserves the preceding run summary; the table below is the final run.

## Every scenario

| ID | Scenario | Method / route | Expected | Actual | Result |
|---|---|---|---:|---:|---|
| MOB-001 | Register QA customer A | POST /mob-api/auth/register | 201 | 201 | PASS |
| MOB-002 | Duplicate email is rejected | POST /mob-api/auth/register | 409 | 409 | PASS |
| MOB-003 | Invalid registration email | POST /mob-api/auth/register | 400 | 400 | PASS |
| MOB-004 | Login with wrong password | POST /mob-api/auth/login | 401 | 401 | PASS |
| MOB-005 | Login QA customer A | POST /mob-api/auth/login | 200 | 200 | PASS |
| MOB-006 | Register QA customer B for ownership tests | POST /mob-api/auth/register | 201 | 201 | PASS |
| MOB-007 | Fetch current mobile customer | GET /mob-api/auth/getme | 200 | 200 | PASS |
| MOB-008 | Current customer alias | GET /mob-api/auth/me | 200 | 200 | PASS |
| MOB-009 | Fetch products and choose an in-stock product | GET /mob-api/products?limit=100 | 200 | 200 | PASS |
| MOB-010 | Product details using captured slug | GET /mob-api/products/{{productSlug}} | 200 | 200 | PASS |
| MOB-011 | Variants for the selected product | GET /mob-api/variants/product/{{productId}} | 200 | 200 | PASS |
| MOB-012 | Category tree | GET /mob-api/categories/tree | 200 | 200 | PASS |
| MOB-013 | Read /categories | GET /mob-api/categories | 200 | 200 | PASS |
| MOB-014 | Read /subcategories | GET /mob-api/subcategories | 200 | 200 | PASS |
| MOB-015 | Read /subsubcategories | GET /mob-api/subsubcategories | 200 | 200 | PASS |
| MOB-016 | Read /products/featured | GET /mob-api/products/featured | 200 | 200 | PASS |
| MOB-017 | Read /products/price-range | GET /mob-api/products/price-range | 200 | 200 | PASS |
| MOB-018 | Read /products/search?q=sample | GET /mob-api/products/search?q=sample | 200 | 200 | PASS |
| MOB-019 | Read /products?newArrival=true | GET /mob-api/products?newArrival=true | 200 | 200 | PASS |
| MOB-020 | Read /products?bestSeller=true | GET /mob-api/products?bestSeller=true | 200 | 200 | PASS |
| MOB-021 | Read /banners | GET /mob-api/banners | 200 | 200 | PASS |
| MOB-022 | Read /marketing-messages | GET /mob-api/marketing-messages | 200 | 200 | PASS |
| MOB-023 | Read /search/autocomplete?q=sample | GET /mob-api/search/autocomplete?q=sample | 200 | 200 | PASS |
| MOB-024 | Read /search/trending | GET /mob-api/search/trending | 200 | 200 | PASS |
| MOB-025 | Read /currency/rate | GET /mob-api/currency/rate | 200 | 200 | PASS |
| MOB-026 | Read /gift-service | GET /mob-api/gift-service | 200 | 200 | PASS |
| MOB-027 | Read /affiliates | GET /mob-api/affiliates | 200 | 200 | PASS |
| MOB-028 | Read /payments/geo-detect?geo=IN | GET /mob-api/payments/geo-detect?geo=IN | 200 | 200 | PASS |
| MOB-029 | Read /payments/geo-detect?geo=AE | GET /mob-api/payments/geo-detect?geo=AE | 200 | 200 | PASS |
| MOB-030 | Read site-settings/about | GET /mob-api/site-settings/about | 200 | 200 | PASS |
| MOB-031 | Read site-settings/loyalty | GET /mob-api/site-settings/loyalty | 200 | 200 | PASS |
| MOB-032 | Read site-settings/tax | GET /mob-api/site-settings/tax | 200 | 200 | PASS |
| MOB-033 | Read site-settings/otp_threshold | GET /mob-api/site-settings/otp_threshold | 200 | 200 | PASS |
| MOB-034 | Read settings/about | GET /mob-api/settings/about | 200 | 200 | PASS |
| MOB-035 | Read settings/loyalty | GET /mob-api/settings/loyalty | 200 | 200 | PASS |
| MOB-036 | Read settings/tax | GET /mob-api/settings/tax | 200 | 200 | PASS |
| MOB-037 | Read settings/otp_threshold | GET /mob-api/settings/otp_threshold | 200 | 200 | PASS |
| MOB-038 | Read /offers | GET /mob-api/offers | 200 | 200 | PASS |
| MOB-039 | Read /coupons | GET /mob-api/coupons | 200 | 200 | PASS |
| MOB-040 | Validate real active offer | POST /mob-api/offers/validate | 200 | — | NOT RUN |
| MOB-041 | Delivery by pincode path | GET /mob-api/delivery-zones/check/{{pincode}} | 200 | 200 | PASS |
| MOB-042 | Delivery by pincode query | GET /mob-api/delivery-zones/check?pincode={{pincode}} | 200 | 200 | PASS |
| MOB-043 | Stock of selected product | GET /mob-api/stock-status?productId={{productId}} | 200 | 200 | PASS |
| MOB-044 | Alias API base accepts same customer token | GET /api/mob/products?limit=1 | 200 | 200 | PASS |
| MOB-045 | Start with empty QA cart | DELETE /mob-api/cart/clear | 200 | 200 | PASS |
| MOB-046 | Add real product to QA cart | POST /mob-api/cart/add | 200 | 200 | PASS |
| MOB-047 | Capture cart item ID | GET /mob-api/cart | 200 | 200 | PASS |
| MOB-048 | Update own item quantity | PUT /mob-api/cart/item/{{cartItemId}} | 200 | 200 | PASS |
| MOB-049 | Customer B creates its own separate cart | POST /mob-api/cart/add | 200 | 200 | PASS |
| MOB-050 | Customer B cannot update customer A item | PUT /mob-api/cart/item/{{cartItemId}} | 404 | 404 | PASS |
| MOB-051 | Customer B cannot delete customer A item | DELETE /mob-api/cart/item/{{cartItemId}} | 404 | 404 | PASS |
| MOB-052 | Stock overflow rejected | POST /mob-api/cart/add | 409 | 409 | PASS |
| MOB-053 | Zero quantity rejected | POST /mob-api/cart/add | 400 | 400 | PASS |
| MOB-054 | Remove own item | DELETE /mob-api/cart/item/{{cartItemId}} | 200 | 200 | PASS |
| MOB-055 | Sync QA cart | POST /mob-api/cart/sync | 200 | 200 | PASS |
| MOB-056 | Read /auth/profile | GET /mob-api/auth/profile | 200 | 200 | PASS |
| MOB-057 | Read /myaccount/profile | GET /mob-api/myaccount/profile | 200 | 200 | PASS |
| MOB-058 | Read /myaccount/wishlist | GET /mob-api/myaccount/wishlist | 200 | 200 | PASS |
| MOB-059 | Read /customers/wishlist | GET /mob-api/customers/wishlist | 200 | 200 | PASS |
| MOB-060 | Read /myaccount/loyalty | GET /mob-api/myaccount/loyalty | 200 | 200 | PASS |
| MOB-061 | Read /customers/loyalty | GET /mob-api/customers/loyalty | 200 | 200 | PASS |
| MOB-062 | Read /myaccount/tickets | GET /mob-api/myaccount/tickets | 200 | 200 | PASS |
| MOB-063 | Read /customers/tickets | GET /mob-api/customers/tickets | 200 | 200 | PASS |
| MOB-064 | Read /orders/my | GET /mob-api/orders/my | 200 | 200 | PASS |
| MOB-065 | Read /returns/my | GET /mob-api/returns/my | 200 | 200 | PASS |
| MOB-066 | Read /reviews/my-delivered-items | GET /mob-api/reviews/my-delivered-items | 200 | 200 | PASS |
| MOB-067 | Read /reviews/product/{{productId}} | GET /mob-api/reviews/product/{{productId}} | 200 | 200 | PASS |
| MOB-068 | Update QA profile | PUT /mob-api/myaccount/profile | 200 | 200 | PASS |
| MOB-069 | Add product to wishlist | POST /mob-api/myaccount/wishlist | 200 | 200 | PASS |
| MOB-070 | Remove product from wishlist | POST /mob-api/customers/wishlist | 200 | 200 | PASS |
| MOB-071 | Create QA support ticket | POST /mob-api/myaccount/tickets | 201 | 201 | PASS |
| MOB-072 | Create QA personal shopper request | POST /mob-api/personal-shopper | 201 | 201 | PASS |
| MOB-073 | Create stock alert for QA account | POST /mob-api/stock-alerts | 201 | 201 | PASS |
| MOB-074 | Newsletter compatibility endpoint | POST /mob-api/settings/newsletter-subscribe | 200 | 200 | PASS |
| MOB-075 | Record search | POST /mob-api/search/track | 200 | 200 | PASS |
| MOB-076 | Change QA password | PUT /mob-api/myaccount/change-password | 200 | 200 | PASS |
| MOB-077 | Login with changed password | POST /mob-api/auth/login | 200 | 200 | PASS |
| MOB-078 | Restore QA password | PUT /mob-api/auth/change-password | 200 | 200 | PASS |
| MOB-079 | Clear QA cart before invalid checkout | DELETE /mob-api/cart/clear | 200 | 200 | PASS |
| MOB-080 | Empty cart cannot be ordered | POST /mob-api/orders | 400 | 400 | PASS |
| MOB-081 | Reject GET /products?limit=-1 | GET /mob-api/products?limit=-1 | 400 | 400 | PASS |
| MOB-082 | Reject GET /products/qa-product-does-not-exist | GET /mob-api/products/qa-product-does-not-exist | 404 | 404 | PASS |
| MOB-083 | Reject GET /variants/product/2147483647 | GET /mob-api/variants/product/2147483647 | 404 | 404 | PASS |
| MOB-084 | Reject GET /site-settings/private-secrets | GET /mob-api/site-settings/private-secrets | 404 | 404 | PASS |
| MOB-085 | Reject POST /offers/validate | POST /mob-api/offers/validate | 404 | 404 | PASS |
| MOB-086 | Reject GET /delivery-zones/check | GET /mob-api/delivery-zones/check | 400 | 400 | PASS |
| MOB-087 | Reject GET /stock-status | GET /mob-api/stock-status | 400 | 400 | PASS |
| MOB-088 | Reject POST /search/track | POST /mob-api/search/track | 400 | 400 | PASS |
| MOB-089 | Reject POST /payments/initiate | POST /mob-api/payments/initiate | 400 | 400 | PASS |
| MOB-090 | Reject POST /payments/initiate | POST /mob-api/payments/initiate | 404 | 404 | PASS |
| MOB-091 | Reject POST /payments/verify | POST /mob-api/payments/verify | 404 | 404 | PASS |
| MOB-092 | Reject POST /customers/tickets | POST /mob-api/customers/tickets | 404 | 404 | PASS |
| MOB-093 | Reject GET /orders/my/2147483647 | GET /mob-api/orders/my/2147483647 | 404 | 404 | PASS |
| MOB-094 | Reject GET /orders/track/QA_MISSING_ORDER | GET /mob-api/orders/track/QA_MISSING_ORDER | 404 | 404 | PASS |
| MOB-095 | Reject POST /orders/my/2147483647/cancel | POST /mob-api/orders/my/2147483647/cancel | 404 | 404 | PASS |
| MOB-096 | Reject GET /returns/my/2147483647 | GET /mob-api/returns/my/2147483647 | 404 | 404 | PASS |
| MOB-097 | Reject POST /returns/request | POST /mob-api/returns/request | 400 | 400 | PASS |
| MOB-098 | Reject POST /reviews | POST /mob-api/reviews | 400 | 400 | PASS |
| MOB-099 | Reject POST /reviews | POST /mob-api/reviews | 403 | 403 | PASS |
| MOB-100 | Reject PUT /reviews/2147483647 | PUT /mob-api/reviews/2147483647 | 404 | 404 | PASS |
| MOB-101 | Reject DELETE /reviews/2147483647 | DELETE /mob-api/reviews/2147483647 | 404 | 404 | PASS |
| MOB-102 | Reject POST /contact-enquiries | POST /mob-api/contact-enquiries | 400 | 400 | PASS |
| MOB-103 | Reject POST /personal-shopper | POST /mob-api/personal-shopper | 400 | 400 | PASS |
| MOB-104 | Reject POST /stock-alerts | POST /mob-api/stock-alerts | 400 | 400 | PASS |
| MOB-105 | Reject GET /affiliates/track | GET /mob-api/affiliates/track | 400 | 400 | PASS |
| MOB-106 | Reject GET /affiliates/track?ref=QA_MISSING | GET /mob-api/affiliates/track?ref=QA_MISSING | 404 | — | ERROR |
| MOB-107 | Reject POST /checkout/verify-otp | POST /mob-api/checkout/verify-otp | 400 | 400 | PASS |
| MOB-108 | Reject POST /auth/verify-checkout-otp | POST /mob-api/auth/verify-checkout-otp | 400 | 400 | PASS |
| MOB-109 | Reject POST /auth/forgot-password | POST /mob-api/auth/forgot-password | 400 | 400 | PASS |
| MOB-110 | Reject POST /auth/verify-otp | POST /mob-api/auth/verify-otp | 400 | 400 | PASS |
| MOB-111 | Reject POST /auth/new-password | POST /mob-api/auth/new-password | 401 | 401 | PASS |
| MOB-112 | Reject POST /auth/reset-password | POST /mob-api/auth/reset-password | 401 | 401 | PASS |
| MOB-113 | Forged token rejected | GET /mob-api/products | 401 | 401 | PASS |
| MOB-114 | Admin operation unavailable /products | POST /mob-api/products | 404 | 404 | PASS |
| MOB-115 | Admin operation unavailable /orders | GET /mob-api/orders | 404 | 404 | PASS |
| MOB-116 | Admin operation unavailable /categories/seed | POST /mob-api/categories/seed | 404 | 404 | PASS |
| MOB-117 | Admin operation unavailable /cart/admin/abandoned | GET /mob-api/cart/admin/abandoned | 404 | 404 | PASS |
| MOB-118 | Admin operation unavailable /admin-users | GET /mob-api/admin-users | 404 | 404 | PASS |
| MOB-119 | No token GET /mob-api/auth/getme | GET /mob-api/auth/getme | 401 | 401 | PASS |
| MOB-120 | No token POST /mob-api/settings/newsletter-subscribe | POST /mob-api/settings/newsletter-subscribe | 401 | 401 | PASS |
| MOB-121 | No token GET /mob-api/cart | GET /mob-api/cart | 401 | 401 | PASS |
| MOB-122 | No token POST /mob-api/cart/add | POST /mob-api/cart/add | 401 | 401 | PASS |
| MOB-123 | No token POST /mob-api/cart/sync | POST /mob-api/cart/sync | 401 | 401 | PASS |
| MOB-124 | No token PUT /mob-api/cart/item/{itemId} | PUT /mob-api/cart/item/1 | 401 | 401 | PASS |
| MOB-125 | No token DELETE /mob-api/cart/item/{itemId} | DELETE /mob-api/cart/item/1 | 401 | 401 | PASS |
| MOB-126 | No token DELETE /mob-api/cart/clear | DELETE /mob-api/cart/clear | 401 | 401 | PASS |
| MOB-127 | No token GET /mob-api/orders/my | GET /mob-api/orders/my | 401 | 401 | PASS |
| MOB-128 | No token GET /mob-api/orders/my/{id} | GET /mob-api/orders/my/1 | 401 | 401 | PASS |
| MOB-129 | No token POST /mob-api/orders/my/{id}/cancel | POST /mob-api/orders/my/1/cancel | 401 | 401 | PASS |
| MOB-130 | No token POST /mob-api/orders | POST /mob-api/orders | 401 | 401 | PASS |
| MOB-131 | No token GET /mob-api/orders/track/{identifier} | GET /mob-api/orders/track/1 | 401 | 401 | PASS |
| MOB-132 | No token POST /mob-api/payments/initiate | POST /mob-api/payments/initiate | 401 | 401 | PASS |
| MOB-133 | No token POST /mob-api/payments/verify | POST /mob-api/payments/verify | 401 | 401 | PASS |
| MOB-134 | No token GET /mob-api/customers/wishlist | GET /mob-api/customers/wishlist | 401 | 401 | PASS |
| MOB-135 | No token POST /mob-api/customers/wishlist | POST /mob-api/customers/wishlist | 401 | 401 | PASS |
| MOB-136 | No token GET /mob-api/customers/loyalty | GET /mob-api/customers/loyalty | 401 | 401 | PASS |
| MOB-137 | No token GET /mob-api/customers/tickets | GET /mob-api/customers/tickets | 401 | 401 | PASS |
| MOB-138 | No token POST /mob-api/customers/tickets | POST /mob-api/customers/tickets | 401 | 401 | PASS |
| MOB-139 | No token GET /mob-api/auth/profile | GET /mob-api/auth/profile | 401 | 401 | PASS |
| MOB-140 | No token PUT /mob-api/auth/profile | PUT /mob-api/auth/profile | 401 | 401 | PASS |
| MOB-141 | No token PUT /mob-api/auth/change-password | PUT /mob-api/auth/change-password | 401 | 401 | PASS |
| MOB-142 | No token GET /mob-api/myaccount/wishlist | GET /mob-api/myaccount/wishlist | 401 | 401 | PASS |
| MOB-143 | No token POST /mob-api/myaccount/wishlist | POST /mob-api/myaccount/wishlist | 401 | 401 | PASS |
| MOB-144 | No token GET /mob-api/myaccount/loyalty | GET /mob-api/myaccount/loyalty | 401 | 401 | PASS |
| MOB-145 | No token GET /mob-api/myaccount/tickets | GET /mob-api/myaccount/tickets | 401 | 401 | PASS |
| MOB-146 | No token POST /mob-api/myaccount/tickets | POST /mob-api/myaccount/tickets | 401 | 401 | PASS |
| MOB-147 | No token GET /mob-api/myaccount/profile | GET /mob-api/myaccount/profile | 401 | 401 | PASS |
| MOB-148 | No token PUT /mob-api/myaccount/profile | PUT /mob-api/myaccount/profile | 401 | 401 | PASS |
| MOB-149 | No token PUT /mob-api/myaccount/change-password | PUT /mob-api/myaccount/change-password | 401 | 401 | PASS |
| MOB-150 | No token GET /mob-api/reviews/my-delivered-items | GET /mob-api/reviews/my-delivered-items | 401 | 401 | PASS |
| MOB-151 | No token POST /mob-api/reviews | POST /mob-api/reviews | 401 | 401 | PASS |
| MOB-152 | No token PUT /mob-api/reviews/{id} | PUT /mob-api/reviews/1 | 401 | 401 | PASS |
| MOB-153 | No token DELETE /mob-api/reviews/{id} | DELETE /mob-api/reviews/1 | 401 | 401 | PASS |
| MOB-154 | No token GET /mob-api/returns/my | GET /mob-api/returns/my | 401 | 401 | PASS |
| MOB-155 | No token GET /mob-api/returns/my/{id} | GET /mob-api/returns/my/1 | 401 | 401 | PASS |
| MOB-156 | No token POST /mob-api/returns/request | POST /mob-api/returns/request | 401 | 401 | PASS |
| MOB-157 | No token POST /mob-api/stock-alerts | POST /mob-api/stock-alerts | 401 | 401 | PASS |
| MOB-158 | No token POST /mob-api/contact-enquiries | POST /mob-api/contact-enquiries | 401 | 401 | PASS |
| MOB-159 | No token POST /mob-api/personal-shopper | POST /mob-api/personal-shopper | 401 | 401 | PASS |
| MOB-160 | No token POST /mob-api/checkout/send-otp | POST /mob-api/checkout/send-otp | 401 | 401 | PASS |
| MOB-161 | No token POST /mob-api/checkout/verify-otp | POST /mob-api/checkout/verify-otp | 401 | 401 | PASS |
| MOB-162 | No token POST /mob-api/auth/send-checkout-otp | POST /mob-api/auth/send-checkout-otp | 401 | 401 | PASS |
| MOB-163 | No token POST /mob-api/auth/verify-checkout-otp | POST /mob-api/auth/verify-checkout-otp | 401 | 401 | PASS |
| MOB-164 | No token GET /mob-api/auth/me | GET /mob-api/auth/me | 401 | 401 | PASS |
| MOB-165 | Guest reads /products | GET /mob-api/products | 200 | 200 | PASS |
| MOB-166 | Guest reads /categories | GET /mob-api/categories | 200 | 200 | PASS |
| MOB-167 | Guest reads /banners | GET /mob-api/banners | 200 | 200 | PASS |
| MOB-168 | Guest reads /marketing-messages | GET /mob-api/marketing-messages | 200 | 200 | PASS |
| MOB-169 | Guest reads /search/trending | GET /mob-api/search/trending | 200 | 200 | PASS |
| MOB-170 | Guest cannot read account | GET /mob-api/auth/me | 401 | 401 | PASS |
| MOB-171 | Guest cannot checkout | POST /mob-api/orders | 401 | 401 | PASS |
| MOB-172 | Place online order | POST /mob-api/orders | 201 | — | NOT RUN |
| MOB-173 | Initiate sandbox payment | POST /mob-api/payments/initiate | 200 | — | NOT RUN |
| MOB-174 | Verify successful sandbox payment | POST /mob-api/payments/verify | 200 | — | NOT RUN |
| MOB-175 | Get owned order | GET /mob-api/orders/my/{{orderId}} | 200 | — | NOT RUN |
| MOB-176 | Track owned order | GET /mob-api/orders/track/{{orderId}} | 200 | — | NOT RUN |
| MOB-177 | Customer B cannot pay customer A order | POST /mob-api/payments/initiate | 404 | — | NOT RUN |
| MOB-178 | Cancel QA order | POST /mob-api/orders/my/{{orderId}}/cancel | 200 | — | NOT RUN |
| MOB-179 | Request recovery OTP | POST /mob-api/auth/forgot-password | 200 | — | NOT RUN |
| MOB-180 | Verify recovery OTP | POST /mob-api/auth/verify-otp | 200 | — | NOT RUN |
| MOB-181 | Set new password with reset token | POST /mob-api/auth/new-password | 200 | — | NOT RUN |
| MOB-182 | Send checkout OTP | POST /mob-api/checkout/send-otp | 200 | — | NOT RUN |
| MOB-183 | Verify valid checkout OTP | POST /mob-api/checkout/verify-otp | 200 | — | NOT RUN |
| MOB-184 | Submit contact enquiry | POST /mob-api/contact-enquiries | 201 | — | NOT RUN |
| MOB-185 | Review delivered QA purchase | POST /mob-api/reviews | 201 | — | NOT RUN |
| MOB-186 | Update owned review | PUT /mob-api/reviews/{{reviewId}} | 200 | — | NOT RUN |
| MOB-187 | Delete owned review | DELETE /mob-api/reviews/{{reviewId}} | 200 | — | NOT RUN |
| MOB-188 | Return delivered QA item with video | POST /mob-api/returns/request | 201 | — | NOT RUN |
| MOB-189 | Clear customer A QA cart | DELETE /mob-api/cart/clear | 200 | 200 | PASS |
| MOB-190 | Clear customer B QA cart | DELETE /mob-api/cart/clear | 200 | 200 | PASS |
| MOB-191 | Confirm QA cart is empty | GET /mob-api/cart | 200 | 200 | PASS |
