# AutoDevelop.ai Frontend

React + Vite frontend for the AutoDevelop.ai platform.

## Setup Instructions

### Prerequisites
- Node.js (LTS version recommended)
- Yarn package manager (required - see main README.md for installation)

### Development Setup
```bash
# From the project root directory
cd frontend

# Install frontend dependencies
yarn install

# Start the development server
yarn dev
```

The frontend will be available at `http://localhost:5173` with hot module replacement (HMR) enabled.

### Available Scripts
```bash
# Development server with HMR
yarn dev

# Build for production
yarn build

# Preview production build locally
yarn preview

# Lint code
yarn lint
```

### Project Structure
- `src/components/` - Reusable React components
- `src/pages/` - Page-level components
- `src/bot/` - Bot-related UI components
- `public/` - Static assets

### Package Manager
**Important:** This project uses Yarn exclusively. Do not use npm commands as they may cause conflicts with dependency management.

### API Integration
The frontend is configured to proxy API requests to the backend server at `http://localhost:8080` during development.
