# Real Estate Deal Analyzer

A comprehensive web application for analyzing real estate investment opportunities. Built with React (frontend) and Node.js (backend).

## Current Status

✅ **Single-Family Rental Analysis**: Complete and fully functional  
🔄 **Multi-Family Analysis**: In development  
✅ **Property Saving & Management**: Complete with table view  
✅ **Financial Metrics**: Cap Rate, Cash on Cash Return, IRR, Cash Flow, etc.  
🔄 **AI Investment Analysis**: Basic integration in place  

## Features

- **Property Analysis**
  - Comprehensive SFR (Single-Family Rental) analysis
  - Monthly, annual, and long-term (10-year) projections
  - Key investment metrics calculation
  - Interactive charts and visualizations

- **Deal Management**
  - Save and manage property analyses
  - Professional table view for comparing properties
  - Loading/editing of saved deals

- **User Interface**
  - Responsive design for mobile and desktop
  - Material UI components with modern styling
  - Data visualization with Recharts

## Documentation

- [Architecture Documentation](ARCHITECTURE.md) - Detailed system architecture and technical decisions
- [API Documentation](backend/README.md) - Backend API endpoints and usage
- [Frontend Documentation](frontend/README.md) - Frontend components and setup

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Project Structure

```
real-estate-analyzer/
├── frontend/          # React frontend application
├── backend/           # Node.js backend application
├── .gitignore        # Git ignore file
├── ARCHITECTURE.md   # System architecture documentation
└── README.md         # Project documentation
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following content:
   ```
   PORT=3001
   NODE_ENV=development
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## Development

- Frontend runs on port 5173 (Vite default)
- Backend runs on port 3001
- API endpoints are prefixed with `/api`

## Recent Improvements

- Converted saved properties view from cards to a professional table layout
- Added IRR and AI investment score columns to property list
- Fixed mortgage/debt service calculation issues
- Improved maintenance cost calculations
- Enhanced year-over-year projections with inflation adjustment
- Fixed ROI and IRR calculations for 10-year projections

## Future Enhancements

- Complete Multi-Family property analysis
- Enhanced AI investment insights
- User authentication
- Generate detailed PDF reports
- Docker containerization
- AWS deployment

## License

ISC 