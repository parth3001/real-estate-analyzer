import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Button
} from '@mui/material';
import { TrendingUp, TrendingDown, Save } from '@mui/icons-material';
import { AnalysisResult } from '../types/analysisTypes';
import { dealDAO } from '../services/dao/DealDAO';
import { DealData } from '../types/deal';

interface PropertyResultsProps {
  analysisData: AnalysisResult;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Add an interface for the saved analysis structure
interface SavedAnalysis {
  id: string;
  propertyName: string;
  propertyType: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  purchasePrice: number;
  downPayment: number;
  monthlyRent: number;
  units: number;
  capRate: number;
  cashOnCash: number;
  noi: number;
  investmentScore?: number;
  dateCreated: string;
  rawData: Record<string, unknown>;
}

// Add an proper interface for the deal data being sent to the backend
interface DealDataForBackend {
  _id?: string;
  propertyName: string;
  propertyType: string;
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  monthlyRent: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  propertyTaxRate: number;
  insuranceRate: number;
  maintenanceCost: number;
  propertyManagementRate: number;
  analysis: {
    monthlyAnalysis: Record<string, unknown>;
    annualAnalysis: Record<string, unknown>;
    longTermAnalysis: Record<string, unknown>;
    keyMetrics: Record<string, unknown>;
    aiInsights: Record<string, unknown>;
  };
  longTermAssumptions: Record<string, unknown>;
}

// Helper function to format currency values
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Helper function to format percentage values
const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

const PropertyResults: React.FC<PropertyResultsProps> = ({ analysisData }) => {
  const [tabValue, setTabValue] = useState(0);
  const [saved, setSaved] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Use useEffect for logging
  useEffect(() => {
    console.log('Analysis Data:', analysisData);
    if (analysisData.longTermAnalysis) {
      console.log('Long Term Analysis:', analysisData.longTermAnalysis);
    }
  }, [analysisData]);

  // Function to save the analysis to MongoDB using the DAO
  const saveAnalysis = async () => {
    try {
      // Extract essential data
      const propertyDetails = analysisData.propertyDetails || {};
      
      // Check if we're editing an existing deal
      const editingDealId = localStorage.getItem('currentEditAnalysisId');
      console.log('Editing deal ID:', editingDealId);
      
      // Ensure property address has all required fields
      const propertyAddress = {
        street: propertyDetails.propertyAddress?.street || '123 Main St',
        city: propertyDetails.propertyAddress?.city || 'San Francisco',
        state: propertyDetails.propertyAddress?.state || 'CA',
        zipCode: propertyDetails.propertyAddress?.zipCode || '94103'
      };
      
      // Format data for the DAO
      const dealData: DealData = {
        id: editingDealId || undefined,
        propertyName: propertyDetails.propertyName || 'Property Analysis',
        propertyType: propertyDetails.propertyType === 'MF' ? 'MF' : 'SFR',
        propertyAddress: propertyAddress,
        purchasePrice: Number(propertyDetails.purchasePrice) || 0,
        downPayment: Number(propertyDetails.downPayment) || 0,
        interestRate: Number(propertyDetails.interestRate) || 0,
        loanTerm: Number(propertyDetails.loanTerm) || 0,
        propertyTaxRate: Number(propertyDetails.propertyTaxRate) || 0,
        insuranceRate: Number(propertyDetails.insuranceRate) || 0,
        propertyManagementRate: Number(propertyDetails.propertyManagementRate) || 0,
        yearBuilt: Number(propertyDetails.yearBuilt) || 0,
        
        // Add property type specific fields
        ...(propertyDetails.propertyType === 'MF' ? {
          totalUnits: Number(propertyDetails.totalUnits) || 0,
          totalSqft: Number(propertyDetails.totalSqft) || 0,
          maintenanceCostPerUnit: Number(propertyDetails.maintenanceCostPerUnit) || 0,
          unitTypes: propertyDetails.unitTypes || [],
          commonAreaUtilities: propertyDetails.commonAreaUtilities || {
            electric: 0,
            water: 0,
            gas: 0,
            trash: 0
          },
          longTermAssumptions: {
            projectionYears: Number(propertyDetails.longTermAssumptions?.projectionYears) || 10,
            annualRentIncrease: Number(propertyDetails.longTermAssumptions?.annualRentIncrease) || 2,
            annualPropertyValueIncrease: Number(propertyDetails.longTermAssumptions?.annualPropertyValueIncrease) || 3,
            sellingCostsPercentage: Number(propertyDetails.longTermAssumptions?.sellingCostsPercentage) || 6,
            inflationRate: Number(propertyDetails.longTermAssumptions?.inflationRate) || 2,
            vacancyRate: Number(propertyDetails.longTermAssumptions?.vacancyRate) || 5,
            capitalExpenditureRate: Number(propertyDetails.longTermAssumptions?.capitalExpenditureRate) || 0,
            commonAreaMaintenanceRate: Number(propertyDetails.longTermAssumptions?.commonAreaMaintenanceRate) || 0
          }
        } : {
          monthlyRent: Number(propertyDetails.monthlyRent) || 0,
          squareFootage: Number(propertyDetails.squareFootage) || 0,
          bedrooms: Number(propertyDetails.bedrooms) || 0,
          bathrooms: Number(propertyDetails.bathrooms) || 0,
          maintenanceCost: Number(propertyDetails.maintenanceCost) || 0,
          longTermAssumptions: {
            projectionYears: Number(propertyDetails.longTermAssumptions?.projectionYears) || 10,
            annualRentIncrease: Number(propertyDetails.longTermAssumptions?.annualRentIncrease) || 2,
            annualPropertyValueIncrease: Number(propertyDetails.longTermAssumptions?.annualPropertyValueIncrease) || 3,
            sellingCostsPercentage: Number(propertyDetails.longTermAssumptions?.sellingCostsPercentage) || 6,
            inflationRate: Number(propertyDetails.longTermAssumptions?.inflationRate) || 2,
            vacancyRate: Number(propertyDetails.longTermAssumptions?.vacancyRate) || 5
          }
        })
      } as DealData;
      
      console.log('Saving deal via DAO:', dealData);
      
      // Use the DAO to save the deal
      const savedDeal = await dealDAO.saveDeal(
        dealData, 
        analysisData as unknown as import('../types/analysis').Analysis
      );
      
      if (!savedDeal) {
        throw new Error('Failed to save deal - no response from server');
      }
      
      console.log('Deal saved successfully:', savedDeal);
      
      // Show success message
      alert(editingDealId ? 'Analysis updated successfully!' : 'Analysis saved successfully to database!');
      
      // Update the UI to show it's been saved
      setSaved(true);
    } catch (error) {
      console.error('Error saving analysis:', error);
      alert(`Failed to save analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // If no data is available, show a message
  if (!analysisData) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" align="center">
            No analysis data available. Please submit a property for analysis.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Extract key data from the analysis result
  const keyMetrics = analysisData.keyMetrics || {};
  const annualAnalysis = analysisData.annualAnalysis || {};
  const longTermAnalysis = analysisData.longTermAnalysis || {};
  const propertyDetails = analysisData.propertyDetails || {};
  
  // Extract values for styling
  const monthlyCashFlow = analysisData.monthlyAnalysis?.cashFlow || 0;
  const firstYearCashOnCash = keyMetrics.cashOnCashReturn || annualAnalysis.cashOnCashReturn || 0;
  const isPositiveCashFlow = monthlyCashFlow >= 0;
  
  // For annual metrics
  const capRate = keyMetrics.capRate || annualAnalysis.capRate || 0;
  const dscr = keyMetrics.dscr || annualAnalysis.dscr || 0;
  const irr = longTermAnalysis.returns?.irr || 0;
  const projectionYears = longTermAnalysis.projectionYears || 10;

  // Calculate missing metrics if they're not provided
  const calculatePricePerSqFt = (price: number, sqft: number) => sqft > 0 ? price / sqft : 0;
  const calculateRentPerSqFt = (rent: number, sqft: number) => sqft > 0 ? rent / sqft : 0;
  
  // Additional metrics with proper fallback calculations
  const purchasePrice = propertyDetails.purchasePrice || 0;
  const squareFootage = propertyDetails.squareFootage || 0;
  const monthlyRent = propertyDetails.monthlyRent || 0;
  const downPayment = propertyDetails.downPayment || 0;
  const closingCosts = propertyDetails.closingCosts || 0;
  
  // Calculate if not available in metrics
  const pricePerSqFtPurchase = keyMetrics.pricePerSqFtAtPurchase || 
                              (squareFootage > 0 ? calculatePricePerSqFt(purchasePrice, squareFootage) : 0);
  
  const projectedSalePrice = longTermAnalysis.exitAnalysis?.projectedSalePrice || 0;
  const pricePerSqFtSale = keyMetrics.pricePerSqFtAtSale || 
                           (squareFootage > 0 ? calculatePricePerSqFt(projectedSalePrice, squareFootage) : 0);
  
  const avgRentPerSqFt = keyMetrics.avgRentPerSqFt || 
                         (squareFootage > 0 ? calculateRentPerSqFt(monthlyRent * 12, squareFootage) : 0);
  
  const totalReturn = longTermAnalysis.returns?.totalReturn || 0;
  const totalInvestment = annualAnalysis.totalInvestment || downPayment + closingCosts;
  
  // Log extracted metrics to debug
  console.log('Extracted metrics:', {
    purchasePrice,
    squareFootage,
    monthlyRent,
    downPayment,
    closingCosts,
    pricePerSqFtPurchase,
    pricePerSqFtSale,
    avgRentPerSqFt,
    totalInvestment
  });
  
  // Investment score
  const investmentScore = analysisData.aiInsights?.investmentScore || 0;
  const scoreColor = 
    investmentScore >= 70 ? 'success.main' : 
    investmentScore >= 50 ? 'warning.main' : 
    'error.main';
  
  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Analysis Results
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Save />}
          onClick={saveAnalysis}
          disabled={saved}
        >
          {saved ? 'Saved' : 'Save Analysis'}
        </Button>
      </Box>
      
      {/* Key Metrics Section with Investment Score */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, mb: 4 }}>
        {/* Investment Score - Larger Card */}
        {analysisData.aiInsights?.investmentScore !== undefined && (
          <Card 
            sx={{ 
              gridColumn: '1 / span 1', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              borderLeft: '6px solid',
              borderColor: scoreColor,
            }}
          >
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Investment Score
              </Typography>
              <Typography variant="h3" fontWeight="bold" color={scoreColor} align="center">
                {Math.round(investmentScore)}/100
              </Typography>
            </CardContent>
          </Card>
        )}
        
        {/* DSCR */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              DSCR
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {dscr.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Debt Service Coverage Ratio
            </Typography>
          </CardContent>
        </Card>

        {/* IRR */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {projectionYears}-Year IRR
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {formatPercentage(irr)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Internal Rate of Return
            </Typography>
          </CardContent>
        </Card>

        {/* Cash on Cash Return */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Cash on Cash Return
            </Typography>
            <Typography 
              variant="h5" 
              fontWeight="bold"
              color={firstYearCashOnCash >= 0 ? 'text.primary' : 'error.main'}
            >
              {formatPercentage(firstYearCashOnCash)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              First Year
            </Typography>
          </CardContent>
        </Card>

        {/* Cap Rate */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Cap Rate
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {formatPercentage(capRate)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Based on Purchase Price
            </Typography>
          </CardContent>
        </Card>

        {/* Price/SqFt at Purchase */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Price/SqFt at Purchase
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {formatCurrency(pricePerSqFtPurchase)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Initial Purchase
            </Typography>
          </CardContent>
        </Card>

        {/* Price/SqFt at Sale */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Price/SqFt at Sale
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {formatCurrency(pricePerSqFtSale)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Year {projectionYears} Projection
            </Typography>
          </CardContent>
        </Card>

        {/* Avg Rent/SqFt */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Avg Rent/SqFt
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {formatCurrency(avgRentPerSqFt)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Monthly Average
            </Typography>
          </CardContent>
        </Card>

        {/* Monthly Cash Flow */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Monthly Cash Flow
            </Typography>
            <Typography 
              variant="h5" 
              fontWeight="bold"
              color={isPositiveCashFlow ? 'text.primary' : 'error.main'}
            >
              {formatCurrency(monthlyCashFlow)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              First Year Average
            </Typography>
          </CardContent>
        </Card>

        {/* Total Return */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Total Return
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {formatCurrency(totalReturn)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {projectionYears} Year Total
            </Typography>
          </CardContent>
        </Card>

        {/* Total Investment */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Total Investment
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {formatCurrency(totalInvestment)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Down Payment + Costs
            </Typography>
          </CardContent>
        </Card>
      </Box>
      
      {/* Analysis Tabs */}
      <Card sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="analysis tabs">
            <Tab label="MONTHLY ANALYSIS" />
            <Tab label="ANNUAL PROJECTIONS" />
            <Tab label="EXIT ANALYSIS" />
            <Tab label="AI INSIGHTS" />
          </Tabs>
        </Box>
        
        {/* Tab 1: Monthly Analysis */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Category</strong></TableCell>
                  <TableCell align="right"><strong>Amount</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Gross Rental Income</TableCell>
                  <TableCell align="right">{formatCurrency(analysisData.monthlyAnalysis?.income?.gross || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Vacancy Loss</TableCell>
                  <TableCell align="right">-{formatCurrency(analysisData.monthlyAnalysis?.expenses?.breakdown?.vacancy || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Property Tax</TableCell>
                  <TableCell align="right">-{formatCurrency(analysisData.monthlyAnalysis?.expenses?.breakdown?.propertyTax || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Insurance</TableCell>
                  <TableCell align="right">-{formatCurrency(analysisData.monthlyAnalysis?.expenses?.breakdown?.insurance || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Maintenance</TableCell>
                  <TableCell align="right">-{formatCurrency(analysisData.monthlyAnalysis?.expenses?.breakdown?.maintenance || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Property Management</TableCell>
                  <TableCell align="right">-{formatCurrency(analysisData.monthlyAnalysis?.expenses?.breakdown?.propertyManagement || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Mortgage Payment</TableCell>
                  <TableCell align="right">-{formatCurrency(analysisData.monthlyAnalysis?.expenses?.debt || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ borderTop: '2px solid #ddd' }}><strong>Net Cash Flow</strong></TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      borderTop: '2px solid #ddd',
                      color: isPositiveCashFlow ? 'success.main' : 'error.main',
                      fontWeight: 'bold'
                    }}
                  >
                    {formatCurrency(monthlyCashFlow)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* Tab 2: Annual Projections */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Year</TableCell>
                  <TableCell>Property Value</TableCell>
                  <TableCell>Gross Rent</TableCell>
                  <TableCell>Property Tax</TableCell>
                  <TableCell>Insurance</TableCell>
                  <TableCell>Maintenance</TableCell>
                  <TableCell>Property Management</TableCell>
                  <TableCell>Vacancy</TableCell>
                  <TableCell>Total Expenses</TableCell>
                  <TableCell>NOI</TableCell>
                  <TableCell>Debt Service</TableCell>
                  <TableCell>Cash Flow</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!longTermAnalysis.yearlyProjections || longTermAnalysis.yearlyProjections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center">No annual projections data available</TableCell>
                  </TableRow>
                ) : (
                  longTermAnalysis.yearlyProjections.map((yearData, index) => (
                    <TableRow key={index}>
                      <TableCell>{yearData.year}</TableCell>
                      <TableCell>{formatCurrency(yearData.propertyValue || 0)}</TableCell>
                      <TableCell>{formatCurrency(yearData.grossRent || 0)}</TableCell>
                      <TableCell>{formatCurrency(yearData.propertyTax || 0)}</TableCell>
                      <TableCell>{formatCurrency(yearData.insurance || 0)}</TableCell>
                      <TableCell>{formatCurrency(yearData.maintenance || 0)}</TableCell>
                      <TableCell>{formatCurrency(yearData.propertyManagement || 0)}</TableCell>
                      <TableCell>{formatCurrency(yearData.vacancy || 0)}</TableCell>
                      <TableCell>{formatCurrency(yearData.operatingExpenses || 0)}</TableCell>
                      <TableCell>{formatCurrency(yearData.noi || 0)}</TableCell>
                      <TableCell>{formatCurrency(yearData.debtService || 0)}</TableCell>
                      <TableCell 
                        sx={{ 
                          color: (yearData.cashFlow || 0) >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {formatCurrency(yearData.cashFlow || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* Tab 3: Exit Analysis */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom>Exit Strategy Analysis</Typography>
              
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Projected Sale Price (Year {projectionYears})</TableCell>
                      <TableCell align="right">{formatCurrency(longTermAnalysis.exitAnalysis?.projectedSalePrice || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Selling Costs</TableCell>
                      <TableCell align="right">-{formatCurrency(longTermAnalysis.exitAnalysis?.sellingCosts || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Mortgage Payoff</TableCell>
                      <TableCell align="right">-{formatCurrency(longTermAnalysis.exitAnalysis?.mortgagePayoff || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ borderTop: '2px solid #ddd' }}><strong>Net Proceeds From Sale</strong></TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          borderTop: '2px solid #ddd',
                          fontWeight: 'bold'
                        }}
                      >
                        {formatCurrency(longTermAnalysis.exitAnalysis?.netProceedsFromSale || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom>Return Summary</Typography>
              
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Cash Flow (Over {projectionYears} Years)</TableCell>
                      <TableCell align="right">{formatCurrency(longTermAnalysis.returns?.totalCashFlow || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Appreciation</TableCell>
                      <TableCell align="right">{formatCurrency(longTermAnalysis.returns?.totalAppreciation || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Internal Rate of Return (IRR)</TableCell>
                      <TableCell align="right">{formatPercentage(longTermAnalysis.returns?.irr || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ borderTop: '2px solid #ddd' }}><strong>Total Return</strong></TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          borderTop: '2px solid #ddd',
                          fontWeight: 'bold'
                        }}
                      >
                        {formatCurrency(longTermAnalysis.returns?.totalReturn || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </TabPanel>
        
        {/* Tab 4: AI Insights */}
        <TabPanel value={tabValue} index={3}>
          {analysisData.aiInsights ? (
            <Box>
              {/* Investment Score display */}
              {analysisData.aiInsights.investmentScore !== undefined && (
                <Box sx={{ mb: 3 }}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      borderLeft: '4px solid',
                      borderColor: 
                        analysisData.aiInsights.investmentScore >= 70 ? 'success.light' : 
                        analysisData.aiInsights.investmentScore >= 50 ? 'warning.light' : 
                        'error.light',
                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Investment Score
                        </Typography>
                        <Typography variant="h4" fontWeight="medium" color="text.primary">
                          {Math.round(analysisData.aiInsights.investmentScore)}/100
                        </Typography>
                      </Box>
                      <Typography 
                        variant="subtitle1" 
                        fontWeight="regular"
                        sx={{ 
                          px: 2, 
                          py: 1, 
                          borderRadius: 1,
                          bgcolor: 'background.paper',
                          color: 'text.secondary',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        {analysisData.aiInsights.investmentScore >= 80 ? 'Excellent Investment' : 
                         analysisData.aiInsights.investmentScore >= 70 ? 'Very Good Investment' :
                         analysisData.aiInsights.investmentScore >= 60 ? 'Good Investment' :
                         analysisData.aiInsights.investmentScore >= 50 ? 'Average Investment' :
                         'Below Average Investment'}
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              )}

              <Typography variant="body1" paragraph>
                {analysisData.aiInsights.summary}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Strengths Section */}
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    borderLeft: '4px solid',
                    borderColor: 'success.light',
                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: 1
                  }}
                >
                  <Typography 
                    variant="subtitle1" 
                    fontWeight="medium" 
                    gutterBottom
                    sx={{ color: 'text.primary', display: 'flex', alignItems: 'center' }}
                  >
                    <TrendingUp sx={{ mr: 1, fontSize: 18, color: 'success.main', opacity: 0.7 }} />
                    Strengths
                  </Typography>
                  
                  {/* Bullet point design */}
                  <Box sx={{ mt: 1 }}>
                    {(analysisData.aiInsights.strengths || []).map((strength: string, index: number) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'flex-start',
                          mb: 1,
                          py: 0.5,
                          px: 1,
                          bgcolor: 'rgba(76, 175, 80, 0.05)', 
                          borderRadius: 1
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: 6, 
                            height: 6, 
                            borderRadius: '50%', 
                            bgcolor: 'success.main',
                            opacity: 0.7,
                            mt: 1,
                            mr: 1.5
                          }} 
                        />
                        <Typography variant="body2" color="text.primary">
                          {strength}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
                
                {/* Weaknesses Section */}
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    borderLeft: '4px solid',
                    borderColor: 'error.light',
                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: 1
                  }}
                >
                  <Typography 
                    variant="subtitle1" 
                    fontWeight="medium" 
                    gutterBottom
                    sx={{ color: 'text.primary', display: 'flex', alignItems: 'center' }}
                  >
                    <TrendingDown sx={{ mr: 1, fontSize: 18, color: 'error.main', opacity: 0.7 }} />
                    Weaknesses
                  </Typography>
                  
                  {/* Bullet point design */}
                  <Box sx={{ mt: 1 }}>
                    {(analysisData.aiInsights.weaknesses || []).map((weakness: string, index: number) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'flex-start',
                          mb: 1,
                          py: 0.5,
                          px: 1,
                          bgcolor: 'rgba(244, 67, 54, 0.05)', 
                          borderRadius: 1
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: 6, 
                            height: 6, 
                            borderRadius: '50%', 
                            bgcolor: 'error.main',
                            opacity: 0.7,
                            mt: 1,
                            mr: 1.5
                          }} 
                        />
                        <Typography variant="body2" color="text.primary">
                          {weakness}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
                
                {/* Recommendations Section */}
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    borderLeft: '4px solid',
                    borderColor: 'primary.light',
                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: 1
                  }}
                >
                  <Typography 
                    variant="subtitle1" 
                    fontWeight="medium" 
                    gutterBottom
                    sx={{ color: 'text.primary', display: 'flex', alignItems: 'center' }}
                  >
                    <TrendingUp sx={{ mr: 1, fontSize: 18, color: 'primary.main', opacity: 0.7, transform: 'rotate(45deg)' }} />
                    Recommendations
                  </Typography>
                  
                  {/* Bullet point design */}
                  <Box sx={{ mt: 1 }}>
                    {(analysisData.aiInsights.recommendations || []).map((recommendation: string, index: number) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'flex-start',
                          mb: 1,
                          py: 0.5,
                          px: 1,
                          bgcolor: 'rgba(25, 118, 210, 0.05)', 
                          borderRadius: 1
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: 6, 
                            height: 6, 
                            borderRadius: '50%', 
                            bgcolor: 'primary.main',
                            opacity: 0.7,
                            mt: 1,
                            mr: 1.5
                          }} 
                        />
                        <Typography variant="body2" color="text.primary">
                          {recommendation}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Box>
            </Box>
          ) : (
            <Typography variant="body1">
              No AI insights available for this property.
            </Typography>
          )}
        </TabPanel>
      </Card>
    </Box>
  );
};

export default PropertyResults; 