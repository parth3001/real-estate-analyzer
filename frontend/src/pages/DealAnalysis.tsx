import React, { useState, useEffect } from 'react';
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
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    try {
      const savedDeal = localStorage.getItem('currentDeal');
      if (savedDeal) {
        const deal = JSON.parse(savedDeal);
        setInitialData(deal.data);
        // Clear the currentDeal from localStorage after loading
        localStorage.removeItem('currentDeal');
      }
    } catch (error) {
      console.error('Error loading saved deal:', error);
    }
  }, []);

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
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
        minHeight: 'calc(100vh - 48px)', // Full viewport height minus padding
      }}>
        {/* Input Form */}
        <Box sx={{ 
          width: { xs: '100%', md: '50%' },
          maxHeight: { xs: 'auto', md: 'calc(100vh - 48px)' },
          overflowY: { xs: 'visible', md: 'auto' },
          position: { xs: 'static', md: 'sticky' },
          top: { md: 24 },
        }}>
          <DealForm onSubmit={handleAnalyze} initialData={initialData} />
        </Box>

        {/* Analysis Results */}
        <Box sx={{ 
          width: { xs: '100%', md: '50%' },
          maxHeight: { xs: 'none', md: 'calc(100vh - 48px)' },
          overflowY: { xs: 'visible', md: 'auto' },
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