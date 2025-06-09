import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import DealForm from '../components/DealAnalysis/DealForm';
import AnalysisResults from '../components/DealAnalysis/AnalysisResults';
import { sampleSFRData } from '../data/sampleSFRData';
import { useDealDAO } from '../hooks/useDealDAO';
import type { DealData } from '../types/deal';
import { CompleteExtendedAnalysis } from '../types/analysisExtended';
import { Analysis } from '../types/analysis';

// Add this flag outside the component to ensure it persists between renders
let hasLoadedCurrentDeal = false;

const DealAnalysis: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<CompleteExtendedAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<DealData | undefined>(undefined);
  
  // Use our new DAO hook
  const { 
    loading, 
    error: daoError, 
    getDealById, 
    analyzeDeal,
    clearError 
  } = useDealDAO();

  // Safe state setters to prevent infinite loops
  const setInitialDataSafe = useCallback((data: DealData) => {
    setInitialData((prevData: DealData | undefined) => {
      if (!prevData || JSON.stringify(prevData) !== JSON.stringify(data)) {
        return data;
      }
      return prevData;
    });
  }, []);

  const setAnalysisResultSafe = useCallback((result: Analysis | CompleteExtendedAnalysis | null) => {
    setAnalysisResult((prevResult: CompleteExtendedAnalysis | null) => {
      if (JSON.stringify(prevResult) !== JSON.stringify(result)) {
        return result as CompleteExtendedAnalysis;
      }
      return prevResult;
    });
  }, []);

  // Load current deal from localStorage if it exists
  useEffect(() => {
    if (!hasLoadedCurrentDeal) {
      try {
        // Check if we're editing an existing deal
        const editAnalysisId = localStorage.getItem('currentEditAnalysisId');
        
        if (editAnalysisId) {
          console.log('Loading analysis for editing with ID:', editAnalysisId);
          
          // Use our DAO to fetch the deal
          const loadDeal = async () => {
            try {
              const deal = await getDealById(editAnalysisId);
              
              if (deal) {
                console.log('Found analysis to edit:', deal);
                
                // Set initial data from the deal
                if (deal.data) {
                  console.log('Loading property details for form:', deal.data);
                  setInitialDataSafe(deal.data as DealData);
                  
                  // Load the analysis result if available
                  if (deal.data.analysisResult) {
                    console.log('Loading analysis results:', deal.data.analysisResult);
                    setAnalysisResultSafe(deal.data.analysisResult);
                  }
                }
              } else {
                console.error('Analysis not found with ID:', editAnalysisId);
                setInitialDataSafe(sampleSFRData);
              }
            } catch (err) {
              console.error('Error loading deal:', err);
              setInitialDataSafe(sampleSFRData);
            }
          };
          
          loadDeal();
        } else {
          // Not editing, check for currentDeal
          const savedDeal = localStorage.getItem('currentDeal');
          
          if (savedDeal) {
            const deal = JSON.parse(savedDeal);
            
            if (deal.data) {
              setInitialDataSafe(deal.data as DealData);
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
        }
        
        hasLoadedCurrentDeal = true;
      } catch (error) {
        console.error('Error loading current deal:', error);
        setInitialDataSafe(sampleSFRData);
        hasLoadedCurrentDeal = true;
      }
    }
  }, [setInitialDataSafe, setAnalysisResultSafe, getDealById]);

  // Handle DAO errors
  useEffect(() => {
    if (daoError) {
      setError(daoError);
    }
  }, [daoError]);

  const handleAnalyze = async (dealData: DealData) => {
    setError(null);
    clearError();
    
    try {
      // Use our DAO to analyze the deal
      const result = await analyzeDeal(dealData);
      if (result) {
        setAnalysisResult(result as unknown as CompleteExtendedAnalysis);
      } else {
        throw new Error('Analysis failed - no result returned');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis. Please try again.');
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {loading && (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100px' 
            }}
          >
            <CircularProgress />
          </Box>
        )}
        
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