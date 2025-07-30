import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Alert, 
  CircularProgress, 
  Button, 
  Snackbar, 
  ButtonGroup,
  Container,
  Stack,
  Fade
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { AutoAwesome, Edit, Dashboard, DataUsage as SampleDataIcon } from '@mui/icons-material';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import SFRPropertyForm from '../components/SFRAnalysis/SFRPropertyForm';
import PropertyWizard from '../components/SFRAnalysis/PropertyWizard';
import { propertyApi } from '../services/api';
import type { SFRPropertyData } from '../types/property';
import type { Analysis } from '../types/analysis';
import AnalysisResults from '../components/SFRAnalysis/AnalysisResults';
import { AppleCard, AppleButton } from '../components/ui/AppleComponents';
import { appleColors } from '../theme/appleDesignSystem';

const SFRAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<'input' | 'results'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<SFRPropertyData | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [dealId, setDealId] = useState<string | null>(null);
  
  // Input method state
  const [inputMethod, setInputMethod] = useState<'wizard' | 'manual'>('wizard');
  
  // Phase 2: Interactive Analysis state
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const wizardEnabled = true; // Enable for Phase 1 testing
  
  // Race condition prevention for main analysis
  const [activeAnalysisRequestId, setActiveAnalysisRequestId] = useState<string | null>(null);

  // Handle input method change
  const handleInputMethodChange = (method: 'wizard' | 'manual') => {
    setInputMethod(method);
    setError(null);
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
        setActiveSection('input'); // Switch to input section
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
      
      // Use single unified analysis API for both wizard and manual data
      console.log('Sending property data to unified analysis API:', data);
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
        setActiveSection('results'); // Switch to results section
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
          setActiveSection('results'); // Switch to results section
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

  // Phase 2: Interactive Analysis Handlers
  
  // Dedicated Apply Changes handler - complete UI lockdown and reload
  const handleApplyChanges = useCallback(async (updatedData: SFRPropertyData) => {
    console.log('🚀 APPLY CHANGES: Starting complete analysis reload');
    
    // 1. Lock the entire UI
    setIsApplyingChanges(true);
    setIsRecalculating(true);
    setError(null);
    
    // 2. Cancel any pending operations
    if (activeAnalysisRequestId) {
      console.log('🚀 APPLY CHANGES: Cancelling any pending analysis');
      setActiveAnalysisRequestId(null);
    }
    
    try {
      console.log('🚀 APPLY CHANGES: Calling full analysis API with updated data:', updatedData);
      
      // 3. Call the full analysis API (same as initial analysis)
      const response = await propertyApi.analyzeProperty(updatedData);
      
      if (response.status === 200 && response.data) {
        console.log('🚀 APPLY CHANGES: API success, completely refreshing state');
        console.log('🚀 APPLY CHANGES: New cash flow:', response.data?.monthlyAnalysis?.cashFlow);
        console.log('🚀 APPLY CHANGES: New cap rate:', response.data?.keyMetrics?.capRate);
        
        // 4. Completely refresh all state (force re-render of all components)
        setPropertyData(updatedData);
        setAnalysis(response.data);
        
        // 5. Force all components to recognize the new data
        console.log('🚀 APPLY CHANGES: State updated successfully');
        
      } else {
        console.error('🚀 APPLY CHANGES: API failed:', response);
        setError('Failed to apply changes: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('🚀 APPLY CHANGES: Error:', err);
      setError('Error applying changes: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      // 6. Unlock the UI
      setIsApplyingChanges(false);
      setIsRecalculating(false);
      console.log('🚀 APPLY CHANGES: Complete - UI unlocked');
    }
  }, [activeAnalysisRequestId]);
  
  // Handle parameter changes with race condition prevention
  const handleParameterChange = useCallback(async (updatedData: SFRPropertyData) => {
    // Check if this is an Apply Changes call (special flag)
    if ((updatedData as any).__applyChangesMode) {
      console.log('🚀 ROUTING: Apply Changes detected, routing to dedicated handler');
      delete (updatedData as any).__applyChangesMode;
      return handleApplyChanges(updatedData);
    }
    
    // Generate unique request ID for this analysis
    const requestId = `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    setIsRecalculating(true);
    setError(null);
    
    // Set active request ID
    setActiveAnalysisRequestId(requestId);
    
    try {
      console.log(`Starting full analysis (${requestId.substring(requestId.length - 4)}) with new parameters:`, updatedData);
      const response = await propertyApi.analyzeProperty(updatedData);
      
      // Use callback to check latest active request ID to avoid stale closures
      setActiveAnalysisRequestId(currentActiveId => {
        if (requestId === currentActiveId && response.status === 200 && response.data) {
          console.log(`SFRAnalysis: About to update state with new data:`);
          console.log(`SFRAnalysis: - Old analysis cash flow: ${analysis?.monthlyAnalysis?.cashFlow}`);
          console.log(`SFRAnalysis: - New analysis cash flow: ${response.data?.monthlyAnalysis?.cashFlow}`);
          console.log(`SFRAnalysis: - Updated property data:`, updatedData);
          setPropertyData(updatedData);
          setAnalysis(response.data);
          setIsRecalculating(false);
          console.log(`Full analysis (${requestId.substring(requestId.length - 4)}) completed successfully`);
        } else if (requestId !== currentActiveId) {
          console.log(`Full analysis (${requestId.substring(requestId.length - 4)}) cancelled - newer request active`);
        } else {
          console.error('Parameter update failed:', response);
          setError('Failed to update analysis: ' + (response.message || 'Unknown error'));
          setIsRecalculating(false);
        }
        return currentActiveId; // Don't actually change the activeRequestId here
      });
      
      // Backup timeout to ensure loading state clears
      setTimeout(() => {
        setActiveAnalysisRequestId(currentActiveId => {
          if (requestId === currentActiveId) {
            setIsRecalculating(false);
          }
          return currentActiveId;
        });
      }, 0);
      
    } catch (err) {
      console.error(`Error updating parameters (${requestId.substring(requestId.length - 4)}):`, err);
      setError('Error updating analysis: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setIsRecalculating(false);
    }
  }, [handleApplyChanges]);

  // Handle applying deal fixes - use full analysis for complete data consistency
  const handleApplyFix = useCallback(async (updatedData: SFRPropertyData, fixDescription: string) => {
    console.log('🚀 DEAL OPTIMIZER: Starting complete analysis reload');
    
    // 1. Lock the entire UI (same as Interactive Analysis)
    setIsApplyingChanges(true);
    setIsRecalculating(true);
    setError(null);
    
    // 2. Cancel any pending operations
    if (activeAnalysisRequestId) {
      console.log('🚀 DEAL OPTIMIZER: Cancelling any pending analysis');
      setActiveAnalysisRequestId(null);
    }
    
    try {
      console.log('🚀 DEAL OPTIMIZER: Applying fixes with full analysis:', fixDescription);
      console.log('🚀 DEAL OPTIMIZER: Updated data:', updatedData);
      
      // 3. Use full analysis to ensure data consistency across all tabs
      const response = await propertyApi.analyzeProperty(updatedData);
      
      if (response.status === 200 && response.data) {
        console.log('🚀 DEAL OPTIMIZER: API success, completely refreshing state');
        console.log('🚀 DEAL OPTIMIZER: New cash flow:', response.data?.monthlyAnalysis?.cashFlow);
        console.log('🚀 DEAL OPTIMIZER: New cap rate:', response.data?.keyMetrics?.capRate);
        
        // 4. Completely refresh all state (force re-render of all components)
        setPropertyData(updatedData);
        setAnalysis(response.data);
        setSuccessMessage(`Applied fix: ${fixDescription}`);
        
        console.log('🚀 DEAL OPTIMIZER: Deal fix applied successfully');
      } else {
        console.error('🚀 DEAL OPTIMIZER: Deal fix failed:', response);
        setError('Failed to apply fix: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('🚀 DEAL OPTIMIZER: Error applying fix:', err);
      setError('Error applying fix: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      // 5. Unlock the UI
      setIsApplyingChanges(false);
      setIsRecalculating(false);
      console.log('🚀 DEAL OPTIMIZER: Complete - UI unlocked');
    }
  }, [activeAnalysisRequestId]);

  // Handle loading scenarios with preserved analysis data
  const handleLoadScenario = useCallback(async (scenarioData: SFRPropertyData, savedAnalysis?: Analysis) => {
    setIsRecalculating(true);
    setError(null);
    
    try {
      console.log('Loading scenario:', {
        scenarioName: scenarioData.propertyName || 'Unnamed',
        hasSavedAnalysis: !!savedAnalysis,
        savedCashFlow: savedAnalysis?.monthlyAnalysis?.cashFlow
      });
      
      if (savedAnalysis) {
        // Load scenario with saved analysis data (no recalculation needed)
        setPropertyData(scenarioData);
        setAnalysis(savedAnalysis);
        setSuccessMessage('Scenario loaded successfully (using saved analysis)');
        console.log('Scenario loaded from saved analysis - no recalculation needed');
      } else {
        // Fallback: recalculate analysis if no saved data available
        console.log('No saved analysis found, recalculating...');
        const response = await propertyApi.analyzeProperty(scenarioData);
        
        if (response.status === 200 && response.data) {
          setPropertyData(scenarioData);
          setAnalysis(response.data);
          setSuccessMessage('Scenario loaded successfully (recalculated)');
          console.log('Scenario loaded with fresh analysis');
        } else {
          console.error('Scenario load failed:', response);
          setError('Failed to load scenario: ' + (response.message || 'Unknown error'));
        }
      }
    } catch (err) {
      console.error('Error loading scenario:', err);
      setError('Error loading scenario: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsRecalculating(false);
    }
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <AppleCard padding="large">
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={3}>
              <Box>
                <Typography 
                  variant="h4" 
                  component="h1"
                  sx={{ 
                    fontWeight: 700,
                    color: appleColors.gray[900],
                    mb: 1
                  }}
                >
                  Single-Family Rental Analysis
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: appleColors.gray[600],
                    maxWidth: '600px',
                    lineHeight: 1.6
                  }}
                >
                  Analyze your single family rental investment with comprehensive market intelligence, 
                  AI-powered insights, and detailed financial projections.
                </Typography>
              </Box>
              
              <Stack direction="row" spacing={2}>
                <AppleButton
                  variant="secondary"
                  onClick={loadSampleData}
                  disabled={sampleLoading}
                  icon={<SampleDataIcon />}
                >
                  {sampleLoading ? 'Loading...' : 'Load Sample'}
                </AppleButton>
                <AppleButton
                  variant="secondary"
                  onClick={() => {
                    console.log('Navigating to dashboard using window.location');
                    window.location.href = '/';
                  }}
                  icon={<Dashboard />}
                >
                  Dashboard
                </AppleButton>
              </Stack>
            </Stack>
          </AppleCard>
        </Box>
        
        {/* Navigation Pills */}
        <Box sx={{ mb: 4 }}>
          <AppleCard padding="medium">
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={3}>
              <ButtonGroup 
                variant="outlined" 
                sx={{ 
                  '& .MuiButtonGroup-grouped': {
                    borderRadius: '12px',
                    px: 3,
                    py: 1.5,
                    fontWeight: 500,
                    textTransform: 'none',
                    minWidth: '140px',
                    '&:hover': {
                      backgroundColor: appleColors.primary[50],
                      borderColor: appleColors.primary[300]
                    }
                  }
                }}
              >
                <Button
                  onClick={() => setActiveSection('input')}
                  disabled={isApplyingChanges}
                  sx={{
                    backgroundColor: activeSection === 'input' ? appleColors.primary[50] : 'transparent',
                    borderColor: activeSection === 'input' ? appleColors.primary[500] : appleColors.gray[300],
                    color: activeSection === 'input' ? appleColors.primary[700] : appleColors.gray[700],
                    '&:hover': {
                      backgroundColor: appleColors.primary[50],
                      borderColor: appleColors.primary[300]
                    }
                  }}
                >
                  Property Input
                </Button>
                <Button
                  onClick={() => setActiveSection('results')}
                  disabled={!analysis || isApplyingChanges}
                  sx={{
                    backgroundColor: activeSection === 'results' ? appleColors.primary[50] : 'transparent',
                    borderColor: activeSection === 'results' ? appleColors.primary[500] : appleColors.gray[300],
                    color: activeSection === 'results' ? appleColors.primary[700] : appleColors.gray[700],
                    '&:hover': {
                      backgroundColor: appleColors.primary[50],
                      borderColor: appleColors.primary[300]
                    },
                    '&:disabled': {
                      backgroundColor: appleColors.gray[50],
                      borderColor: appleColors.gray[200],
                      color: appleColors.gray[400]
                    }
                  }}
                >
                  Analysis Results
                </Button>
              </ButtonGroup>
              
              {analysis && propertyData && activeSection === 'results' && (
                <AppleButton
                  variant="primary"
                  onClick={handleSaveDeal}
                  disabled={isSaving}
                  icon={<SaveIcon />}
                >
                  {isSaving ? 'Saving...' : 'Save Deal'}
                </AppleButton>
              )}
            </Stack>
          </AppleCard>
        </Box>
        
        {/* Error Display */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: '16px',
              backgroundColor: '#FEF2F2',
              border: `1px solid #FECACA`,
              '& .MuiAlert-icon': {
                color: '#DC2626'
              }
            }}
          >
            {error}
          </Alert>
        )}
        
        {/* Property Input Section */}
        <Fade in={activeSection === 'input'} unmountOnExit>
          <Box sx={{ display: activeSection === 'input' ? 'block' : 'none' }}>
            {/* Input Method Selection */}
            {wizardEnabled && (
              <Box sx={{ mb: 4 }}>
                <AppleCard padding="large">
                  <Stack spacing={3}>
                    <Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          color: appleColors.gray[900],
                          mb: 1
                        }}
                      >
                        Choose Analysis Method
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: appleColors.gray[600],
                          lineHeight: 1.6
                        }}
                      >
                        Select how you'd like to input your property information for analysis
                      </Typography>
                    </Box>
                    
                    <ButtonGroup 
                      variant="outlined" 
                      sx={{ 
                        '& .MuiButtonGroup-grouped': {
                          borderRadius: '12px',
                          px: 4,
                          py: 2,
                          fontWeight: 500,
                          textTransform: 'none',
                          minWidth: '180px',
                          '&:hover': {
                            backgroundColor: appleColors.primary[50],
                            borderColor: appleColors.primary[300]
                          }
                        }
                      }}
                    >
                      <Button
                        onClick={() => handleInputMethodChange('wizard')}
                        startIcon={<AutoAwesome />}
                        sx={{
                          backgroundColor: inputMethod === 'wizard' ? appleColors.primary[50] : 'transparent',
                          borderColor: inputMethod === 'wizard' ? appleColors.primary[500] : appleColors.gray[300],
                          color: inputMethod === 'wizard' ? appleColors.primary[700] : appleColors.gray[700],
                          '&:hover': {
                            backgroundColor: appleColors.primary[50],
                            borderColor: appleColors.primary[300]
                          }
                        }}
                      >
                        Smart Wizard
                      </Button>
                      <Button
                        onClick={() => handleInputMethodChange('manual')}
                        startIcon={<Edit />}
                        sx={{
                          backgroundColor: inputMethod === 'manual' ? appleColors.primary[50] : 'transparent',
                          borderColor: inputMethod === 'manual' ? appleColors.primary[500] : appleColors.gray[300],
                          color: inputMethod === 'manual' ? appleColors.primary[700] : appleColors.gray[700],
                          '&:hover': {
                            backgroundColor: appleColors.primary[50],
                            borderColor: appleColors.primary[300]
                          }
                        }}
                      >
                        Manual Form
                      </Button>
                    </ButtonGroup>
                    
                    {/* Method Descriptions */}
                    <Box>
                      {inputMethod === 'wizard' && (
                        <Fade in={true}>
                          <Alert 
                            severity="info" 
                            sx={{ 
                              backgroundColor: '#EFF6FF',
                              border: `1px solid #BFDBFE`,
                              borderRadius: '12px',
                              '& .MuiAlert-icon': {
                                color: '#2563EB'
                              }
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                              Guided Analysis (Recommended)
                            </Typography>
                            <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                              Step-by-step property analysis with auto-population from market data, 
                              smart defaults, and intelligent suggestions. Perfect for all experience levels.
                            </Typography>
                          </Alert>
                        </Fade>
                      )}
                      
                      {inputMethod === 'manual' && (
                        <Fade in={true}>
                          <Alert 
                            severity="warning" 
                            sx={{ 
                              backgroundColor: '#FFF7ED',
                              border: `1px solid #FED7AA`,
                              borderRadius: '12px',
                              '& .MuiAlert-icon': {
                                color: '#EA580C'
                              }
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                              Advanced Manual Entry
                            </Typography>
                            <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                              Complete control over all 60+ fields with detailed input options. 
                              Ideal for experienced investors who want full customization.
                            </Typography>
                          </Alert>
                        </Fade>
                      )}
                    </Box>
                  </Stack>
                </AppleCard>
              </Box>
            )}

            {/* Render Wizard or Form */}
            <Fade in={inputMethod === 'wizard'} unmountOnExit>
              <Box sx={{ display: inputMethod === 'wizard' ? 'block' : 'none' }}>
                {inputMethod === 'wizard' && wizardEnabled && (
                  <PropertyWizard
                    onComplete={handleAnalyzeProperty}
                    initialData={propertyData || undefined}
                    onCancel={() => handleInputMethodChange('manual')}
                  />
                )}
              </Box>
            </Fade>
            
            <Fade in={inputMethod === 'manual'} unmountOnExit>
              <Box sx={{ display: inputMethod === 'manual' ? 'block' : 'none' }}>
                {inputMethod === 'manual' && (
                  <SFRPropertyForm
                    onSubmit={handleAnalyzeProperty}
                    initialData={propertyData || undefined}
                    isLoading={isLoading}
                    error={error || undefined}
                  />
                )}
              </Box>
            </Fade>
          </Box>
        </Fade>
        
        {/* Analysis Results Section */}
        <Fade in={activeSection === 'results'} unmountOnExit>
          <Box sx={{ display: activeSection === 'results' ? 'block' : 'none' }}>
            {analysis && propertyData && (
              <React.Fragment>
                {isLoading || isApplyingChanges ? (
                  <AppleCard padding="large">
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                      <CircularProgress 
                        size={32} 
                        sx={{ 
                          color: appleColors.primary[500],
                          mr: 2
                        }} 
                      />
                      <Box>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: appleColors.gray[600],
                            fontWeight: 500
                          }}
                        >
                          {isApplyingChanges ? 'Applying changes and recalculating...' : 'Analyzing your property...'}
                        </Typography>
                        {activeAnalysisRequestId && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              mt: 1, 
                              color: appleColors.gray[500], 
                              fontFamily: 'monospace', 
                              fontSize: '10px',
                              display: 'block'
                            }}
                          >
                            Request ID: {activeAnalysisRequestId.substring(-6)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </AppleCard>
                ) : (
                  <AnalysisResults 
                    analysis={analysis} 
                    propertyData={propertyData} 
                    dealId={dealId || undefined}
                    setAnalysis={setAnalysis}
                    setPropertyData={setPropertyData}
                    onParameterChange={handleParameterChange}
                    onApplyFix={handleApplyFix}
                    onLoadScenario={handleLoadScenario}
                    isRecalculating={isRecalculating}
                  />
                )}
              </React.Fragment>
            )}
          </Box>
        </Fade>
        
        {/* Success Snackbar */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={5000}
          onClose={handleSnackbarClose}
          message={successMessage}
          sx={{
            '& .MuiSnackbarContent-root': {
              backgroundColor: '#10B981',
              borderRadius: '12px',
              fontWeight: 500
            }
          }}
        />
      </Container>
  );
};

export default SFRAnalysis; 