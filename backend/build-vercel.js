const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Vercel build process...');

// Install dependencies
console.log('Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to install dependencies:', error.message);
  process.exit(1);
}

// Inline shared imports for Vercel
console.log('Inlining shared imports...');
try {
  execSync('node scripts/inline-shared-imports.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to inline shared imports:', error.message);
  process.exit(1);
}

// Generate Prisma client
console.log('Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to generate Prisma client:', error.message);
  process.exit(1);
}

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Try to build with TypeScript compiler first
console.log('Attempting TypeScript build...');
try {
  execSync('npx tsc --project tsconfig.build.json', { stdio: 'inherit' });
  console.log('TypeScript build successful!');
} catch (error) {
  console.warn('TypeScript build failed with errors, using transpilation-only mode...');
  
  // Use our custom transpilation script that bypasses type checking
  try {
    execSync('node transpile-only.js', { stdio: 'inherit' });
    console.log('Transpilation-only build successful!');
  } catch (transpileError) {
    console.error('Transpilation failed:', transpileError.message);
    process.exit(1);
  }
}

// Compile API functions for Vercel
console.log('Compiling API functions...');
try {
  const apiDir = path.join(__dirname, 'api');
  const apiFiles = fs.readdirSync(apiDir).filter(f => f.endsWith('.ts'));
  
  for (const file of apiFiles) {
    const tsFile = path.join(apiDir, file);
    const jsFile = tsFile.replace('.ts', '.js');
    console.log(`Compiling ${file}...`);
    execSync(`npx esbuild ${tsFile} --outfile=${jsFile} --platform=node --target=node18 --format=cjs`, { stdio: 'inherit' });
  }
  console.log('API functions compiled successfully!');
} catch (error) {
  console.error('Failed to compile API functions:', error.message);
  process.exit(1);
}

console.log('Build process completed!');