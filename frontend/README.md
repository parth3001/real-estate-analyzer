# Real Estate Analyzer - Frontend

## Overview
A comprehensive web application for analyzing real estate investments. This frontend provides a user-friendly interface for evaluating both single-family and multi-family property investments with detailed financial analysis and AI-powered insights.

## Features
- **Single-Family Analysis**: Analyze SFR properties with detailed financial projections
- **Multi-Family Analysis**: Evaluate multi-family properties with unit mix optimization
- **Saved Properties**: Manage and compare saved property analyses
- **Comprehensive Metrics**: Calculate key investment metrics like Cap Rate, Cash on Cash Return, IRR, and more
- **AI Insights**: Receive AI-powered investment recommendations and risk analysis

## Tech Stack
- **React**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Material-UI**: UI component library
- **React Router**: Routing solution
- **React Query**: Data fetching and caching
- **Recharts**: Data visualization
- **Axios**: API client

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
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── theme/          # UI theme configuration
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
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

## Backend Integration
The frontend is designed to work with the Real Estate Analyzer backend API. The API endpoints are proxied through the `/api` path in development mode.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
