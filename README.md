# AutoDevelop.ai v2

Transform your ideas into reality with AI-powered development.

## Overview

AutoDevelop.ai is a modern, full-stack platform that empowers developers and entrepreneurs to build software faster and smarter using artificial intelligence. Whether you're a seasoned developer or just starting, our tools and AI assistant guide you step-by-step.

## Key Features

- **AI-Powered Guidance**: Get practical advice, code examples, and best practices tailored to your project.
- **Google OAuth Authentication**: Secure user authentication with Google accounts, JWT tokens, and session management.
- **Rapid Prototyping**: Go from idea to working prototype in hours, not weeks.
- **Personalized Learning**: Learn as you build, with explanations and resources that match your skill level.
- **Full-Stack Support**: Frontend, backend, database, deployment—everything covered.
- **Enterprise-Grade Security**: Your ideas and code are protected with industry-standard measures.

## Authentication System

AutoDevelop.ai includes a complete Google OAuth 2.0 authentication system:

- **Secure Login**: Users can sign in with their Google accounts
- **Session Management**: JWT-based authentication with secure cookie storage
- **User Profiles**: Automatic profile creation and management
- **Security Features**: CSRF protection, rate limiting, and secure token handling

For detailed setup instructions, see [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md).

## Getting Started

### Package Manager

This project uses **Yarn** as the package manager. Please ensure you have Yarn installed before proceeding.

#### Installing Yarn
```bash
# Install Yarn globally via npm (one-time setup)
npm install -g yarn

# Or using other methods: https://yarnpkg.com/getting-started/install
```

#### Development Setup
```bash
# Clone the repository
git clone https://github.com/kev7n11f/autodevelop-v2.git
cd autodevelop-v2

# Install all dependencies
yarn install

# Start the development server (both backend and frontend)
yarn dev

# Build for production
yarn build

# Start production server
yarn start
```

#### Important Notes
- **Use `yarn` instead of `npm`** for all package management operations
- The project includes a `.npmrc` file that prevents npm from creating `package-lock.json`
- Always use `yarn add <package>` to add new dependencies, not `npm install <package>`

For more detailed setup instructions, see the frontend and backend README files.

### Contact

- **Email Support:** [support@autodevelop.ai](mailto:support@autodevelop.ai)
- **Enterprise Solutions:** [enterprise@autodevelop.ai](mailto:enterprise@autodevelop.ai)
- **Bug Reports:** [bugs@autodevelop.ai](mailto:bugs@autodevelop.ai)
- **Privacy:** [privacy@autodevelop.ai](mailto:privacy@autodevelop.ai)
- Or use the [Contact page](./frontend/src/components/Contact.jsx).

## Legal and Compliance

AutoDevelop.ai is committed to legal compliance and user protection. Please review our legal documentation:

- **[Privacy Policy](./frontend/src/components/Privacy.jsx)** - How we collect, use, and protect your data
- **[Terms of Service](./TERMS_OF_SERVICE.md)** - Complete terms governing platform use
- **[Cookie Policy](./COOKIE_POLICY.md)** - Information about cookies and tracking
- **[Acceptable Use Policy](./ACCEPTABLE_USE_POLICY.md)** - Guidelines for appropriate platform use
- **[Data Processing Agreement](./DATA_PROCESSING_AGREEMENT.md)** - Enterprise data processing terms
- **[DMCA Policy](./DMCA_POLICY.md)** - Copyright takedown procedures
- **[API Terms of Service](./API_TERMS_OF_SERVICE.md)** - Terms for API usage
- **[Security Disclosure Policy](./SECURITY_DISCLOSURE_POLICY.md)** - How to report security issues
- **[Accessibility Statement](./ACCESSIBILITY_STATEMENT.md)** - Our commitment to accessibility

## Analytics

Vercel Analytics is integrated to provide insights into application usage and performance. The analytics are privacy-focused and cookie-free. For detailed configuration and maintenance information, see the [Vercel Analytics Configuration Guide](./VERCEL_ANALYTICS.md).

## License

```text
MIT License

Copyright (c) 2025 AutoDevelop.ai

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🌍 Future Vision

- Modular bot marketplace  
- Web3 deployment and smart contract automation  
- Tokenized access and staking  
- DAO governance for bot evolution  
- Chain-agnostic support (Ethereum, Solana, etc.)

---

```
