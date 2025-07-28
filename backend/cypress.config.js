const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000', // Frontend dev server
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      apiUrl: 'http://localhost:3001/api'
    },
    setupNodeEvents(on, config) {
      // Import the database utilities
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoose = require('mongoose');
      
      let mongoServer;
      
      // Task to clear database
      on('task', {
        async clearDatabase() {
          if (mongoose.connection.readyState === 1) {
            const collections = await mongoose.connection.db.collections();
            for (let collection of collections) {
              await collection.deleteMany({});
            }
          }
          return null;
        },
        
        async connectTestDB() {
          if (mongoose.connection.readyState === 0) {
            mongoServer = await MongoMemoryServer.create();
            const mongoUri = mongoServer.getUri();
            await mongoose.connect(mongoUri);
          }
          return null;
        },
        
        async closeTestDB() {
          if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
          }
          if (mongoServer) {
            await mongoServer.stop();
          }
          return null;
        },
        
        async seedDatabase(data) {
          // Seed test data if needed
          console.log('Seeding database with test data:', data);
          return null;
        },
        
        log(message) {
          console.log('Cypress Log:', message);
          return null;
        }
      });
      
      return config;
    }
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
});