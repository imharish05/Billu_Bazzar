'use strict';
const swaggerUi = require('swagger-ui-express');
const spec = require('./swaggerDisplay');
const options = {
  customSiteTitle: 'Billu Bazaar | Mobile Customer API',
  swaggerOptions: { persistAuthorization: false, displayRequestDuration: true, docExpansion: 'none', filter: true, defaultModelsExpandDepth: -1 },
};
module.exports = app => {
  app.get(['/mob-api/openapi.json', '/api/mob/openapi.json'], (req, res) => res.json(spec));
  // Isolate the initializer from the web/admin Swagger instance.
  for (const path of ['/mob-api-docs', '/mob-api/docs', '/api/mob/docs']) {
    app.use(path, swaggerUi.serveFiles(spec, options), swaggerUi.setup(spec, options));
  }
};
