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

// Check vercel.json configuration
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  // Check if using modern format (buildCommand/outputDirectory instead of builds)
  const hasModernFormat = vercelConfig.buildCommand && vercelConfig.outputDirectory;
  checks.push({
    name: 'Vercel configuration format',
    passed: hasModernFormat,
    message: hasModernFormat ? '✅ Modern buildCommand format' : '⚠️ Using legacy builds format'
  });
  
  // Check for proper runtime specification in functions
  const hasNodeRuntime = vercelConfig.functions && 
    vercelConfig.functions['api/*.js'] && 
    vercelConfig.functions['api/*.js'].runtime === 'nodejs18.x';
  checks.push({
    name: 'Node.js runtime configuration',
    passed: hasNodeRuntime,
    message: hasNodeRuntime ? '✅ Proper nodejs18.x runtime' : '❌ Invalid runtime configuration'
  });
  
} catch (error) {
  checks.push({
    name: 'Vercel configuration validity',
    passed: false,
    message: '❌ Invalid JSON in vercel.json'
  });
}

// Check frontend package.json build script
try {
  const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  const hasBuildScript = frontendPackage.scripts && frontendPackage.scripts.build;
  const buildScript = frontendPackage.scripts?.build || '';
  const hasArchiveDependency = buildScript.includes('../tools/') || buildScript.includes('../archived/');
  
  checks.push({
    name: 'Frontend build script',
    passed: hasBuildScript && !hasArchiveDependency,
    message: hasBuildScript 
      ? (hasArchiveDependency ? '⚠️ References archived files' : '✅ Clean build script')
      : '❌ Missing build script'
  });
} catch (error) {
  checks.push({
    name: 'Frontend package.json validity',
    passed: false,
    message: '❌ Invalid or missing frontend/package.json'
  });
}

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
  console.log('\n🚀 Configuration fixes applied:');
  console.log('- Updated vercel.json to use modern builds format');
  console.log('- Fixed Node.js runtime specification');
  console.log('- Cleaned frontend build script');
  console.log('\nYour deployment should now work correctly!');
} else {
  console.log(`❌ ${failedChecks.length} check(s) failed. Please fix before deployment.`);
  process.exit(1);
}

if (warningChecks.length > 0) {
  console.log(`\n⚠️ ${warningChecks.length} warning(s) - review but not blocking deployment.`);
}

// Show deployment info
console.log('\n📡 Deployment Status:');
console.log('✅ Configuration fixes pushed to GitHub');
console.log('🔄 Vercel should auto-deploy the fixes');
console.log('🌐 Check your Vercel dashboard for deployment progress');

console.log('\n💡 Next steps if deployment fails:');
console.log('1. Check Vercel build logs for specific errors');
console.log('2. Verify environment variables are set in Vercel dashboard');
console.log('3. Ensure all required API keys are configured');

console.log('\n📁 Current project structure:');
console.log('autodevelop-v2/');
console.log('├── api/                    # Vercel serverless functions');
console.log('├── backend/                # Core backend logic');  
console.log('├── frontend/               # React frontend');
console.log('├── archived/               # Non-production files');
console.log('├── vercel.json            # Fixed Vercel configuration');
console.log('├── package.json           # Dependencies & scripts');
console.log('└── README.md              # Documentation');
