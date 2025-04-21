import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, AppBar, Toolbar, Typography, Button, CssBaseline } from '@mui/material';
import Dashboard from './components/Dashboard/Dashboard';
import DealAnalysis from './components/DealAnalysis/DealAnalysis';
import SavedDeals from './components/DealAnalysis/SavedDeals';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6366F1',
    },
    secondary: {
      main: '#10B981',
    },
  },
});

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Real Estate Analyzer
              </Typography>
              <Button color="inherit" component={Link} to="/">
                Dashboard
              </Button>
              <Button color="inherit" component={Link} to="/analyze">
                Analyze Deal
              </Button>
              <Button color="inherit" component={Link} to="/saved-deals">
                Saved Deals
              </Button>
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analyze" element={<DealAnalysis />} />
              <Route path="/saved-deals" element={<SavedDeals />} />
            </Routes>
          </Box>
        </Box>
      </ThemeProvider>
    </Router>
  );
}

export default App; 