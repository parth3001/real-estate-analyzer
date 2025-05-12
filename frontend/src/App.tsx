import React from 'react';
import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DealAnalysis from './pages/DealAnalysis';
import MultiFamilyAnalysis from './pages/MultiFamilyAnalysis';
import Navbar from './components/Navbar';
import theme from './theme';

// Simple test component to debug routing
const TestComponent = () => (
  <Box sx={{ p: 4, textAlign: 'center' }}>
    <Typography variant="h4" gutterBottom>
      Test Route Working!
    </Typography>
    <Typography variant="body1">
      If you can see this, the router is functioning correctly.
    </Typography>
  </Box>
);

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ 
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Navbar />
          <Box sx={{ flex: 1, p: 3 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analyze" element={<DealAnalysis />} />
              <Route path="/analyze-multifamily" element={<MultiFamilyAnalysis />} />
              <Route path="/test" element={<TestComponent />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;
