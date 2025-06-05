import React, { useState } from 'react';
import { Box, Container, AppBar, Toolbar, Typography, CssBaseline, Alert, Snackbar } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import PropertyForm from './components/PropertyForm';
import PropertyResults from './components/PropertyResults';
import { analyzeProperty, PropertyData } from './services/simpleApi';
import { AnalysisResult } from './types/analysisTypes';
import theme from './theme';

const App: React.FC = () => {
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Real Estate Analyzer
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <PropertyForm onSubmit={handleAnalyzeProperty} isLoading={isLoading} />
          
          {analysisData && <PropertyResults analysisData={analysisData} />}
        </Container>
        
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
      </Box>
    </ThemeProvider>
  );
};

export default App;
