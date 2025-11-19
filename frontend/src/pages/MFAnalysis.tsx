/**
 * MFAnalysis Page - Multi-Family Property Analysis
 * Integrates MFPropertyWizard for guided multi-family property analysis
 * Pattern matches SFRAnalysis.tsx for consistency
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Alert,
  Box,
  Typography,
  Button,
  ButtonGroup,
  Stack,
  Fade,
  Snackbar,
  CircularProgress
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MFPropertyWizard from '../components/MFAnalysis/MFPropertyWizard';
import AnalysisResults from '../components/SFRAnalysis/AnalysisResults';
import type { MultiFamilyPropertyData } from '../types/property';
import type { Analysis } from '../types/analysis';
import api, { propertyApi } from '../services/api';
import { AppleCard, AppleButton } from '../components/ui/AppleComponents';
import { appleColors } from '../theme/appleDesignSystem';

const MFAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State management (matching SFR pattern)
  const [activeSection, setActiveSection] = useState<'input' | 'results'>('input');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [propertyData, setPropertyData] = useState<MultiFamilyPropertyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dealId, setDealId] = useState<string | null>(null);

  // Helper function to extract string ID
  const extractStringId = (idValue: any): string => {
    if (!idValue) return '';
    if (typeof idValue === 'string') return idValue;
    if (typeof idValue === 'object' && idValue._id) return extractStringId(idValue._id);
    if (typeof idValue === 'object' && idValue.id) return extractStringId(idValue.id);
    if (typeof idValue === 'object' && typeof idValue.toString === 'function') {
      return idValue.toString();
    }
    return String(idValue);
  };

  // Load saved property from URL parameter (matches SFR pattern)
  useEffect(() => {
    const id = searchParams.get('id');
    console.log('📍 MFAnalysis useEffect - URL id parameter:', id);

    if (id) {
      console.log('Loading existing MF deal with ID:', id);
      const cleanId = extractStringId(id);
      setDealId(cleanId);
      loadDealData(cleanId);
    }
  }, [searchParams]);

  // Load deal data from API (matches SFR pattern)
  const loadDealData = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading MF deal data for ID:', id);
      const response = await propertyApi.getProperty(id);

      if (response.status === 200 && response.data) {
        console.log('MF deal data loaded:', response.data);

        // Extract property data and analysis
        const { analysis: dealAnalysis, ...dealPropertyData } = response.data;

        // Validate property type
        if (dealPropertyData.propertyType !== 'MF') {
          console.error('Property type mismatch:', dealPropertyData.propertyType);
          setError('This is not a Multi-Family Property');
          setIsLoading(false);
          return;
        }

        // Set property data for wizard to hydrate
        setPropertyData(dealPropertyData as MultiFamilyPropertyData);

        // If analysis exists, set it and switch to results view
        if (dealAnalysis) {
          console.log('Setting MF analysis data:', {
            hasMonthlyAnalysis: !!dealAnalysis.monthlyAnalysis,
            hasKeyMetrics: !!dealAnalysis.keyMetrics,
            hasInvestmentDecision: !!dealAnalysis.investmentDecision
          });

          setAnalysis(dealAnalysis);
          setActiveSection('results'); // Auto-switch to results when loading saved deal
        }

        console.log('✅ MF deal loaded successfully');
      }
    } catch (err: any) {
      console.error('❌ Error loading MF deal:', err);
      setError(err.response?.data?.error || 'Failed to load deal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle wizard completion
  const handleWizardComplete = async (data: MultiFamilyPropertyData): Promise<Analysis | null> => {
    try {
      setError(null);
      console.log('MFAnalysis: Submitting multi-family property data', {
        propertyName: data.propertyName,
        totalUnits: data.totalUnits,
        purchasePrice: data.purchasePrice
      });

      // Call backend API to analyze multi-family property
      const response = await api.post<Analysis>('/deals/analyze', {
        ...data,
        propertyType: 'MF'
      });

      console.log('MFAnalysis: Analysis completed successfully', {
        monthlyIncome: response.data.monthlyAnalysis?.income,
        monthlyExpenses: response.data.monthlyAnalysis?.expenses?.total,
        cashFlow: response.data.monthlyAnalysis?.cashFlow
      });

      // Store both analysis and property data
      setAnalysis(response.data);
      setPropertyData(data); // Store the input data for display
      setActiveSection('results'); // Switch to results view
      return response.data;

    } catch (err: any) {
      console.error('MFAnalysis: Error analyzing property:', err);
      const errorMessage = err.response?.data?.error || 'Failed to analyze property. Please try again.';
      setError(errorMessage);
      return null;
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
        const cleanDealId = extractStringId(dealId);
        console.log('💾 Updating MF deal:', cleanDealId);
        response = await propertyApi.updateProperty(cleanDealId, dealData);
      } else {
        // Create new deal
        console.log('💾 Saving new MF deal to database');
        response = await propertyApi.saveProperty(dealData);
      }

      if ((response.status === 201 || response.status === 200) && response.data) {
        console.log('✅ MF Deal saved successfully:', response.data);

        // Extract and store deal ID
        const savedId = extractStringId(response.data._id || response.data.id);
        setDealId(savedId);

        setSuccessMessage(dealId ? 'Deal updated successfully!' : 'Deal saved successfully!');
      }
    } catch (err: any) {
      console.error('❌ Error saving MF deal:', err);
      setError(err.response?.data?.error || 'Failed to save deal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle wizard cancellation
  const handleWizardCancel = () => {
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section with Toggle */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            {activeSection === 'results' && propertyData?.propertyName ? (
              <>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    color: appleColors.gray[900],
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {propertyData.propertyName}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: appleColors.gray[600] }}
                >
                  {propertyData.totalUnits} units • Multi-Family Property
                </Typography>
              </>
            ) : (
              <>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    color: appleColors.gray[900],
                    mb: 1
                  }}
                >
                  Multi-Family Property Analysis
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: appleColors.gray[600] }}
                >
                  Analyze multi-family properties with institutional-grade metrics
                </Typography>
              </>
            )}
          </Box>

          {/* Save Button (only show when analysis exists) */}
          {activeSection === 'results' && (
            <Stack direction="row" spacing={2}>
              <AppleButton
                variant="primary"
                onClick={handleSaveDeal}
                disabled={isSaving}
                icon={<SaveIcon />}
              >
                {isSaving ? 'Saving...' : dealId ? 'Update Deal' : 'Save Deal'}
              </AppleButton>
            </Stack>
          )}
        </Stack>

        {/* Input/Results Toggle */}
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
                disabled={!analysis}
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
          </Stack>
        </AppleCard>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography variant="body1" color="text.secondary">
              Loading property data...
            </Typography>
          </Stack>
        </Box>
      )}

      {/* Property Input Section */}
      {!isLoading && (
        <Fade in={activeSection === 'input'} unmountOnExit>
          <Box sx={{ display: activeSection === 'input' ? 'block' : 'none' }}>
            <MFPropertyWizard
              onComplete={handleWizardComplete}
              onCancel={handleWizardCancel}
              initialData={propertyData || undefined}
            />
          </Box>
        </Fade>
      )}

      {/* Analysis Results Section */}
      <Fade in={activeSection === 'results'} unmountOnExit>
        <Box sx={{ display: activeSection === 'results' ? 'block' : 'none' }}>
          {analysis && propertyData && (
            <AnalysisResults
              analysis={analysis}
              propertyData={propertyData}
            />
          )}
        </Box>
      </Fade>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Container>
  );
};

export default MFAnalysis;
