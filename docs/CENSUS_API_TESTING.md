# Census API Integration Testing Guide

This document provides instructions on how to test the Census API integration in the Real Estate Analyzer application.

## Prerequisites

1. Obtain a Census API key from the [US Census Bureau API](https://api.census.gov/data/key_signup.html)
2. Add the API key to your `.env` file:
   ```
   CENSUS_API_KEY=your_census_api_key_here
   ```

## Backend Testing

### Manual Test Script

We've created a manual test script that directly tests the Census API service without requiring a running server. This is useful for verifying that your Census API key is working correctly.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the manual test script:
   ```bash
   npx ts-node src/tests/manualCensusTest.ts
   ```

3. The script will output the results of various Census API calls, including demographic data, income data, housing data, and comprehensive data.

### Unit Tests

We've also created unit tests for the Census API integration:

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the tests:
   ```bash
   npm test -- --testPathPattern=censusApi.test.ts
   ```

## Frontend Testing

### Census Data Test Page

We've created a dedicated test page for the Census Data integration:

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to the Census Data Test page in your browser:
   ```
   http://localhost:5173/census-test
   ```

4. The page includes a pre-filled form with test data for Mountain View, CA. You can also enter your own ZIP code or state to test the Census API integration.

## API Endpoints

The Census API integration provides the following endpoints:

- `GET /api/census/demographics`: Get demographic data for a location
- `GET /api/census/income`: Get income data for a location
- `GET /api/census/housing`: Get housing data for a location
- `GET /api/census/comprehensive`: Get comprehensive census data for a location

See the [API Documentation](API.md) for more details on these endpoints.

## Troubleshooting

### Common Issues

1. **"Census API Key is not set"**: Make sure you've added your Census API key to the `.env` file.

2. **"Error fetching census data"**: Check that your Census API key is valid and that you have internet connectivity.

3. **"Insufficient location parameters provided"**: Make sure you're providing at least one location parameter (ZIP code, state, county, etc.).

### Debug Logging

To enable debug logging for the Census API integration, set the `LOG_LEVEL` environment variable to `debug` in your `.env` file:

```
LOG_LEVEL=debug
```

This will output detailed logs of the Census API requests and responses. 