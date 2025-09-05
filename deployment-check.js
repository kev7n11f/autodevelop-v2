#!/usr/bin/env node

/**
 * Vercel Deployment Verification Script
 * Checks if the project is ready for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 AutoDevelop.ai v2 - Vercel Deployment Check\n');

const checks = [];

// Check if required files exist
const requiredFiles = [
  'vercel.json',
  'package.json',
  'api/index.js',
  'frontend/package.json',
  'frontend/src/main.jsx',
  'backend/server.js'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  checks.push({
    name: `Required file: ${file}`,
    passed: exists,
    message: exists ? '✅ Found' : '❌ Missing'
  });
});

// Check package.json has Vercel build script
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
checks.push({
  name: 'Vercel build script',
  passed: !!packageJson.scripts['vercel-build'],
  message: packageJson.scripts['vercel-build'] ? '✅ Found' : '❌ Missing vercel-build script'
});

// Check if archived directory exists
const archivedExists = fs.existsSync('archived');
checks.push({
  name: 'Archived directory',
  passed: archivedExists,
  message: archivedExists ? '✅ Non-production files archived' : '⚠️ No archived directory found'
});

// Check .env.example exists
const envExampleExists = fs.existsSync('.env.example');
checks.push({
  name: 'Environment template',
  passed: envExampleExists,
  message: envExampleExists ? '✅ .env.example found' : '❌ .env.example missing'
});

// Check frontend build directory is in .gitignore
const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
const hasDistIgnore = gitignoreContent.includes('frontend/dist');
checks.push({
  name: 'Frontend dist in .gitignore',
  passed: hasDistIgnore,
  message: hasDistIgnore ? '✅ frontend/dist ignored' : '⚠️ frontend/dist not in .gitignore'
});

// Display results
console.log('📋 Deployment Readiness Check:\n');
checks.forEach(check => {
  console.log(`${check.message} - ${check.name}`);
});

const failedChecks = checks.filter(check => !check.passed);
const warningChecks = checks.filter(check => check.message.includes('⚠️'));

console.log('\n' + '='.repeat(50));

if (failedChecks.length === 0) {
  console.log('🎉 All checks passed! Ready for Vercel deployment.');
  console.log('\nNext steps:');
  console.log('1. Set up environment variables in Vercel dashboard');
  console.log('2. Connect your GitHub repository to Vercel');
  console.log('3. Deploy with: vercel --prod');
} else {
  console.log(`❌ ${failedChecks.length} check(s) failed. Please fix before deployment.`);
  process.exit(1);
}

if (warningChecks.length > 0) {
  console.log(`\n⚠️ ${warningChecks.length} warning(s) - review but not blocking deployment.`);
}

// Show file structure
console.log('\n📁 Current project structure:');
console.log('autodevelop-v2/');
console.log('├── api/                    # Vercel serverless functions');
console.log('├── backend/                # Core backend logic');  
console.log('├── frontend/               # React frontend');
console.log('├── archived/               # Non-production files');
console.log('├── vercel.json            # Vercel configuration');
console.log('├── package.json           # Dependencies & scripts');
console.log('└── README.md              # Documentation');

console.log('\n💡 For detailed setup instructions, see README.md');
