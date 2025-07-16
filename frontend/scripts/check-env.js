#!/usr/bin/env node

/**
 * Environment validation script for production deployment
 * Run this before deploying to ensure all required variables are set
 */

const requiredEnvVars = [
  'VITE_API_URL',
  'VITE_GOOGLE_MAPS_API_KEY'
];

const optionalEnvVars = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_APP_ENV'
];

console.log('🔍 Checking environment variables for production deployment...\n');

let hasErrors = false;

// Check required variables
console.log('Required Environment Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: NOT SET (Required)`);
    hasErrors = true;
  } else {
    // Mask sensitive values
    const masked = value.substring(0, 10) + '...' + value.substring(value.length - 4);
    console.log(`✅ ${varName}: ${masked}`);
  }
});

console.log('\nOptional Environment Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`⚠️  ${varName}: NOT SET (Optional)`);
  } else {
    const masked = value.length > 20 
      ? value.substring(0, 10) + '...' + value.substring(value.length - 4)
      : value;
    console.log(`✅ ${varName}: ${masked}`);
  }
});

// Validate API URL format
const apiUrl = process.env.VITE_API_URL;
if (apiUrl) {
  console.log('\n🔍 Validating API URL format...');
  try {
    const url = new URL(apiUrl);
    if (url.protocol !== 'https:' && !apiUrl.includes('localhost')) {
      console.log('⚠️  Warning: API URL should use HTTPS in production');
    } else {
      console.log('✅ API URL format is valid');
    }
  } catch (e) {
    console.log('❌ API URL format is invalid:', e.message);
    hasErrors = true;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Environment validation failed!');
  console.log('Please set all required environment variables before deploying.');
  process.exit(1);
} else {
  console.log('✅ Environment validation passed!');
  console.log('Your frontend is ready for deployment.');
}