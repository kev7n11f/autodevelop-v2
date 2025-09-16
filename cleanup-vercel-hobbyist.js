#!/usr/bin/env node

/**
 * Vercel Hobbyist Account Cleanup Script
 * Removes PROJECT_ID and ORG_ID references for hobbyist Vercel accounts
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Vercel Hobbyist Account Cleanup');
console.log('Removing PROJECT_ID and ORG_ID references');
console.log('=' .repeat(50));

// Files to check (excluding node_modules)
const filesToCheck = [
  'vercel.json',
  '.env.example',
  '.env.local',
  '.env.production',
  'package.json',
  'README.md'
];

// Directories to search recursively
const dirsToSearch = [
  'src',
  'backend',
  'frontend/src',
  'api'
];

let filesChecked = 0;
let filesModified = 0;
let referencesRemoved = 0;

function checkAndCleanFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    filesChecked++;

    // Patterns to remove
    const patterns = [
      // Environment variables
      /^\s*VERCEL_PROJECT_ID\s*=.*$/gm,
      /^\s*VERCEL_ORG_ID\s*=.*$/gm,
      /^\s*PROJECT_ID\s*=.*$/gm,
      /^\s*ORG_ID\s*=.*$/gm,
      
      // JSON properties
      /"projectId"\s*:\s*"[^"]*"/g,
      /"orgId"\s*:\s*"[^"]*"/g,
      /"project_id"\s*:\s*"[^"]*"/g,
      /"org_id"\s*:\s*"[^"]*"/g,
      
      // JavaScript/TypeScript references
      /process\.env\.VERCEL_PROJECT_ID/g,
      /process\.env\.VERCEL_ORG_ID/g,
      /process\.env\.PROJECT_ID/g,
      /process\.env\.ORG_ID/g,
      
      // Comments about org/project requirements
      /.*\bproject\s+id\b.*hobbyist.*\n?/gi,
      /.*\borg\s+id\b.*hobbyist.*\n?/gi
    ];

    let newContent = content;
    let hasChanges = false;

    patterns.forEach(pattern => {
      const matches = newContent.match(pattern);
      if (matches) {
        console.log(`  Found ${matches.length} reference(s) in ${filePath}`);
        referencesRemoved += matches.length;
        hasChanges = true;
        newContent = newContent.replace(pattern, '');
      }
    });

    // Clean up empty lines
    if (hasChanges) {
      newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
      fs.writeFileSync(filePath, newContent);
      filesModified++;
      console.log(`✅ Cleaned: ${filePath}`);
    }
  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
  }
}

function searchDirectory(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      searchDirectory(filePath);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.json') || file.endsWith('.md'))) {
      checkAndCleanFile(filePath);
    }
  });
}

console.log('\n📁 Checking root configuration files...');
filesToCheck.forEach(file => {
  console.log(`Checking: ${file}`);
  checkAndCleanFile(file);
});

console.log('\n📂 Searching source directories...');
dirsToSearch.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Searching: ${dir}/`);
    searchDirectory(dir);
  } else {
    console.log(`Skipping: ${dir}/ (not found)`);
  }
});

// Check for any remaining vercel.json project configuration
console.log('\n🔧 Checking Vercel configuration...');
const vercelConfigPath = 'vercel.json';
if (fs.existsSync(vercelConfigPath)) {
  try {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    let configModified = false;
    
    if (vercelConfig.projectId || vercelConfig.orgId) {
      delete vercelConfig.projectId;
      delete vercelConfig.orgId;
      configModified = true;
    }
    
    if (vercelConfig.project || vercelConfig.org) {
      delete vercelConfig.project;
      delete vercelConfig.org;
      configModified = true;
    }
    
    if (configModified) {
      fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
      console.log('✅ Cleaned vercel.json configuration');
      filesModified++;
    } else {
      console.log('✅ vercel.json already clean');
    }
  } catch (error) {
    console.log(`❌ Error processing vercel.json: ${error.message}`);
  }
}

// Create .vercelignore if it doesn't exist
console.log('\n📄 Creating .vercelignore for hobbyist account...');
const vercelIgnorePath = '.vercelignore';
const vercelIgnoreContent = `# Vercel ignore file for hobbyist account
# Exclude development and build files
node_modules
.env.local
.env.development
.env.test
*.log
.DS_Store
.vscode
.idea
coverage
dist
build
`;

if (!fs.existsSync(vercelIgnorePath)) {
  fs.writeFileSync(vercelIgnorePath, vercelIgnoreContent);
  console.log('✅ Created .vercelignore file');
} else {
  console.log('✅ .vercelignore already exists');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('🎯 CLEANUP SUMMARY');
console.log('-'.repeat(50));
console.log(`Files checked: ${filesChecked}`);
console.log(`Files modified: ${filesModified}`);
console.log(`References removed: ${referencesRemoved}`);

if (referencesRemoved > 0) {
  console.log('\n✅ CLEANUP COMPLETE');
  console.log('Your project is now configured for Vercel hobbyist account!');
} else {
  console.log('\n✅ NO CLEANUP NEEDED');
  console.log('Your project was already compatible with Vercel hobbyist account!');
}

console.log('\n📋 Next steps:');
console.log('1. Validate environment variables: node validate-environment.js');
console.log('2. Test your deployment: node test-production-ready.js');
console.log('3. Deploy to Vercel: vercel --prod');

// Check if we're in a git repository and suggest committing changes
if (fs.existsSync('.git') && filesModified > 0) {
  console.log('\n📝 Don\'t forget to commit your changes:');
  console.log('git add .');
  console.log('git commit -m "Remove PROJECT_ID/ORG_ID for hobbyist Vercel account"');
}