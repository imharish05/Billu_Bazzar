# Run the mobile API scenarios in Postman

1. Import `mobile-api.postman_collection.json` and `mobile-api.postman_environment.json` into Postman.
2. Select the environment. Set `baseUrl`, unique QA emails/phone numbers, `qaPassword`, and `qaNewPassword`. Use a local/test database.
3. Keep `runManual=false` for the automatic test suite. Run folders 01–07 and 99 in order, or run the whole collection with folder 90 disabled by its pre-request scripts.
4. Review `REPORT.md` and `results.json` for the actual executed results. `scenarios.json` lists expected outcomes and prerequisites.

The collection captures login tokens and actual product/category/variant/cart IDs. Do not hardcode another customer's cart or order IDs. Duplicate registration is deliberately tested after successful registration. To repeat the full suite, use new QA email addresses and phone numbers; do not rerun registration with the same account and interpret the resulting conflict as a defect.

Folder 90 contains order placement, payment, successful recovery/checkout OTP, contact email, delivered-product reviews, and evidence-upload returns. These requests are skipped until `runManual=true`. Supply the named prerequisites and run the needed requests interactively; gateway completion and OTP entry cannot be automated with fabricated data. A return requires a real video selected in the form-data field. The order scenario requires a populated QA cart; add a product again if folder 99 already cleared it.

Local execution used Newman, the Postman collection runner, rather than Postman desktop:

```powershell
npm.cmd exec --yes --package=newman -- newman run postman/mobile-api.postman_collection.json -e postman/qa.local.json --reporters cli,json --reporter-json-export postman/run.local.json --export-environment postman/executed.local.json --timeout-request 60000 --delay-request 150
node postman/report.js
```

Run those commands from `Server`. `node postman/generate.js` regenerates the collection and fresh local QA environment. The `.local.json` files contain test credentials/tokens and are git-ignored; the shared environment has password placeholders, and the report excludes tokens/passwords.

The suite writes test data: accounts, loyalty signup entries, carts, wishlist toggles, a support ticket, a stock alert, and a personal-shopping request. Both carts are cleared at the end; other clearly labeled QA records remain for inspection. Requests that would send notifications or charge gateways are not part of the default successful-flow run.

## Dedicated integration fixtures

`node postman/integration.js` runs Newman against an ephemeral local HTTP server using the actual controllers and configured local MySQL database. It requires the `newman` package to be resolvable, or `NEWMAN_MODULE` set to an installed Newman package directory. It refuses production mode and non-local database hosts. Email functions are replaced with an in-process sink for this run only; no gateway success is fabricated. Original Auth files remain unchanged.

The run creates isolated customers, products, coupon and delivered-order fixtures, places and cancels a pending order through HTTP, and verifies ownership, review CRUD, returns with a video URL, and OTP password recovery. Product/category/coupon fixtures are deactivated afterward. Labelled QA records remain for review. `integration-results.json` contains sanitized results and fixture IDs. A seeded delivered order does not prove payment or delivery, and a video URL does not prove multipart upload. `node postman/report.js` includes these results separately.

`node postman/coverage.js` compares frontend `api.method` calls with documented mobile routes and writes `frontend-coverage.json`. This is a route mapping check, not proof of payload or end-to-end compatibility. Website refresh-token helpers are intentionally not ported: original mobile Auth remains as requested.

## Current authentication policy

Every mobile feature request requires `Authorization: Bearer <token>`, including catalog browsing. Only registration, login and password recovery are public; profile and checkout aliases require login. Folder 07 expects HTTP 401 for guest browsing. The regenerated 221-scenario collection has not been rerun live. REPORT.md and saved integration results describe earlier runs.
