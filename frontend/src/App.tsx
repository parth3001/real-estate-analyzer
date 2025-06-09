import React from 'react';
import { Box, AppBar, Toolbar, Typography, CssBaseline, Button } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DealAnalysisV2 from './pages/DealAnalysisV2';
import MultiFamilyAnalysis from './pages/MultiFamilyAnalysis';
import theme from './theme';
import HomeIcon from '@mui/icons-material/Home';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ApartmentIcon from '@mui/icons-material/Apartment';

// Navigation Bar component
const NavigationBar: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Real Estate Analyzer
        </Typography>
        <Button 
          color="inherit" 
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
          sx={{ mr: 2 }}
        >
          Dashboard
        </Button>
        <Button 
          color="inherit" 
          startIcon={<AnalyticsIcon />}
          onClick={() => navigate('/analyze')}
          sx={{ mr: 2 }}
        >
          Analyze SFR
        </Button>
        <Button 
          color="inherit" 
          startIcon={<ApartmentIcon />}
          onClick={() => navigate('/analyze-multifamily')}
        >
          Multi-Family
        </Button>
      </Toolbar>
    </AppBar>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
          <Routes>
            <Route 
              path="*" 
              element={
                <>
                  <NavigationBar />
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/analyze" element={<DealAnalysisV2 />} />
                    <Route path="/analyze-multifamily" element={<MultiFamilyAnalysis />} />
                  </Routes>
                </>
              }
            />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;
