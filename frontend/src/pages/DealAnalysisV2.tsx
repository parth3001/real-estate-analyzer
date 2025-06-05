/**
 * Deal Analysis Page (V2)
 * 
 * A completely rebuilt deal analysis page with modern UI and reliable data handling
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
  Alert,
  Paper,
  Divider,
  Snackbar
} from '@mui/material';
import { Send as SendIcon, Refresh as RefreshIcon } from '@mui/icons-material';

// Import existing components we'll reuse
import DealForm from '../components/DealAnalysis/DealForm';
// Import our new components
import AnalysisResultsV2 from '../components/AnalysisV2/AnalysisResultsV2';

// Import our new analysis service
import * as analysisService from '../services/analysisService';

// Import types
import { Analysis } from '../types/analysis';
import { DealData } from '../types/deal';

/**
 * Deal Analysis Page V2
 */
const DealAnalysisV2: React.FC = () => {
  // Get the deal ID from URL parameters if available (for loading saved deals)
  const { dealId } = useParams<{ dealId?: string }>();
  const navigate = useNavigate();
  
  // State for analysis data and UI state
  const [analysisResult, setAnalysisResult] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  
  // Property type state for toggling between SFR and MF forms
  const [propertyType, setPropertyType] = useState<'SFR' | 'MF'>('SFR');
  
  // Handle form submission
  const handleAnalyze = async (dealData: DealData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Analyzing deal:', dealData);
      
      // Call our new analysis service
      const result = await analysisService.analyzeDeal(dealData);
      
      // Update state with analysis results
      setAnalysisResult(result);
      
      // Show success message
      setSnackbarMessage('Analysis completed successfully!');
      setSnackbarOpen(true);
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('analysis-results')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    } catch (err) {
      console.error('Error analyzing deal:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle property type change
  const handlePropertyTypeChange = (type: 'SFR' | 'MF') => {
    setPropertyType(type);
    // Clear previous analysis when switching property types
    setAnalysisResult(null);
  };
  
  // Handle loading sample data
  const handleLoadSample = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load sample data based on property type
      const sampleData = propertyType === 'SFR' 
        ? await analysisService.getSampleSFR()
        : await analysisService.getSampleMF();
      
      // Analyze the sample data
      const result = await analysisService.analyzeDeal(sampleData);
      
      // Update state with analysis results
      setAnalysisResult(result);
      
      // Show success message
      setSnackbarMessage('Sample data loaded and analyzed!');
      setSnackbarOpen(true);
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('analysis-results')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    } catch (err) {
      console.error('Error loading sample data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Real Estate Deal Analysis
        </Typography>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          {/* Property Type Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Property Type
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant={propertyType === 'SFR' ? 'contained' : 'outlined'}
                onClick={() => handlePropertyTypeChange('SFR')}
                sx={{ minWidth: 120 }}
              >
                Single Family
              </Button>
              <Button 
                variant={propertyType === 'MF' ? 'contained' : 'outlined'}
                onClick={() => handlePropertyTypeChange('MF')}
                sx={{ minWidth: 120 }}
              >
                Multi-Family
              </Button>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleLoadSample}
                startIcon={<RefreshIcon />}
                disabled={isLoading}
              >
                Load Sample Data
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {/* Property Form */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Property Details
            </Typography>
            
            {/* For now, just use the SFR form as MultiFamilyForm is not imported */}
            <DealForm onSubmit={handleAnalyze} />
          </Box>
        </Paper>
        
        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {/* Analysis Results */}
        {analysisResult && (
          <Box id="analysis-results">
            <AnalysisResultsV2 analysis={analysisResult} />
          </Box>
        )}
      </Box>
      
      {/* Success message snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default DealAnalysisV2; 