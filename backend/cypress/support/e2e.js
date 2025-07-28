// Cypress E2E support file
import './commands';

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  cy.stub(win.console, 'error').as('consoleError');
  cy.stub(win.console, 'warn').as('consoleWarn');
});

// Global before hook
beforeEach(() => {
  // Clear any existing data
  cy.task('clearDatabase', null, { timeout: 10000 });
  
  // Ensure clean state
  cy.clearCookies();
  cy.clearLocalStorage();
});