import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import MultiFamilyForm from '../components/MultiFamilyAnalysis/MultiFamilyForm';
import MultiFamilyAnalysisResults from '../components/MultiFamilyAnalysis/MultiFamilyAnalysisResults';
import type { MultiFamilyDealData } from '../types/deal';
import type { Analysis } from '../types/analysis';
import { analyzeDeal } from '../services/api';
import { sampleMultiFamilyData } from '../data/sampleMultiFamilyData';

const MultiFamilyAnalysis: React.FC = () => {
  const [initialData, setInitialData] = useState<MultiFamilyDealData | undefined>(undefined);
  const [analysisResult, setAnalysisResult] = useState<Analysis | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'success' | 'info' | 'warning'
  });

  useEffect(() => {
    // Load saved deal data from localStorage
    const savedDeal = localStorage.getItem('currentDeal');
    if (savedDeal) {
      try {
        const parsedDeal = JSON.parse(savedDeal);
        if (parsedDeal.propertyType === 'MF') {
          setInitialData(parsedDeal);
        }
      } catch (error) {
        console.error('Error loading saved deal:', error);
      }
    } else {
      // If no saved deal is found, use the sample data
      setInitialData(sampleMultiFamilyData);
    }
    
    // Clear the current deal from localStorage
    localStorage.removeItem('currentDeal');
  }, []);

  const handleAnalyze = async (dealData: MultiFamilyDealData) => {
    try {
      const response = await analyzeDeal(dealData);
      
      // Set the analysis result - the type conversion is now handled by adaptToAnalysis
      setAnalysisResult(response);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Analysis completed successfully!',
        severity: 'success'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during analysis';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Multi-Family Property Analysis
      </Typography>

      <MultiFamilyForm
        onSubmit={handleAnalyze}
        initialData={initialData}
        analysisResult={analysisResult}
      />

      {analysisResult && (
        <Box sx={{ mt: 4 }}>
          <MultiFamilyAnalysisResults results={analysisResult} />
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MultiFamilyAnalysis; 