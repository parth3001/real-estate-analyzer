import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Alert,
  Snackbar,
} from '@mui/material';
import DealForm from '../components/DealAnalysis/DealForm';
import AnalysisResults from '../components/DealAnalysis/AnalysisResults';

// Add this flag outside the component to ensure it persists between renders
let hasLoadedCurrentDeal = false;

interface AnalysisResult {
  monthlyAnalysis?: any;
  annualAnalysis?: any;
  longTermAnalysis?: any;
  aiInsights?: {
    investmentScore?: number;
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
  };
}

const DealAnalysis: React.FC = () => {
  console.log('DealAnalysis component rendering', hasLoadedCurrentDeal);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const effectRan = useRef(false);

  // Safe state setters to prevent infinite loops
  const setInitialDataSafe = useCallback((data: any) => {
    setInitialData((prevData: any | null) => {
      if (!prevData || JSON.stringify(prevData) !== JSON.stringify(data)) {
        console.log('Updating initialData state');
        return data;
      }
      return prevData;
    });
  }, []);

  const setAnalysisResultSafe = useCallback((result: AnalysisResult | null) => {
    setAnalysisResult(prevResult => {
      if (JSON.stringify(prevResult) !== JSON.stringify(result)) {
        console.log('Updating analysisResult state');
        return result;
      }
      return prevResult;
    });
  }, []);

  // Load the current deal from localStorage if it exists
  useEffect(() => {
    console.log('DealAnalysis useEffect running, effectRan:', effectRan.current, 'hasLoadedCurrentDeal:', hasLoadedCurrentDeal);
    
    // Only run this effect once using static flag
    if (!hasLoadedCurrentDeal) {
      try {
        console.log('Loading current deal - first time only');
        const savedDeal = localStorage.getItem('currentDeal');
        console.log('Current deal from localStorage:', savedDeal);
        
        if (savedDeal) {
          const deal = JSON.parse(savedDeal);
          console.log('Parsed deal:', deal);
          
          // Check if we received the deal object directly or need to access its data property
          if (deal.data) {
            console.log('Setting initialData from deal.data');
            setInitialDataSafe(deal.data);
          } else {
            console.log('Setting initialData directly from deal');
            setInitialDataSafe(deal);
          }
          
          // If the deal has analysis results, set them
          if (deal.data?.analysisResult) {
            console.log('Setting analysisResult from deal.data.analysisResult');
            setAnalysisResultSafe(deal.data.analysisResult);
          }
          
          // Clear the currentDeal from localStorage after loading to prevent issues with future navigation
          localStorage.removeItem('currentDeal');
          console.log('Removed currentDeal from localStorage');
        } else {
          console.log('No currentDeal found in localStorage');
        }
      } catch (error) {
        console.error('Error loading saved deal:', error);
        setError('Failed to load saved deal. Please try again.');
      }
      
      hasLoadedCurrentDeal = true;
      effectRan.current = true;
    }
  }, [setInitialDataSafe, setAnalysisResultSafe]);

  const handleAnalyze = async (dealData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Submitting analysis request:', dealData);
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/deals/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dealData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Received analysis result:', result);
      setAnalysisResultSafe(result);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  console.log('DealAnalysis rendering UI with initialData:', initialData ? 'present' : 'absent');

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
          <DealForm 
            onSubmit={handleAnalyze} 
            initialData={initialData} 
            // @ts-ignore - passing analysis result to the form for saving
            analysisResult={analysisResult}
          />
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