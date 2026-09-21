# mob-api gap fixes — what changed & how to install

This folder is a drop-in replacement for `Server/mob-api` in the Billu_Bazzar repo.
It is NOT standalone — it requires the rest of `Server/` (models, controllers,
config, middleware, node_modules) to run, exactly like the original.

## What was fixed

1. **README overclaim removed** (`README.md`)
   Old line claimed the categories API returns "sub-subcategories". No such
   model/table/endpoint exists anywhere in the codebase (web or mobile), so
   the claim was corrected instead of inventing a feature that isn't wanted:
   `- categories: category tree, categories, subcategories. There is no sub-subcategory level.`

2. **Missing delivery pincode alias added** (`delivery/deliveryRoutes.js`, `delivery/deliverySwagger.js`, `swaggerExamples.js`)
   Web API exposes pincode check both as `/check/:pincode` (path) and
   `/check?pincode=` (query). Mobile only had the path version. Controller
   already supported `req.query.pincode`, route just wasn't wired.
   Added: `GET /mob-api/delivery-zones/check?pincode=600001`
   Documented in Swagger + given a dummy-data example so `swagger:mob` regeneration
   doesn't fail.

3. **Dead-code duplicate routes removed** (`offers/offersRoutes.js`, `offers/offersSwagger.js`)
   `offersRoutes.js` re-registered `GET /coupons` and `POST /coupons/validate`,
   but `couponsRoutes.js` is mounted first in `index.js` and already owns those
   exact paths — the offers copies could never execute. Removed the dead
   registrations and their duplicate Swagger docs. Only `/offers` and
   `/offers/validate` (the actual alias this module exists for) remain.

Verified after the fix: every implemented route has exactly one matching
Swagger doc and vice versa (97 routes ↔ 97 documented operations, 1:1).

## Installation (replace into existing repo)

1. Back up the current folder (optional but recommended):
   ```bash
   cd Billu_Bazzar/Server
   mv mob-api mob-api.bak
   ```

2. Copy this fixed `mob-api` folder into `Billu_Bazzar/Server/`, replacing the old one:
   ```bash
   cp -r /path/to/extracted/mob-api Billu_Bazzar/Server/
   ```

3. Install/verify dependencies (from `Server/`, only needed once for the repo):
   ```bash
   cd Billu_Bazzar/Server
   npm install
   ```

4. Make sure your `.env` is set up (DB creds, JWT secret, etc.) — unchanged from
   before, this fix touches no config or models.

5. Regenerate the OpenAPI/dummy-data output (picks up the new delivery route + example):
   ```bash
   npm run swagger:mob
   ```
   This should complete without the `Missing mobile example` error that would
   occur if a route were added without a matching example.

6. Run the mobile test suite:
   ```bash
   npm run test:mob
   ```

7. Start the server:
   ```bash
   npm start
   ```

8. Verify in browser / curl:
   - Swagger UI: `http://localhost:<port>/mob-api/docs/`
   - New route:  `GET /mob-api/delivery-zones/check?pincode=600001` (needs `Authorization: Bearer <token>`)
   - Confirm `/mob-api/offers` and `/mob-api/coupons` still both work (only the
     dead duplicate registration was removed, not the routes themselves).

No database migration needed — nothing here touches models, so there's no
schema change to sync.
