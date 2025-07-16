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

// No need to update imports - TypeScript path mapping will handle it

console.log('Shared types bundled successfully!');