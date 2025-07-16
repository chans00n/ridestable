const fs = require('fs');
const path = require('path');

console.log('Copying shared module for Vercel deployment...');

const sharedSrcPath = path.join(__dirname, '../../shared');
const targetPath = path.join(__dirname, '../node_modules/@stable-ride/shared');

// Check if shared directory exists
if (!fs.existsSync(sharedSrcPath)) {
  console.error('Shared module source not found at:', sharedSrcPath);
  console.log('Using bundled shared-types.ts instead...');
  
  // Fallback: Create module from shared-types.ts
  fs.mkdirSync(targetPath, { recursive: true });
  
  // Copy shared-types.ts as index.ts
  const sharedTypesPath = path.join(__dirname, '../src/shared-types.ts');
  fs.copyFileSync(sharedTypesPath, path.join(targetPath, 'index.ts'));
  
  // Create a simple package.json
  const packageJson = {
    "name": "@stable-ride/shared",
    "version": "1.0.0",
    "main": "index.ts",
    "types": "index.ts"
  };
  
  fs.writeFileSync(
    path.join(targetPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  console.log('Created @stable-ride/shared from shared-types.ts');
  return;
}

// Copy the entire shared module
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Remove old module if it exists
if (fs.existsSync(targetPath)) {
  fs.rmSync(targetPath, { recursive: true, force: true });
}

// Copy the shared module
copyDir(sharedSrcPath, targetPath);

console.log('Shared module copied successfully!');