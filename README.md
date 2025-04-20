# Real Estate Deal Analyzer

A web application for analyzing real estate investment opportunities. Built with React (frontend) and Node.js (backend).

## Features

- Property deal analysis
- Investment metrics calculation
- User-friendly interface
- Responsive design for mobile and desktop

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
   npm start
   ```

The application will be available at `http://localhost:3000`

## Development

- Frontend runs on port 3000
- Backend runs on port 3001
- API endpoints are prefixed with `/api`

## Future Enhancements

- User authentication
- Save and compare multiple deals
- Generate detailed PDF reports
- Docker containerization
- AWS deployment

## License

ISC 