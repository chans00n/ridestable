const fs = require('fs');
const path = require('path');

console.log('Copying shared package for Vercel deployment...');

const sharedSrcPath = path.join(__dirname, '../../shared/src');
const sharedDestPath = path.join(__dirname, '../node_modules/@stable-ride/shared');

// Create the destination directory
fs.mkdirSync(sharedDestPath, { recursive: true });

// Copy package.json
const packageJson = {
  "name": "@stable-ride/shared",
  "version": "1.0.0",
  "main": "index.js",
  "types": "index.d.ts"
};
fs.writeFileSync(
  path.join(sharedDestPath, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Function to copy directory recursively
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
      // For Vercel, we'll copy TypeScript files directly
      // The backend build process will compile them
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy all TypeScript files
copyDir(sharedSrcPath, sharedDestPath);

// Create an index file that exports everything
const indexContent = `
// Auto-generated index file
export * from './types';
export * from './schemas';
export * from './constants';
export * from './interfaces';
`;

fs.writeFileSync(
  path.join(sharedDestPath, 'index.js'),
  indexContent
);

console.log('Shared package copied successfully!');