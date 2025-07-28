#!/bin/bash

# Real Estate Analyzer - Test Setup Script
# Sets up environment for comprehensive testing

set -e  # Exit on any error

echo "🏗️  Setting up Real Estate Analyzer Test Environment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
log() {
    echo -e "${2}${1}${NC}"
}

# Check if we're in the backend directory
if [[ ! -f "package.json" ]]; then
    log "❌ Error: Run this script from the backend directory" $RED
    exit 1
fi

# Install dependencies if needed
log "📦 Checking dependencies..." $BLUE
if [[ ! -d "node_modules" ]] || [[ ! -f "node_modules/.package-lock.json" ]]; then
    log "Installing backend dependencies..." $YELLOW
    npm install
    log "✅ Backend dependencies installed" $GREEN
fi

# Check if frontend exists and install its dependencies
if [[ -d "../frontend" ]]; then
    log "📦 Checking frontend dependencies..." $BLUE
    cd ../frontend
    if [[ ! -d "node_modules" ]] || [[ ! -f "node_modules/.package-lock.json" ]]; then
        log "Installing frontend dependencies..." $YELLOW
        npm install
        log "✅ Frontend dependencies installed" $GREEN
    fi
    cd ../backend
fi

# Create test directories
log "📁 Creating test directories..." $BLUE
mkdir -p cypress/downloads cypress/screenshots cypress/videos
mkdir -p test-reports
mkdir -p coverage
log "✅ Test directories created" $GREEN

# Initialize Cypress if it hasn't been initialized
if [[ ! -f "cypress.config.js" ]]; then
    log "⚙️  Initializing Cypress..." $YELLOW
    npx cypress install
    log "✅ Cypress initialized" $GREEN
fi

# Check MongoDB availability (optional for in-memory tests)
log "🗄️  Checking MongoDB..." $BLUE
if command -v mongod &> /dev/null; then
    log "✅ MongoDB available" $GREEN
else
    log "⚠️  MongoDB not found - using in-memory database for tests" $YELLOW
fi

# Create environment file for tests if it doesn't exist
if [[ ! -f ".env.test" ]]; then
    log "⚙️  Creating test environment file..." $YELLOW
    cat > .env.test << EOF
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key-for-testing-only
MONGO_URI=mongodb://localhost:27017/real-estate-analyzer-test
FRED_API_KEY=test-fred-key
RENTCAST_API_KEY=test-rentcast-key
OPENAI_API_KEY=test-openai-key
PORT=3001
EOF
    log "✅ Test environment file created" $GREEN
fi

# Run a quick test to ensure everything is working
log "🧪 Running quick validation test..." $BLUE
if npm run test:quick &> /dev/null; then
    log "✅ Quick validation test passed" $GREEN
else
    log "⚠️  Quick test had issues - check configuration" $YELLOW
fi

echo ""
log "🎉 Test environment setup complete!" $GREEN
echo ""
log "Available test commands:" $BLUE
echo "  npm run test:financial     # Financial accuracy tests"
echo "  npm run test:backend       # Backend integration tests"
echo "  npm run test:frontend      # Frontend tests"
echo "  npm run test:e2e:open      # Open Cypress E2E test runner"
echo "  npm run test:all           # Run all tests (except E2E)"
echo "  node scripts/run-all-tests.js --include-e2e  # Full test suite"
echo ""
log "Pre-commit testing:" $BLUE
echo "  npm run test:pre-commit    # Quick validation before commits"
echo "  npm run test:full-validation # Complete validation suite"
echo ""
log "💡 Pro tip: Use 'npm run test:financial' to validate calculations before commits!" $YELLOW