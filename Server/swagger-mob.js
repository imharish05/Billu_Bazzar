'use strict';
const fs = require('fs');
const path = require('path');
const spec = require('./mob-api/swagger');
fs.writeFileSync(path.join(__dirname, 'swagger-mob-output.json'), JSON.stringify(spec, null, 2) + '\n');
console.log('Generated customer mobile OpenAPI specification.');

fs.writeFileSync(path.join(__dirname, 'mob-api/dummy-data.json'), JSON.stringify({ note: 'Synthetic per-operation examples, not database seed data. Replace IDs, credentials, OTPs and payment references with values from your test environment. Review/return examples require an owned delivered order. Monetary strings reflect database DECIMAL serialization; values vary with runtime configuration.', operations: require('./mob-api/swaggerExamples').examples }, null, 2) + '\n');
