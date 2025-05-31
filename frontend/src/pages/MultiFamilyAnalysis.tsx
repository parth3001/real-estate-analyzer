import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../config';
import MultiFamilyForm from '../components/MultiFamilyAnalysis/MultiFamilyForm';
import MultiFamilyAnalysisResults from '../components/MultiFamilyAnalysis/MultiFamilyAnalysisResults';
import { Analysis } from '../types/analysis';

// Define the interface for analysis results
interface MultiFamilyAnalysisResult {
  // Property details
  purchasePrice: number;
  downPayment: number;
  loanAmount: number;
  totalUnits: number;
  totalSqft: number;
  pricePerUnit: number;
  pricePerSqft: number;
  
  // Income
  grossPotentialRent: number;
  vacancyLoss: number;
  effectiveGrossIncome: number;
  otherIncome?: number;
  
  // Expenses
  operatingExpenses: number;
  propertyManagementExpense: number;
  propertyTaxExpense: number;
  insuranceExpense: number;
  repairsMaintenanceExpense: number;
  capExExpense: number;
  waterSewerExpense?: number;
  garbageExpense?: number;
  commonElectricityExpense?: number;
  otherExpenses?: number;
  expenseRatio: number;
  
  // Cash Flow
  noi: number;
  annualDebtService: number;
  monthlyCashFlow: number;
  annualCashFlow: number[];
  cashFlowPerUnit: number;
  
  // Returns
  capRate: number;
  cashOnCashReturn: number;
  annualROI: number;
  fiveYearROI: number;
  irr: number;
  
  // Mortgage
  monthlyMortgagePayment: number;
  totalInvestment: number;
  
  // Additional metrics
  debtServiceCoverageRatio: number;
  grossRentMultiplier: number;
  projectedFiveYearValue: number;
  projectedFiveYearEquity: number;
  breakEvenOccupancy: number;
  
  // Unit breakdown
  unitBreakdown: {
    type: string;
    count: number;
    monthlyRent: number;
    annualIncome: number;
  }[];
}

const MultiFamilyAnalysis: React.FC = () => {
  const [initialData, setInitialData] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load any saved current deal on component mount
  useEffect(() => {
    // Check if there's a current deal in localStorage
    const currentDealStr = localStorage.getItem('currentMultiFamilyDeal');
    if (currentDealStr) {
      try {
        console.log('Found current multi-family deal in localStorage');
        const currentDeal = JSON.parse(currentDealStr);
        
        // Set initial data from the current deal
        if (currentDeal.data) {
          console.log('Setting initial data from current deal');
          setInitialData(currentDeal.data);
          
          // If the deal has analysis results, set those too
          if (currentDeal.data.analysisResult) {
            console.log('Setting analysis results from current deal');
            setAnalysisResult(currentDeal.data.analysisResult);
          }
        }
        
        // Clear the current deal from localStorage to prevent issues on future navigation
        localStorage.removeItem('currentMultiFamilyDeal');
      } catch (err) {
        console.error('Error parsing current deal:', err);
        setError('Failed to load the current deal. Please try again.');
      }
    }

    // Also try to load from the auto-save
    try {
      const formKey = 'multiFamilyFormData_temp';
      const savedFormData = localStorage.getItem(formKey);
      
      if (savedFormData && !currentDealStr) {
        console.log('Found auto-saved form data, restoring state');
        setInitialData(JSON.parse(savedFormData));
      }
    } catch (err) {
      console.error('Error loading auto-saved data:', err);
    }
  }, []);

  // Helper function to backup form data before analysis
  const backupFormData = (formData: any) => {
    try {
      localStorage.setItem('multiFamilyFormData_backup', JSON.stringify(formData));
    } catch (error) {
      console.error('Failed to backup form data:', error);
    }
  };

  // Handle form submission for analysis
  const handleAnalyze = async (formData: any) => {
    setLoading(true);
    setError(null);
    
    // Backup the data before proceeding
    backupFormData(formData);
    
    try {
      console.log('Submitting multi-family analysis request', formData);
      
      // Make API call to the multi-family analysis endpoint
      const response = await axios.post(`${API_URL}/api/analyze/multifamily`, formData);
      
      console.log('Analysis response:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      // Set the analysis result
      setAnalysisResult(response.data);

      // Update the initial data with the latest form data and analysis result
      const updatedData = {
        ...formData,
        analysisResult: response.data,
        lastAnalyzed: new Date().toISOString()
      };
      setInitialData(updatedData);

      // Update the auto-save data
      localStorage.setItem('multiFamilyFormData_temp', JSON.stringify(updatedData));
    } catch (error: unknown) {
      console.error('Analysis error:', error);
      
      // Extract the specific error message from the axios error response if available
      let errorMessage = 'Failed to analyze the property. Please check your inputs and try again.';
      
      if (axios.isAxiosError(error)) {
        // Server responded with a non-2xx status
        console.error('Server error response:', error.response);
        
        if (error.response?.data?.error) {
          errorMessage = `Error: ${error.response.data.error}`;
        } else if (error.response?.status === 404) {
          errorMessage = 'Error: API endpoint not found. The server may be misconfigured.';
        } else if (error.response?.status === 500) {
          errorMessage = 'Error: Server internal error. Please check your inputs for invalid values.';
        }
      } else if (error instanceof Error) {
        // Something else happened while setting up the request
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
      
      // Restore the form data from backup if needed
      if (!initialData) {
        try {
          const backupData = localStorage.getItem('multiFamilyFormData_backup');
          if (backupData) {
            setInitialData(JSON.parse(backupData));
          }
        } catch (backupError) {
          console.error('Failed to restore backup data:', backupError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle error snackbar close
  const handleCloseError = () => {
    setError(null);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Multi-Family Property Analysis
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Analyze duplex, triplex, and apartment buildings from 2 to 32+ units
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <MultiFamilyForm 
              onSubmit={handleAnalyze} 
              initialData={initialData} 
              analysisResult={analysisResult} 
            />
            
            {analysisResult && (
              <MultiFamilyAnalysisResults results={analysisResult} />
            )}
          </>
        )}
        
        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={handleCloseError}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseError} 
            severity="error" 
            variant="filled"
          >
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default MultiFamilyAnalysis; 