const ts = require('typescript');
const fs = require('fs');
const path = require('path');

// Transpile TypeScript without type checking
function transpileFile(filePath, outDir) {
  const source = fs.readFileSync(filePath, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
    }
  });
  
  const relativePath = path.relative(path.join(__dirname, 'src'), filePath);
  const outPath = path.join(outDir, relativePath.replace(/\.ts$/, '.js'));
  
  // Ensure directory exists
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  
  // Write transpiled file
  fs.writeFileSync(outPath, result.outputText);
}

// Recursively find and transpile all TypeScript files
function transpileDirectory(dir, outDir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      transpileDirectory(filePath, outDir);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      console.log(`Transpiling ${filePath}...`);
      try {
        transpileFile(filePath, outDir);
      } catch (error) {
        console.error(`Failed to transpile ${filePath}:`, error.message);
      }
    } else if (!file.endsWith('.ts')) {
      // Copy non-TypeScript files
      const relativePath = path.relative(path.join(__dirname, 'src'), filePath);
      const outPath = path.join(outDir, relativePath);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.copyFileSync(filePath, outPath);
    }
  }
}

console.log('Starting transpilation-only build...');

const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

// Clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Transpile all files
transpileDirectory(srcDir, distDir);

console.log('Transpilation complete!');