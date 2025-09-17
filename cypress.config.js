const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Frontend URL (React dev server)
    baseUrl: 'http://localhost:3000',
    
    // Test file locations
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Browser configuration - Optimized for smaller file sizes
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    videoCompression: 40, // Compress videos to reduce file size
    screenshotOnRunFailure: true,
    
    // Screenshot optimization
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    
    // Timeouts (important for Property Wizard steps)
    defaultCommandTimeout: 10000,
    requestTimeout: 30000,
    responseTimeout: 30000,
    pageLoadTimeout: 30000,
    
    // Network configuration
    chromeWebSecurity: false,
    
    // Environment variables
    env: {
      // Backend API URL
      API_BASE_URL: 'http://localhost:3001/api',
      
      // Test user credentials (using admin that works in expert validation)
      TEST_USER_EMAIL: 'admin@realestateanalyzer.com',
      TEST_USER_PASSWORD: 'Spring@2025',
      
      // Test property data
      TEST_PROPERTY_ADDRESS: '16 Belvidere Ave APT 3F, Jersey City, NJ 07304',
      TEST_PROPERTY_PRICE: 255000,
      
      // Feature flags
      ENABLE_PROPERTY_WIZARD: true,
      SKIP_AUTH_TESTS: false
    },

    setupNodeEvents(on, config) {
      // Task for logging
      on('task', {
        log(message) {
          console.log('🧪 Cypress:', message);
          return null;
        }
      });

      // Before browser launch - add performance flags
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.family === 'chromium') {
          // Performance and compatibility flags
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--disable-web-security');
          launchOptions.args.push('--allow-running-insecure-content');
          launchOptions.args.push('--disable-features=VizDisplayCompositor');
          
          // Window size for consistent testing
          launchOptions.args.push('--window-size=1280,720');
        }
        
        return launchOptions;
      });

      return config;
    }
  },

  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'frontend/src/**/*.cy.{js,jsx,ts,tsx}'
  }
});