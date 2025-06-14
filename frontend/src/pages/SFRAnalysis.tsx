import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Alert, CircularProgress, Button, Snackbar } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import SFRPropertyForm from '../components/SFRAnalysis/SFRPropertyForm';
import { propertyApi } from '../services/api';
import type { SFRPropertyData } from '../types/property';
import type { Analysis } from '../types/analysis';
import AnalysisResults from '../components/SFRAnalysis/AnalysisResults';

const SFRAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [tabIndex, setTabIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<SFRPropertyData | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [dealId, setDealId] = useState<string | null>(null);

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
        
        // Validate the response has required data structures
        if (!response.data.monthlyAnalysis || !response.data.annualAnalysis || !response.data.longTermAnalysis) {
          console.error('API response missing required analysis data:', response.data);
          setError('Analysis response is incomplete. Please try again.');
          return null;
        }
        
        // Log key structure for debugging
        console.log('Analysis structure check:', {
          hasMonthlyExpenses: !!response.data.monthlyAnalysis?.expenses,
          hasAnnualAnalysis: !!response.data.annualAnalysis,
          hasLongTermAnalysis: !!response.data.longTermAnalysis,
          hasKeyMetrics: !!response.data.keyMetrics
        });
        
        // Set data and show results
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

  // Load deal data from URL parameters
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setDealId(id);
      loadDealData(id);
    }
  }, [location.search]);

  // Load deal data from API
  const loadDealData = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading deal data for ID:', id);
      const response = await propertyApi.getProperty(id);
      
      if (response.status === 200 && response.data) {
        console.log('Deal data loaded:', response.data);
        
        // Extract property data without analysis
        const { analysis: dealAnalysis, ...dealPropertyData } = response.data;
        
        // Make sure property type is correct
        if (dealPropertyData.propertyType !== 'SFR') {
          console.error('Property type mismatch:', dealPropertyData.propertyType);
          setError('This is not a Single-Family Property');
          setIsLoading(false);
          return;
        }
        
        // Set property data
        setPropertyData(dealPropertyData as SFRPropertyData);
        
        // If analysis data exists, set it and switch to results tab
        if (dealAnalysis) {
          console.log('Setting analysis data:', dealAnalysis);
          
          // Log analysis structure for debugging
          console.log('Analysis structure check:', {
            hasMonthlyExpenses: !!dealAnalysis.monthlyAnalysis?.expenses,
            hasPropertyTax: !!dealAnalysis.monthlyAnalysis?.expenses?.propertyTax,
            hasAnnualAnalysis: !!dealAnalysis.annualAnalysis,
            hasLongTermAnalysis: !!dealAnalysis.longTermAnalysis,
            hasKeyMetrics: !!dealAnalysis.keyMetrics
          });
          
          setAnalysis(dealAnalysis);
          setTabIndex(1); // Switch to results tab
        }
      } else {
        console.error('Failed to load deal data:', response);
        setError('Failed to load deal data: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error loading deal data:', err);
      setError('Error loading deal data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle saving the deal
  const handleSaveDeal = async () => {
    if (!propertyData || !analysis) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Prepare the deal data with analysis
      const dealData = {
        ...propertyData,
        analysis
      };
      
      let response;
      
      if (dealId) {
        // Update existing deal
        console.log('Updating existing deal:', dealId);
        response = await propertyApi.updateProperty(dealId, dealData);
      } else {
        // Create new deal
        console.log('Saving new deal to database:', dealData);
        response = await propertyApi.saveProperty(dealData);
      }
      
      if ((response.status === 201 || response.status === 200) && response.data) {
        console.log('Deal saved successfully:', response.data);
        setSuccessMessage(dealId ? 'Deal updated successfully!' : 'Deal saved successfully!');
        
        // If this was a new deal, update the URL with the new ID
        if (!dealId && response.data._id) {
          setDealId(response.data._id);
          navigate(`/sfr-analysis?id=${response.data._id}`, { replace: true });
        }
      } else {
        console.error('Failed to save deal:', response);
        setError('Failed to save deal: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error saving deal:', err);
      setError('Error saving deal: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSuccessMessage(null);
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
            onClick={() => {
              console.log('Navigating to dashboard using window.location');
              window.location.href = '/';
            }}
            sx={{ textDecoration: 'none' }}
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
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleSaveDeal}
                  disabled={isSaving}
                  startIcon={<SaveIcon />}
                >
                  {isSaving ? 'Saving...' : 'Save Deal'}
                </Button>
              </Box>
              <AnalysisResults 
                analysis={analysis} 
                propertyData={propertyData} 
                setAnalysis={setAnalysis}
              />
            </>
          )}
        </React.Fragment>
      )}
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        message={successMessage}
      />
    </Box>
  );
};

export default SFRAnalysis; 