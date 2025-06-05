import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Alert,
  Snackbar,
} from '@mui/material';
import DealForm from '../components/DealAnalysis/DealForm';
import AnalysisResults from '../components/DealAnalysis/AnalysisResults';
import { sampleSFRData } from '../data/sampleSFRData';
import { analyzeDeal } from '../services/api';
import type { DealData } from '../types/deal';
import { Analysis } from '../types/analysis';
import { CompleteExtendedAnalysis } from '../types/analysisExtended';

// Add this flag outside the component to ensure it persists between renders
let hasLoadedCurrentDeal = false;

const DealAnalysis: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<CompleteExtendedAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<DealData | undefined>(undefined);
  const effectRan = useRef(false);

  // Safe state setters to prevent infinite loops
  const setInitialDataSafe = useCallback((data: DealData) => {
    setInitialData((prevData: DealData | undefined) => {
      if (!prevData || JSON.stringify(prevData) !== JSON.stringify(data)) {
        return data;
      }
      return prevData;
    });
  }, []);

  const setAnalysisResultSafe = useCallback((result: Analysis | null) => {
    setAnalysisResult((prevResult: CompleteExtendedAnalysis | null) => {
      if (JSON.stringify(prevResult) !== JSON.stringify(result)) {
        return result as unknown as CompleteExtendedAnalysis;
      }
      return prevResult;
    });
  }, []);

  // Load current deal from localStorage if it exists
  useEffect(() => {
    if (!hasLoadedCurrentDeal) {
      try {
        const savedDeal = localStorage.getItem('currentDeal');
        
        if (savedDeal) {
          const deal = JSON.parse(savedDeal);
          
          if (deal.data) {
            setInitialDataSafe(deal.data);
            if (deal.data.analysisResult) {
              setAnalysisResultSafe(deal.data.analysisResult);
            }
          } else {
            setInitialDataSafe(deal);
            if (deal.analysisResult) {
              setAnalysisResultSafe(deal.analysisResult);
            }
          }
        } else {
          setInitialDataSafe(sampleSFRData);
        }
        
        localStorage.removeItem('currentDeal');
        
        hasLoadedCurrentDeal = true;
      } catch (error) {
        console.error('Error loading current deal:', error);
        setInitialDataSafe(sampleSFRData);
        hasLoadedCurrentDeal = true;
      }
    }
  }, [setInitialDataSafe, setAnalysisResultSafe]);

  const handleAnalyze = async (dealData: DealData) => {
    setError(null);
    
    try {
      const result = await analyzeDeal(dealData);
      setAnalysisResult(result as unknown as CompleteExtendedAnalysis);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis. Please try again.');
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <DealForm
          onSubmit={handleAnalyze}
          initialData={initialData}
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