import React, { useState } from 'react';
import {
  Box,
  Container,
  Alert,
  Snackbar,
} from '@mui/material';
import DealForm from '../components/DealAnalysis/DealForm';
import AnalysisResults from '../components/DealAnalysis/AnalysisResults';

interface AnalysisResult {
  monthlyAnalysis?: any;
  annualAnalysis?: any;
  longTermAnalysis?: any;
}

const DealAnalysis: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (dealData: any) => {
    try {
      const response = await fetch('/api/deals/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dealData),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze deal');
      }

      const result = await response.json();
      setAnalysisResult(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', // Full width on mobile
          md: '50% 50%'  // Equal split on medium+ screens
        }, 
        gap: 3,
        height: '100%'
      }}>
        {/* Input Form - Fixed width and sticky */}
        <Box sx={{ 
          position: 'sticky', 
          top: 24, 
          height: 'calc(100vh - 48px)', // Full height minus padding
          overflowY: 'auto' // Add scroll to the form itself
        }}>
          <DealForm onSubmit={handleAnalyze} />
        </Box>

        {/* Analysis Results - Flexible width with scroll */}
        <Box sx={{ 
          overflowY: 'auto',
          height: 'calc(100vh - 48px)' // Match form height
        }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}
          
          {analysisResult && (
            <Box>
              <AnalysisResults analysis={analysisResult} />
            </Box>
          )}
        </Box>
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DealAnalysis; 