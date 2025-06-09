import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Alert, CircularProgress, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SFRPropertyForm from '../components/SFRAnalysis/SFRPropertyForm';
import { propertyApi } from '../services/api';
import type { SFRPropertyData } from '../types/property';
import type { Analysis } from '../types/analysis';
import AnalysisResults from '../components/SFRAnalysis/AnalysisResults';

const SFRAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<SFRPropertyData | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // Load sample data
  const loadSampleData = async () => {
    setSampleLoading(true);
    setError(null);
    
    console.log('Loading sample data...');
    try {
      const response = await propertyApi.getSampleSFR();
      
      console.log('Sample data response:', response);
      console.log('Sample data status:', response.status);
      console.log('Sample data received:', response.data);
      
      if (response.status === 200 && response.data) {
        console.log('Setting property data from sample data');
        setPropertyData(response.data as SFRPropertyData);
        setTabIndex(0); // Switch to form tab
      } else {
        console.error('Failed to load sample data:', response);
        setError('Failed to load sample data: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error loading sample data:', err);
      setError('Error loading sample data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSampleLoading(false);
    }
  };

  // Handle form submission
  const handleAnalyzeProperty = async (data: SFRPropertyData): Promise<Analysis | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Sending property data to API:', data);
      const response = await propertyApi.analyzeProperty(data);
      
      if (response.status === 200 && response.data) {
        console.log('API response successful:', response.data);
        
        // Add detailed inspection of the response structure
        console.log('API Response Structure:');
        console.log('  monthlyAnalysis present:', !!response.data.monthlyAnalysis);
        console.log('  annualAnalysis present:', !!response.data.annualAnalysis);
        console.log('  longTermAnalysis present:', !!response.data.longTermAnalysis);
        console.log('  keyMetrics present:', !!response.data.keyMetrics);
        console.log('  aiInsights present:', !!response.data.aiInsights);
        
        if (response.data.longTermAnalysis) {
          console.log('LongTermAnalysis Structure:');
          console.log('  yearlyProjections present:', !!response.data.longTermAnalysis.yearlyProjections);
          console.log('  yearlyProjections is array:', Array.isArray(response.data.longTermAnalysis.yearlyProjections));
          console.log('  yearlyProjections length:', response.data.longTermAnalysis.yearlyProjections?.length || 0);
          console.log('  exitAnalysis present:', !!response.data.longTermAnalysis.exitAnalysis);
          console.log('  returns present:', !!response.data.longTermAnalysis.returns);
          console.log('  projectionYears present:', !!response.data.longTermAnalysis.projectionYears);
        }
        
        // Add additional validation
        if (!response.data.monthlyAnalysis || !response.data.annualAnalysis || !response.data.longTermAnalysis) {
          console.error('API response missing required analysis data:', response.data);
          setError('Analysis response is incomplete. Please try again.');
          return null;
        }
        
        setPropertyData(data);
        setAnalysis(response.data);
        setTabIndex(1); // Switch to results tab
        return response.data;
      } else {
        console.error('API response error:', response);
        setError('Analysis failed: ' + (response.message || 'Unknown error'));
        return null;
      }
    } catch (err) {
      console.error('Error during analysis:', err);
      setError('Error during analysis: ' + (err instanceof Error ? err.message : 'Unknown error'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Single-Family Rental Analysis
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            onClick={loadSampleData}
            disabled={sampleLoading}
            sx={{ mr: 2 }}
          >
            {sampleLoading ? 'Loading...' : 'Load Sample Data'}
          </Button>
          <Button 
            variant="outlined" 
            color="inherit" 
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Box sx={{ mb: 2 }}>
        <Tabs 
          value={tabIndex} 
          onChange={handleTabChange}
          aria-label="SFR analysis tabs"
        >
          <Tab label="Property Input" />
          <Tab label="Analysis Results" disabled={!analysis} />
        </Tabs>
      </Box>
      
      {tabIndex === 0 && (
        <SFRPropertyForm
          onSubmit={handleAnalyzeProperty}
          initialData={propertyData || undefined}
          isLoading={isLoading}
          error={error || undefined}
        />
      )}
      
      {tabIndex === 1 && analysis && propertyData && (
        <React.Fragment>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <AnalysisResults analysis={analysis} propertyData={propertyData} />
          )}
        </React.Fragment>
      )}
    </Box>
  );
};

export default SFRAnalysis; 