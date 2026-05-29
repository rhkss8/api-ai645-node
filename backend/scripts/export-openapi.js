#!/usr/bin/env node

require('ts-node/register/transpile-only');
require('tsconfig-paths/register');

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { buildSwaggerSpec } = require('../src/config/swagger');

const repoRoot = path.resolve(__dirname, '..', '..');
const spec = buildSwaggerSpec();
const json = `${JSON.stringify(spec, null, 2)}\n`;
const yml = yaml.dump(spec, { noRefs: true });

for (const fileName of ['openapi.json', 'swagger.json']) {
  fs.writeFileSync(path.join(repoRoot, fileName), json, 'utf8');
}

for (const fileName of ['openapi.yaml', 'swagger.yaml']) {
  fs.writeFileSync(path.join(repoRoot, fileName), yml, 'utf8');
}

console.log('Exported OpenAPI spec files to repo root.');
