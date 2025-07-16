# Frontend Build Configurations

This frontend uses multiple TypeScript configurations to handle different scenarios:

## Build Scripts

### `npm run build` (Default for Vercel)
- **Purpose**: Production build that bypasses TypeScript compilation
- **Use case**: Quick builds for deployment when type safety is not critical
- **Command**: `vite build`
- **Note**: This is what Vercel uses by default

### `npm run build:prod`
- **Purpose**: Production build with production mode optimizations
- **Use case**: Final production deployments
- **Command**: `vite build --mode production`

### `npm run build:lenient`
- **Purpose**: Build with lenient TypeScript checking
- **Use case**: Development builds when you want some type checking but need to work around React 18/19 compatibility issues
- **Command**: `tsc -p tsconfig.lenient.json && vite build`
- **Config**: Uses `tsconfig.lenient.json`

### `npm run build:with-types`
- **Purpose**: Build with very lenient TypeScript settings
- **Use case**: When you need type checking but want to ignore most errors
- **Command**: `tsc -p tsconfig.build.json && vite build`
- **Config**: Uses `tsconfig.build.json`

### `npm run build:strict`
- **Purpose**: Build with strict TypeScript checking
- **Use case**: Local development to catch all type errors
- **Command**: `tsc -b && vite build`
- **Config**: Uses default TypeScript project references

## TypeScript Configurations

1. **tsconfig.json** - Base configuration with project references
2. **tsconfig.app.json** - Strict configuration for development
3. **tsconfig.build.json** - Very lenient configuration for problematic builds
4. **tsconfig.lenient.json** - Moderately lenient configuration with React compatibility settings

## Vercel Deployment

The `vercel.json` configuration uses `npm run build` which skips TypeScript compilation entirely. This ensures the frontend can be deployed even with type errors.

To change this behavior, modify the `buildCommand` in `vercel.json`.

## React Type Compatibility Issues

The main issues are related to React 18/19 type definitions where component types are not fully compatible. The lenient configurations disable strict type checking to work around these issues.

Common errors include:
- "X cannot be used as a JSX component"
- "Type 'ReactNode' is not assignable to type 'React.ReactNode'"
- Missing properties in component type definitions

## Recommendations

1. For production deployments on Vercel: Use the default `npm run build`
2. For local development: Use `npm run dev` which uses Vite's built-in TypeScript handling
3. For CI/CD pipelines: Consider using `npm run build:lenient` for a balance between type safety and compatibility
4. Fix type errors gradually using `npm run type-check` locally