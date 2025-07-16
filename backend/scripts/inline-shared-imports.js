const fs = require('fs');
const path = require('path');

console.log('Inlining shared imports for Vercel deployment...');

const srcPath = path.join(__dirname, '../src');

function updateImports(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      updateImports(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && entry.name !== 'shared-types.ts') {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;
      
      // Calculate relative path from current file to shared-types.ts
      const relativePath = path.relative(path.dirname(fullPath), path.join(srcPath, 'shared-types'));
      const importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
      
      // Replace @stable-ride/shared imports
      content = content.replace(
        /from ['"]@stable-ride\/shared['"]/g,
        `from '${importPath}'`
      );
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated imports in: ${path.relative(srcPath, fullPath)}`);
      }
    }
  }
}

// Backup original files first (create .original files)
console.log('Creating backups of original files...');
function backupFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      backupFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.original.ts')) {
      const backupPath = fullPath + '.original';
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(fullPath, backupPath);
      }
    }
  }
}

backupFiles(srcPath);

// Update imports
updateImports(srcPath);

console.log('Import inlining complete!');