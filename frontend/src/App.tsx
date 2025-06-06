import React, { useState } from 'react';
import { Box, Container, AppBar, Toolbar, Typography, CssBaseline, Alert, Snackbar, Button } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import PropertyForm from './components/PropertyForm';
import PropertyResults from './components/PropertyResults';
import Dashboard from './pages/Dashboard';
import { analyzeProperty, PropertyData } from './services/simpleApi';
import { AnalysisResult } from './types/analysisTypes';
import theme from './theme';
import HomeIcon from '@mui/icons-material/Home';
import AnalyticsIcon from '@mui/icons-material/Analytics';

// Analyze SFR Page
const AnalyzeSFRPage: React.FC = () => {
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeProperty = async (propertyData: PropertyData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await analyzeProperty(propertyData);
      setAnalysisData(result as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PropertyForm onSubmit={handleAnalyzeProperty} isLoading={isLoading} />
      
      {analysisData && <PropertyResults analysisData={analysisData} />}
      
      <Snackbar 
        open={error !== null} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

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
        >
          Analyze SFR
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
                    <Route path="/analyze" element={<AnalyzeSFRPage />} />
                    <Route path="/analyze-multifamily" element={<div>Multi-Family Analysis (Coming Soon)</div>} />
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
