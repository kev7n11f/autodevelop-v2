# 📁 Archived Files - AutoDevelop.ai v2

This folder contains files that were removed from the main project structure to streamline the codebase for **Vercel deployment**. These files are preserved for reference, development, and potential future use.

## 🗂️ Archive Organization

### 📚 `documentation/`
**Purpose**: All documentation files except the main README.md
- Policy documents (Privacy, Terms, DMCA, etc.)
- Implementation guides and summaries
- Deployment and setup documentation
- API documentation
- Security and legal documents

**Why archived**: While important for legal/compliance purposes, these files don't need to be in the root for production deployment.

### 🧪 `tests/`
**Purpose**: All test files and testing utilities
- Paywall functionality tests
- Stripe integration tests
- Pricing tier tests
- Comprehensive test suites

**Why archived**: Test files aren't needed for production deployment but are crucial for development.

### 🛠️ `development-tools/`
**Purpose**: Development utilities and scripts
- Backend debugging tools
- Dependency verification scripts
- Server logging utilities
- Sitemap generation tools

**Why archived**: Development tools shouldn't be in production deployment.

### 🏗️ `legacy-components/`
**Purpose**: Older component versions and duplicated code
- Old component implementations
- Duplicated source directories
- Deprecated UI components

**Why archived**: Cleaning up duplicate and outdated components for cleaner codebase.

### 📜 `scripts-and-demos/`
**Purpose**: Setup scripts, demos, and development utilities
- Project setup scripts
- Stripe seeding scripts
- Payment notification demos
- Database setup utilities

**Why archived**: These are one-time setup or demo files not needed in production.

## 🚀 Current Production Structure

After cleanup, the main project now contains only:

```
autodevelop-v2/
├── api/                    # Vercel serverless functions
├── backend/               # Core backend logic
├── frontend/              # React frontend application
├── package.json          # Root dependencies and scripts
├── vercel.json           # Vercel deployment configuration
└── README.md             # Main project documentation
```

## 🔄 Restoring Archived Files

If you need any archived files back in the main project:

```bash
# Copy specific file back
cp archived/[category]/[filename] ./

# Copy entire category back
cp -r archived/[category]/* ./

# Restore all documentation
cp archived/documentation/* ./
```

## 📋 File Inventory

### Documentation Files Archived:
- ACCEPTABLE_USE_POLICY.md
- ACCESSIBILITY_STATEMENT.md
- API_TERMS_OF_SERVICE.md
- COOKIE_POLICY.md
- CUSTOM_AUTH_SYSTEM.md
- DATA_PROCESSING_AGREEMENT.md
- DEPLOYMENT_SUCCESS.md
- DEPLOYMENT.md
- DEVELOPMENT_TASKS.md
- DMCA_POLICY.md
- EMAIL_COLLECTION_SYSTEM.md
- GITHUB_ENVIRONMENTS_GUIDE.md
- GOOGLE_OAUTH_SETUP.md
- IMPLEMENTATION_SUMMARY.md
- ISSUE_RESOLVED.md
- ISSUES_FIXED.md
- LEGAL_SUMMARY.md
- MERGE_NOTES.md
- PAYMENT_FIX_VERIFICATION.md
- PAYMENT_NOTIFICATIONS.md
- SECURITY_DISCLOSURE_POLICY.md
- SECURITY_FEATURES.md
- SESSION_STORE_GUIDE.md
- STRIPE_PRICING_GUIDE.md
- Structure.md
- TERMS_OF_SERVICE.md
- VERCEL_ANALYTICS.md
- VERCEL_BUILD_FIX.md

### Test Files Archived:
- test-paywall-comprehensive.js
- test-paywall-final.js
- test-paywall-slow.js
- test-paywall.js
- test-pricing-tiers.js

### Development Tools Archived:
- tools/ (entire directory)
- backend-server.log
- Various .log files

### Scripts and Demos Archived:
- bootstrap.js
- demo-payment-notifications.js
- seed-stripe-live.sh
- seed-stripe-pricing.sh
- setup.sh
- stripe.exe

### Legacy Components Archived:
- src/ (duplicate/old components directory)
- autodevelop-v2/ (nested duplicate)

## 🎯 Benefits of This Cleanup

1. **Faster Vercel Deployments**: Smaller codebase = faster builds
2. **Cleaner Repository**: Easier navigation and maintenance
3. **Better Performance**: Reduced bundle size and complexity
4. **Simplified CI/CD**: Less files to process during deployment
5. **Organized Development**: Clear separation of production vs development files

## 🔗 Quick Links

- [Main README](../README.md)
- [Vercel Configuration](../vercel.json)
- [Frontend Application](../frontend/)
- [Backend API](../backend/)

---

**Note**: This archive preserves all development history and important files while optimizing the main project for production deployment on Vercel.
