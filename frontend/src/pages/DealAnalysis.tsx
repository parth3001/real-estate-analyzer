import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Alert,
  Snackbar,
} from '@mui/material';
import DealForm from '../components/DealAnalysis/DealForm';
import AnalysisResults from '../components/DealAnalysis/AnalysisResults';
import { Analysis } from '../types/analysis';
import { sampleSFRData } from '../data/sampleSFRData';

// Add this flag outside the component to ensure it persists between renders
let hasLoadedCurrentDeal = false;

const DealAnalysis: React.FC = () => {
  console.log('DealAnalysis component rendering', hasLoadedCurrentDeal);
  const [analysisResult, setAnalysisResult] = useState<Analysis | null>(null);
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

  const setAnalysisResultSafe = useCallback((result: Analysis | null) => {
    setAnalysisResult(prevResult => {
      if (JSON.stringify(prevResult) !== JSON.stringify(result)) {
        console.log('Updating analysisResult state');
        return result;
      }
      return prevResult;
    });
  }, []);

  // Load current deal from localStorage if it exists
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
            if (deal.data.analysisResult) {
              console.log('Setting analysisResult from deal.data');
              setAnalysisResultSafe(deal.data.analysisResult);
            }
          } else {
            console.log('Setting initialData from deal');
            setInitialDataSafe(deal);
            if (deal.analysisResult) {
              console.log('Setting analysisResult from deal');
              setAnalysisResultSafe(deal.analysisResult);
            }
          }
        } else {
          // If no saved deal, load sample data
          console.log('No saved deal found, loading sample data');
          setInitialDataSafe(sampleSFRData);
        }
        
        // Clear the current deal from localStorage
        localStorage.removeItem('currentDeal');
        
        hasLoadedCurrentDeal = true;
      } catch (error) {
        console.error('Error loading current deal:', error);
        // If there's an error, load sample data
        setInitialDataSafe(sampleSFRData);
        hasLoadedCurrentDeal = true;
      }
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
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <DealForm
          onSubmit={handleAnalyze}
          initialData={initialData}
          // @ts-ignore - DealForm accepts Analysis | null as analysisResult
          analysisResult={analysisResult}
        />
        {analysisResult && (
          <Box sx={{ mt: 4 }}>
            <AnalysisResults analysis={analysisResult} />
          </Box>
        )}
      </Container>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DealAnalysis; 