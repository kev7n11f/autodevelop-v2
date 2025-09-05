#!/usr/bin/env node

/**
 * Site Verification Script
 * Tests the deployed AutoDevelop.ai site to ensure all routes work correctly
 */

const https = require('https');

const SITE_URL = 'https://autodevelop-v2.vercel.app';

// Routes to test
const ROUTES_TO_TEST = [
  '/',           // Homepage
  '/about',      // About page (React Router)
  '/contact',    // Contact page (React Router)
  '/privacy',    // Privacy page (React Router)
  '/api/health', // API health check
];

function testRoute(url) {
  return new Promise((resolve) => {
    const request = https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        const status = response.statusCode;
        const contentType = response.headers['content-type'] || '';
        
        resolve({
          url,
          status,
          contentType,
          hasContent: data.length > 0,
          isHtml: contentType.includes('text/html'),
          isJson: contentType.includes('application/json'),
          contentPreview: data.substring(0, 100)
        });
      });
    });
    
    request.on('error', (error) => {
      resolve({
        url,
        status: 'ERROR',
        error: error.message
      });
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        error: 'Request timed out'
      });
    });
  });
}

async function verifyDeployment() {
  console.log('🚀 Testing AutoDevelop.ai v2 Deployment');
  console.log(`🌐 Site URL: ${SITE_URL}`);
  console.log('==========================================\n');
  
  let allPassed = true;
  
  for (const route of ROUTES_TO_TEST) {
    const fullUrl = `${SITE_URL}${route}`;
    console.log(`Testing: ${route}`);
    
    const result = await testRoute(fullUrl);
    
    if (result.error) {
      console.log(`❌ FAILED: ${result.error}`);
      allPassed = false;
    } else if (result.status === 200) {
      if (route.startsWith('/api/')) {
        // API endpoint
        if (result.isJson) {
          console.log(`✅ PASS: API endpoint responding (${result.status})`);
        } else {
          console.log(`⚠️  WARNING: API endpoint not returning JSON (${result.status})`);
        }
      } else {
        // Frontend route
        if (result.isHtml && result.hasContent) {
          console.log(`✅ PASS: Page loaded successfully (${result.status})`);
        } else {
          console.log(`⚠️  WARNING: Page might not be loading correctly (${result.status})`);
        }
      }
    } else {
      console.log(`❌ FAILED: HTTP ${result.status}`);
      allPassed = false;
    }
    
    console.log(`   Content-Type: ${result.contentType}`);
    if (result.contentPreview) {
      console.log(`   Preview: ${result.contentPreview.replace(/\n/g, ' ')}`);
    }
    console.log('');
  }
  
  console.log('==========================================');
  if (allPassed) {
    console.log('🎉 All tests passed! Site is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the deployment.');
  }
  
  console.log('\n📝 Manual Testing Checklist:');
  console.log('1. Navigate to each page manually');
  console.log('2. Test form submissions (if any)');
  console.log('3. Check browser console for errors');
  console.log('4. Verify responsive design on mobile');
  console.log('5. Test any authentication flows');
}

// Run the verification
verifyDeployment().catch(console.error);
