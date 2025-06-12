# Real Estate Analyzer - Frontend

## Overview
A comprehensive web application for analyzing real estate investments. This frontend provides a user-friendly interface for evaluating both single-family and multi-family property investments with detailed financial analysis and AI-powered insights.

## Features
- **Single-Family Analysis**: 
  - Complete and fully functional
  - Detailed monthly cash flow analysis
  - Annual financial metrics
  - 10-year projections with inflation adjustment
  - ROI and IRR calculations
  - Interactive charts for cash flow, expenses, and equity growth

- **Multi-Family Analysis**: 
  - In development
  - Unit mix analysis framework in place

- **Saved Properties Management**:
  - Professional table view with sortable columns
  - Display key metrics including Cap Rate, CoC Return, IRR, and AI Score
  - View and delete functionality
  - Responsive design

- **Comprehensive Metrics**: 
  - Cap Rate
  - Cash on Cash Return
  - Debt Service Coverage Ratio (DSCR)
  - Internal Rate of Return (IRR)
  - Return on Investment (ROI)
  - Monthly Cash Flow
  - Year-by-year projections

- **AI Insights**: 
  - Basic AI-powered investment recommendations 
  - Investment score calculation

## Tech Stack
- **React 18**: UI framework with hooks
- **TypeScript**: Type-safe JavaScript
- **Material-UI v7**: UI component library
- **React Router 6**: Routing solution
- **Recharts**: Data visualization
- **Axios**: API client
- **Vite**: Build tool

## Getting Started

### Prerequisites
- Node.js 18.x or later
- npm 9.x or later

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/real-estate-analyzer.git
cd real-estate-analyzer/frontend
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

## Project Structure
```
frontend/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── SFRAnalysis/  # Single-family analysis components
│   │   │   ├── SFRPropertyForm.tsx  # SFR input form
│   │   │   └── AnalysisResults.tsx  # Analysis results display
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   │   ├── SFRAnalysis.tsx  # SFR analysis page
│   │   └── SavedProperties.tsx  # Saved properties management
│   ├── services/       # API services
│   │   └── api.ts      # API client configuration
│   ├── theme/          # UI theme configuration
│   ├── types/          # TypeScript type definitions
│   │   ├── property.ts # Property data types
│   │   └── analysis.ts # Analysis result types
│   ├── utils/          # Utility functions
│   │   └── formatters.ts  # Data formatting utilities
│   ├── App.tsx         # Application root component
│   └── main.tsx        # Application entry point
├── package.json        # Project dependencies
└── vite.config.ts      # Vite configuration
```

## Available Scripts
- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run preview`: Preview the production build locally
- `npm run lint`: Lint the codebase
- `npm run test`: Run tests (when implemented)

## Key Components

### SFRPropertyForm
Collects all necessary inputs for Single-Family Rental analysis:
- Property details (price, bedrooms, etc.)
- Financing information (down payment, interest rate, loan term)
- Monthly income and expenses
- Long-term assumptions (appreciation, inflation, etc.)

### AnalysisResults
Displays comprehensive analysis results:
- Key metrics summary cards
- Monthly income and expense breakdown
- Annual financial analysis
- 10-year projections with charts
- Return calculations (IRR, ROI, Cash Flow)

### SavedProperties
Professional table view of all saved properties:
- Property details (name, address, price)
- Key investment metrics (Cap Rate, CoC Return, IRR)
- AI investment score
- Actions (view, delete)

## Recent Improvements
- Converted saved properties view from cards to professional table layout
- Added IRR and AI Score columns to property comparison table
- Fixed mortgage calculation and maintenance cost issues
- Improved year-over-year projections with proper inflation adjustment
- Enhanced ROI and IRR calculations for 10-year analysis
- Fixed timing issues with data rendering

## Backend Integration
The frontend is designed to work with the Real Estate Analyzer backend API. The API endpoints are proxied through the `/api` path in development mode.

## License
This project is licensed under the ISC License.
