import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Tabs,
  Tab,
  useTheme,
  Skeleton,
} from '@mui/material';
import MarketComparisonChart from './visualizations/MarketComparisonChart';
import CensusInsights from './CensusInsights/index';
import type { CensusDataResponse } from '../types/censusData';

interface MarketComparisonSectionProps {
  propertyData: {
    propertyValue?: number;
    monthlyRent?: number;
    purchasePrice?: number;
    vacancyRate?: number;
    propertyTaxRate?: number;
    zip?: string;
    zipCode?: string;
    state?: string;
    county?: string;
  };
  censusData?: CensusDataResponse;
  isLoading?: boolean;
}

/**
 * Market Comparison Section Component
 * 
 * Displays a comprehensive market comparison section with charts and insights
 * based on census data.
 */
const MarketComparisonSection: React.FC<MarketComparisonSectionProps> = ({
  propertyData,
  censusData,
  isLoading = false,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [insights, setInsights] = useState<any[]>([]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Generate insights based on property and census data
  useEffect(() => {
    if (!censusData || !propertyData) {
      setInsights([]);
      return;
    }

    const newInsights = [];
    
    // Property value insights
    if (propertyData.purchasePrice && censusData.housing?.medianHomeValue) {
      const diff = propertyData.purchasePrice - censusData.housing.medianHomeValue;
      const percentDiff = (diff / censusData.housing.medianHomeValue) * 100;
      
      if (percentDiff < -10) {
        newInsights.push({
          type: 'positive',
          text: `Property is priced ${Math.abs(percentDiff).toFixed(1)}% below the local median home value, potentially indicating a good value.`,
          category: 'value'
        });
      } else if (percentDiff > 15) {
        newInsights.push({
          type: 'negative',
          text: `Property is priced ${percentDiff.toFixed(1)}% above the local median home value, which may affect resale potential.`,
          category: 'value'
        });
      } else {
        newInsights.push({
          type: 'neutral',
          text: `Property price is within normal range of local median home value (${percentDiff > 0 ? '+' : ''}${percentDiff.toFixed(1)}%).`,
          category: 'value'
        });
      }
    }
    
    // Rental insights
    if (propertyData.monthlyRent && censusData.housing?.medianRent) {
      const diff = propertyData.monthlyRent - censusData.housing.medianRent;
      const percentDiff = (diff / censusData.housing.medianRent) * 100;
      
      if (percentDiff > 15) {
        newInsights.push({
          type: 'positive',
          text: `Rental income is ${percentDiff.toFixed(1)}% above local median rent, suggesting strong income potential.`,
          category: 'rent'
        });
      } else if (percentDiff < -10) {
        newInsights.push({
          type: 'negative',
          text: `Rental income is ${Math.abs(percentDiff).toFixed(1)}% below local median rent, which may limit cash flow.`,
          category: 'rent'
        });
      } else {
        newInsights.push({
          type: 'neutral',
          text: `Rental income is aligned with local median rent (${percentDiff > 0 ? '+' : ''}${percentDiff.toFixed(1)}%).`,
          category: 'rent'
        });
      }
    }
    
    // Vacancy rate insights
    if (propertyData.vacancyRate !== undefined && censusData.housing?.vacancyRate) {
      const diff = propertyData.vacancyRate - (censusData.housing.vacancyRate * 100);
      
      if (diff < -2) {
        newInsights.push({
          type: 'positive',
          text: `Projected vacancy rate is ${Math.abs(diff).toFixed(1)} percentage points below the local average, suggesting lower vacancy risk.`,
          category: 'market'
        });
      } else if (diff > 2) {
        newInsights.push({
          type: 'negative',
          text: `Projected vacancy rate is ${diff.toFixed(1)} percentage points above the local average, which may increase vacancy risk.`,
          category: 'market'
        });
      }
    }
    
    // Demographic insights
    if (censusData.demographics) {
      if (censusData.demographics.populationGrowth && censusData.demographics.populationGrowth > 0.05) {
        newInsights.push({
          type: 'positive',
          text: `Area has strong population growth (${(censusData.demographics.populationGrowth * 100).toFixed(1)}%), which typically supports property value appreciation.`,
          category: 'demographic'
        });
      } else if (censusData.demographics.populationGrowth && censusData.demographics.populationGrowth < -0.02) {
        newInsights.push({
          type: 'negative',
          text: `Area has declining population (${(censusData.demographics.populationGrowth * 100).toFixed(1)}%), which may impact long-term property values.`,
          category: 'demographic'
        });
      }
    }
    
    // Income insights
    if (censusData.income?.medianHouseholdIncome && propertyData.monthlyRent) {
      const annualRent = propertyData.monthlyRent * 12;
      const rentToIncomeRatio = annualRent / censusData.income.medianHouseholdIncome;
      
      if (rentToIncomeRatio > 0.4) {
        newInsights.push({
          type: 'negative',
          text: `Annual rent is ${(rentToIncomeRatio * 100).toFixed(1)}% of local median household income, which may limit rental affordability.`,
          category: 'market'
        });
      } else if (rentToIncomeRatio < 0.25) {
        newInsights.push({
          type: 'positive',
          text: `Annual rent is only ${(rentToIncomeRatio * 100).toFixed(1)}% of local median household income, suggesting good rental affordability.`,
          category: 'market'
        });
      }
    }
    
    setInsights(newInsights);
  }, [censusData, propertyData]);

  // Prepare data for value comparison chart
  const valueComparisonData = [
    {
      name: 'Property Value',
      property: propertyData.purchasePrice || 0,
      census: censusData?.housing?.medianHomeValue || 0,
    },
    {
      name: 'Monthly Rent',
      property: propertyData.monthlyRent || 0,
      census: censusData?.housing?.medianRent || 0,
    },
  ];

  // Prepare data for market metrics chart
  const marketMetricsData = [
    {
      name: 'Vacancy Rate',
      property: propertyData.vacancyRate || 0,
      census: censusData?.housing?.vacancyRate ? censusData.housing.vacancyRate * 100 : 0,
      isPercentage: true,
    },
    {
      name: 'Owner Occupied',
      property: 0, // This would need to come from property data if available
      census: censusData?.housing?.ownerOccupancyRate ? censusData.housing.ownerOccupancyRate * 100 : 0,
      isPercentage: true,
    },
  ];

  // Render loading state
  if (isLoading) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>Market Comparison</Typography>
          <Skeleton variant="rectangular" height={300} />
        </CardContent>
      </Card>
    );
  }

  // Render no data state
  if (!censusData || !propertyData) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>Market Comparison</Typography>
          <Typography variant="body2" color="text.secondary">
            Census data is not available for this location.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>Market Comparison</Typography>
        
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label="Value Comparison" />
          <Tab label="Market Metrics" />
          <Tab label="Census Insights" />
        </Tabs>
        
        {activeTab === 0 && (
          <Box>
            <MarketComparisonChart
              title="Property Value & Rent Comparison"
              propertyData={[
                { name: 'Property Value', value: propertyData.purchasePrice || 0 },
                { name: 'Monthly Rent', value: propertyData.monthlyRent || 0 },
              ]}
              censusData={[
                { name: 'Property Value', value: censusData.housing?.medianHomeValue || 0 },
                { name: 'Monthly Rent', value: censusData.housing?.medianRent || 0 },
              ]}
              valuePrefix="$"
            />
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                This chart compares your property's value and rental income to local averages based on census data.
                {propertyData.purchasePrice && censusData.housing?.medianHomeValue && (
                  <>
                    {' '}Your property {propertyData.purchasePrice > censusData.housing.medianHomeValue ? 'exceeds' : 'is below'} the 
                    local median home value by {Math.abs(((propertyData.purchasePrice / censusData.housing.medianHomeValue) - 1) * 100).toFixed(1)}%.
                  </>
                )}
              </Typography>
            </Box>
          </Box>
        )}
        
        {activeTab === 1 && (
          <Box>
            <MarketComparisonChart
              title="Market Metrics Comparison"
              propertyData={[
                { name: 'Vacancy Rate', value: propertyData.vacancyRate || 0 },
                { name: 'Property Tax Rate', value: propertyData.propertyTaxRate || 0 },
              ]}
              censusData={[
                { name: 'Vacancy Rate', value: censusData.housing?.vacancyRate ? censusData.housing.vacancyRate * 100 : 0 },
                { name: 'Property Tax Rate', value: censusData.housing?.propertyTaxRate || 0 },
              ]}
              valuePrefix=""
              valueSuffix="%"
              isPercentage={true}
            />
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                This chart compares key market metrics between your property and local averages.
                {propertyData.vacancyRate !== undefined && censusData.housing?.vacancyRate && (
                  <>
                    {' '}Your projected vacancy rate is {propertyData.vacancyRate > (censusData.housing.vacancyRate * 100) ? 'higher than' : 'lower than'} the 
                    local average by {Math.abs(propertyData.vacancyRate - (censusData.housing.vacancyRate * 100)).toFixed(1)} percentage points.
                  </>
                )}
              </Typography>
            </Box>
          </Box>
        )}
        
        {activeTab === 2 && (
          <CensusInsights insights={insights} />
        )}
      </CardContent>
    </Card>
  );
};

export default MarketComparisonSection;
