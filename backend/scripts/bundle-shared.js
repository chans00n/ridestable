const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Bundling shared types into backend...');

const backendSrcPath = path.join(__dirname, '../src');
const sharedSrcPath = path.join(__dirname, '../../shared/src');
const sharedDestPath = path.join(backendSrcPath, 'shared');

// Remove old shared directory if it exists
if (fs.existsSync(sharedDestPath)) {
  fs.rmSync(sharedDestPath, { recursive: true, force: true });
}

// Create shared directory in backend/src
fs.mkdirSync(sharedDestPath, { recursive: true });

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
      // Copy TypeScript files
      let content = fs.readFileSync(srcPath, 'utf8');
      
      // Update import paths if needed
      content = content.replace(/from ['"]@stable-ride\/shared['"]/g, "from '.'");
      
      fs.writeFileSync(destPath, content);
    }
  }
}

// Copy all TypeScript files
copyDir(sharedSrcPath, sharedDestPath);

// Create an index file that exports everything
const indexContent = `
// Auto-generated bundled shared types
export * from './types';
export * from './schemas';
export * from './constants';
export * from './interfaces';
`;

fs.writeFileSync(path.join(sharedDestPath, 'index.ts'), indexContent);

// Now update all imports in the backend to use the local shared directory
console.log('Updating imports in backend files...');

function updateImports(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'shared' && entry.name !== 'node_modules') {
      updateImports(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;
      
      // Replace @stable-ride/shared imports with relative imports to ./shared
      content = content.replace(
        /from ['"]@stable-ride\/shared['"]/g,
        "from '../shared'"
      );
      
      // Handle deeper nested files
      if (fullPath.includes('/routes/') || fullPath.includes('/services/') || fullPath.includes('/middleware/')) {
        content = content.replace(
          /from ['"]\.\.\/shared['"]/g,
          "from '../../shared'"
        );
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated imports in: ${path.relative(backendSrcPath, fullPath)}`);
      }
    }
  }
}

updateImports(backendSrcPath);

console.log('Shared types bundled successfully!');