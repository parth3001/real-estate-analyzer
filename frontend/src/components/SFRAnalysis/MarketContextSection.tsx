import React from 'react';
import {
  Box,
  Typography,
  GridLegacy as Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider,
  Alert
} from '@mui/material';
import {
  Home,
  AccountBalance,
  Assessment,
  People
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';

// Define proper TypeScript interfaces following architecture principles
interface MarketContextProps {
  analysis: {
    keyMetrics?: {
      capRate?: number;
      cashOnCashReturn?: number;
      monthlyRent?: number;
    };
    monthlyAnalysis?: {
      cashFlow?: number;
      income?: {
        gross?: number;
      };
    };
  };
  censusData: {
    demographics?: {
      totalPopulation?: number;
      medianAge?: number;
    };
    income?: {
      medianHouseholdIncome?: number;
      perCapitaIncome?: number;
    };
    housing?: {
      medianHomeValue?: number;
      medianRent?: number;
      vacancyRate?: number;
      ownerOccupied?: number;
      renterOccupied?: number;
    };
  } | null;
  propertyData: {
    purchasePrice?: number;
    monthlyRent?: number;
    propertyAddress?: {
      city?: string;
      state?: string;
      zipCode?: string;
    };
  };
}

export const MarketContextSection: React.FC<MarketContextProps> = ({
  censusData,
  propertyData
}) => {
  // Error handling following architecture principles
  if (!censusData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Market Context Unavailable
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Census data could not be retrieved for this location ({propertyData.propertyAddress?.city}, {propertyData.propertyAddress?.state}). 
            Market context analysis requires valid location information.
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Tip: Ensure the property address includes a valid ZIP code or state for census data integration.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Validate essential data for calculations
  if (!propertyData.purchasePrice && !propertyData.monthlyRent) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Insufficient Property Data
          </Typography>
          <Typography variant="body2">
            Property purchase price and monthly rent are required for market context analysis.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Using standardized formatCurrency from utils

  const formatPercent = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);

  // Calculate market positioning
  const calculateMarketPosition = () => {
    if (!censusData.housing?.medianHomeValue || !propertyData.purchasePrice) return null;
    
    const propertyValue = propertyData.purchasePrice;
    const marketMedian = censusData.housing.medianHomeValue;
    const percentageDiff = ((propertyValue - marketMedian) / marketMedian) * 100;

    return {
      propertyValue,
      marketMedian,
      percentageDiff,
      position: percentageDiff < -10 ? 'Significantly Below Market' :
                percentageDiff < 0 ? 'Below Market' :
                percentageDiff < 10 ? 'At Market' : 'Above Market'
    };
  };

  // Calculate affordability analysis
  const calculateAffordability = () => {
    if (!propertyData.monthlyRent || !censusData.income?.medianHouseholdIncome) return null;

    const requiredIncome = propertyData.monthlyRent * 12 * 3; // 3x rent rule
    const medianIncome = censusData.income.medianHouseholdIncome;
    const affordabilityRatio = medianIncome / requiredIncome;

    return {
      requiredIncome,
      medianIncome,
      affordabilityRatio,
      assessment: affordabilityRatio >= 1 ? 'Highly Affordable' : 
                  affordabilityRatio >= 0.8 ? 'Moderately Affordable' : 
                  affordabilityRatio >= 0.6 ? 'Challenging Affordability' : 'Above Market Rate'
    };
  };

  const getPositionColor = (position: string) => {
    if (position.includes('Below')) return 'success';
    if (position.includes('Above')) return 'warning';
    return 'info';
  };

  const getAffordabilityColor = (assessment: string) => {
    if (assessment.includes('Highly')) return 'success';
    if (assessment.includes('Moderately')) return 'info';
    if (assessment.includes('Challenging')) return 'warning';
    return 'error';
  };

  const marketPosition = calculateMarketPosition();
  const affordabilityAnalysis = calculateAffordability();

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Local Market Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Analysis based on US Census data for {propertyData.propertyAddress?.city}, {propertyData.propertyAddress?.state}
      </Typography>

      <Grid container spacing={3}>
        {/* Market Position Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Home sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Market Position</Typography>
              </Box>
              
              {marketPosition ? (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Property Value vs Market Median
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                    <Typography variant="body2">Your Property:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(marketPosition.propertyValue)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                    <Typography variant="body2">Market Median:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(marketPosition.marketMedian)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                    <Typography variant="body2">Difference:</Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      color={marketPosition.percentageDiff < 0 ? 'success.main' : 'warning.main'}
                    >
                      {marketPosition.percentageDiff > 0 ? '+' : ''}{marketPosition.percentageDiff.toFixed(1)}%
                    </Typography>
                  </Box>
                  <Chip 
                    label={marketPosition.position}
                    color={getPositionColor(marketPosition.position)}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Market position data not available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Affordability Analysis Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalance sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Affordability Analysis</Typography>
              </Box>
              
              {affordabilityAnalysis ? (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    3x Income Rule Analysis
                  </Typography>
                  <Box sx={{ my: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Required Income: {formatCurrency(affordabilityAnalysis.requiredIncome)}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Area Median Income: {formatCurrency(affordabilityAnalysis.medianIncome)}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(affordabilityAnalysis.affordabilityRatio * 100, 100)}
                      sx={{ 
                        mt: 1, 
                        height: 8, 
                        borderRadius: 4,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: affordabilityAnalysis.affordabilityRatio >= 0.8 ? 'success.main' : 'warning.main'
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Coverage: {(affordabilityAnalysis.affordabilityRatio * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                  <Chip 
                    label={affordabilityAnalysis.assessment}
                    color={getAffordabilityColor(affordabilityAnalysis.assessment)}
                    size="small"
                  />
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Affordability data not available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Demographics Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Area Demographics</Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Population
                    </Typography>
                    <Typography variant="h6">
                      {censusData.demographics?.totalPopulation?.toLocaleString() || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Median Age
                    </Typography>
                    <Typography variant="h6">
                      {censusData.demographics?.medianAge?.toFixed(1) || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Median Income
                    </Typography>
                    <Typography variant="h6">
                      {censusData.income?.medianHouseholdIncome ? 
                        formatCurrency(censusData.income.medianHouseholdIncome) : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Vacancy Rate
                    </Typography>
                    <Typography variant="h6">
                      {censusData.housing?.vacancyRate ? 
                        formatPercent(censusData.housing.vacancyRate) : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Additional Housing Stats */}
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Median Home Value
                    </Typography>
                    <Typography variant="h6">
                      {censusData.housing?.medianHomeValue ? 
                        formatCurrency(censusData.housing.medianHomeValue) : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Median Rent
                    </Typography>
                    <Typography variant="h6">
                      {censusData.housing?.medianRent ? 
                        formatCurrency(censusData.housing.medianRent) : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Owner Occupied
                    </Typography>
                    <Typography variant="h6">
                      {censusData.housing?.ownerOccupied && censusData.housing?.renterOccupied ? 
                        formatPercent((censusData.housing.ownerOccupied / (censusData.housing.ownerOccupied + censusData.housing.renterOccupied)) * 100) : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Per Capita Income
                    </Typography>
                    <Typography variant="h6">
                      {censusData.income?.perCapitaIncome ? 
                        formatCurrency(censusData.income.perCapitaIncome) : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Investment Context */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Investment Context</Typography>
              </Box>
              
              <Grid container spacing={2}>
                {marketPosition && (
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>Market Positioning</Typography>
                      <Typography variant="body2">
                        Your property is priced <strong>{Math.abs(marketPosition.percentageDiff).toFixed(1)}%</strong> {' '}
                        {marketPosition.percentageDiff < 0 ? 'below' : 'above'} the area median.
                        {marketPosition.percentageDiff < 0 ? ' This represents good value for the market.' : 
                         ' Consider if the premium is justified by location or features.'}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                
                {affordabilityAnalysis && (
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>Tenant Pool</Typography>
                      <Typography variant="body2">
                        {affordabilityAnalysis.affordabilityRatio >= 1 ? 
                          'Large tenant pool - rent is affordable for median income earners.' :
                          affordabilityAnalysis.affordabilityRatio >= 0.8 ?
                          'Moderate tenant pool - targets above-median income earners.' :
                          'Limited tenant pool - targets high income earners only.'
                        }
                      </Typography>
                    </Box>
                  </Grid>
                )}
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>Market Dynamics</Typography>
                    <Typography variant="body2">
                      {censusData.housing?.vacancyRate ? (
                        censusData.housing.vacancyRate < 5 ? 
                          'Tight rental market with low vacancy - strong demand.' :
                        censusData.housing.vacancyRate < 8 ?
                          'Balanced rental market with normal vacancy rates.' :
                          'Loose rental market with higher vacancy - competitive environment.'
                      ) : 'Market dynamics data not available.'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};