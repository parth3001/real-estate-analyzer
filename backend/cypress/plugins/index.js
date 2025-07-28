/// <reference types="cypress" />

const { connectTestDB, closeTestDB, clearTestDB } = require('../../src/tests/setup/testDatabase');

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  // Database management tasks
  on('task', {
    // Clear test database
    clearDatabase: async () => {
      try {
        await clearTestDB();
        return null;
      } catch (error) {
        throw new Error(`Failed to clear database: ${error.message}`);
      }
    },

    // Seed database with test data
    seedDatabase: async (data) => {
      try {
        await connectTestDB();
        // Add seeding logic here if needed
        return data;
      } catch (error) {
        throw new Error(`Failed to seed database: ${error.message}`);
      }
    },

    // Log messages for debugging
    log: (message) => {
      console.log(message);
      return null;
    },

    // Validate financial calculations
    validateCalculation: ({ actual, expected, tolerance = 0.02 }) => {
      const difference = Math.abs(actual - expected);
      const allowedDifference = Math.abs(expected * tolerance);
      
      return {
        valid: difference <= allowedDifference,
        actual,
        expected,
        difference,
        allowedDifference,
        tolerance
      };
    }
  });

  // Setup and teardown
  on('before:browser:launch', (browser = {}, launchOptions) => {
    // Setup before tests
    console.log('Setting up test environment...');
    return launchOptions;
  });

  on('after:browser:launch', (browser = {}) => {
    // Any cleanup after browser launches
    return null;
  });

  return config;
};