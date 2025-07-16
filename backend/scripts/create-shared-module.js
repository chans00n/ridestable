const fs = require('fs');
const path = require('path');

console.log('Creating @stable-ride/shared module for Vercel...');

const nodeModulesPath = path.join(__dirname, '../node_modules');
const sharedModulePath = path.join(nodeModulesPath, '@stable-ride/shared');

// Create directory structure
fs.mkdirSync(sharedModulePath, { recursive: true });

// Create package.json for the module
const packageJson = {
  "name": "@stable-ride/shared",
  "version": "1.0.0",
  "main": "index.js",
  "types": "index.d.ts"
};

fs.writeFileSync(
  path.join(sharedModulePath, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Create index.js that exports from shared-types
const indexJs = `
// This file re-exports everything from the bundled shared-types
module.exports = require('../../src/shared-types');
`;

fs.writeFileSync(
  path.join(sharedModulePath, 'index.js'),
  indexJs.trim()
);

console.log('@stable-ride/shared module created successfully!');