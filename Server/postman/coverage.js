'use strict';
const fs = require('fs');
const path = require('path');
const spec = require('../mob-api/swagger');
const root = path.resolve(__dirname, '../../Client/src');
const calls = new Map();
function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { visit(file); continue; }
    if (!/\.[jt]sx?$/.test(file)) continue;
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/api\.(get|post|put|patch|delete)\(\s*(['"`])([^'"`]+)\2/g)) {
      const method = match[1];
      const route = match[3].replace('${geoQuery}', '').split('?')[0].replace(/\$\{[^}]+\}/g, '{param}');
      const normalized = route.replace(/\{[^}]+\}/g, ':param');
      const operation = Object.entries(spec.paths).find(([url, methods]) => {
        const documented = url.replace(/^\/mob-api/, '').replace(/\{[^}]+\}/g, ':param').split('/');
        const requested = normalized.split('/');
        return methods[method] && documented.length === requested.length && documented.every((segment, index) => segment === ':param' || segment === requested[index]);
      });
      const key = method.toUpperCase() + ' ' + route;
      const row = calls.get(key) || { method: method.toUpperCase(), route, covered: !!operation, files: [] };
      row.files.push(path.relative(root, file).replace(/\\/g, '/'));
      calls.set(key, row);
    }
  }
}
visit(root);
const rows = [...calls.values()].sort((a,b) => a.route.localeCompare(b.route));
fs.writeFileSync(path.join(__dirname, 'frontend-coverage.json'), JSON.stringify({ note: 'Static api.method URL mapping only; does not prove payload compatibility, successful flows, or calls through other HTTP clients.', routes: rows }, null, 2));
console.log(`${rows.length} distinct frontend api.method routes; ${rows.filter(row => !row.covered).length} missing mobile mappings.`);
for (const row of rows.filter(row => !row.covered)) console.log(row.method, row.route);
if (rows.some(row => !row.covered)) process.exitCode = 1;
