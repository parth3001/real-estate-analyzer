import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DealForm from '../components/DealAnalysis/DealForm';
import AnalysisResults from '../components/DealAnalysis/AnalysisResults';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

interface AnalysisResult {
  // Add specific types based on your analysis result structure
  [key: string]: any;
}

const DealAnalysis = () => {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (dealData: any) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/deals/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dealData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze deal');
      }

      const results = await response.json();
      setAnalysisResults(results);
      setError(null);
    } catch (error) {
      console.error('Error analyzing deal:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      throw error; // Re-throw to be handled by the form
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Real Estate Deal Analysis
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <StyledPaper elevation={0}>
          <DealForm onSubmit={handleAnalyze} />
        </StyledPaper>

        {analysisResults && (
          <StyledPaper elevation={0}>
            <AnalysisResults analysis={analysisResults} />
          </StyledPaper>
        )}

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert
            onClose={() => setError(null)}
            severity="error"
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default DealAnalysis; 