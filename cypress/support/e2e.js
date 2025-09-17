// Import Cypress commands
import './commands';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // This is common with React apps during development
  console.log('Uncaught exception:', err.message);
  return false;
});

// Global before hook - ensure servers are running
before(() => {
  cy.log('🚀 Starting E2E Test Suite');
  
  // Verify frontend is accessible
  cy.visit('/', { failOnStatusCode: false });
  
  // Verify backend API is accessible
  cy.request({
    url: `${Cypress.env('API_BASE_URL')}/health`,
    failOnStatusCode: false
  }).then((response) => {
    if (response.status !== 200) {
      throw new Error(`Backend not accessible at ${Cypress.env('API_BASE_URL')}`);
    }
  });
});

// Global beforeEach hook
beforeEach(() => {
  // Clear browser storage
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Set viewport
  cy.viewport(1280, 720);
});

// Global afterEach hook
afterEach(() => {
  // Take screenshot on failure (automatic with screenshotOnRunFailure: true)
  // Additional cleanup if needed
});