import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  TextField,
  Button
} from '@mui/material';
import type { CensusDataResponse, CensusQueryParams, MarketInsight } from '../types/censusData';
import * as censusService from '../services/censusService';
import { formatCurrency } from '../utils/formatters';

interface CensusDataDisplayProps {
  zip?: string;
  state?: string;
  county?: string;
}

/**
 * Component to display Census data for a property location
 */
const CensusDataDisplay: React.FC<CensusDataDisplayProps> = ({ 
  zip, 
  state, 
  county 
}) => {
  const [censusData, setCensusData] = useState<CensusDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [customZip, setCustomZip] = useState<string>(zip || '');
  const [customState, setCustomState] = useState<string>(state || '');
  
  // Format currency values
  const formatCurrencyValue = (value: number | undefined): string => {
    if (value === undefined) return 'N/A';
    return formatCurrency(value);
  };
  
  // Format percentage values
  const formatPercentage = (value: number | undefined): string => {
    if (value === undefined) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };
  
  // Format number values with commas
  const formatNumber = (value: number | undefined): string => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  // Load census data
  const loadCensusData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: CensusQueryParams = {
        zip: customZip || zip,
        state: customState || state,
        county
      };
      
      // Make sure we have at least one location parameter
      if (!params.zip && !params.state && !params.county) {
        setError('Please provide at least one location parameter (ZIP, state, or county)');
        setLoading(false);
        return;
      }
      
      const data = await censusService.getComprehensiveCensusData(params);
      setCensusData(data);
    } catch (err) {
      console.error('Error loading census data:', err);
      setError('Failed to load census data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load data on initial render if we have location info
  useEffect(() => {
    if (zip || state || county) {
      loadCensusData();
    }
  }, []);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Render demographic data
  const renderDemographicData = () => {
    const demographics = censusData?.demographics;
    
    if (!demographics) {
      return <Typography>No demographic data available</Typography>;
    }
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        <Box sx={{ width: '50%', p: 1 }}>
          <Card variant="outlined">
            <CardHeader title="Population" />
            <CardContent>
              <Typography variant="body1">
                <strong>Total Population:</strong> {formatNumber(demographics.totalPopulation)}
              </Typography>
              <Typography variant="body1">
                <strong>Median Age:</strong> {demographics.medianAge?.toFixed(1) || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  };
  
  // Render income data
  const renderIncomeData = () => {
    const income = censusData?.income;
    
    if (!income) {
      return <Typography>No income data available</Typography>;
    }
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        <Box sx={{ width: '50%', p: 1 }}>
          <Card variant="outlined">
            <CardHeader title="Income" />
            <CardContent>
              <Typography variant="body1">
                <strong>Median Household Income:</strong> {formatCurrencyValue(income.medianHouseholdIncome)}
              </Typography>
              <Typography variant="body1">
                <strong>Per Capita Income:</strong> {formatCurrencyValue(income.perCapitaIncome)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  };
  
  // Render housing data
  const renderHousingData = () => {
    const housing = censusData?.housing;
    
    if (!housing) {
      return <Typography>No housing data available</Typography>;
    }
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        <Box sx={{ width: '50%', p: 1 }}>
          <Card variant="outlined">
            <CardHeader title="Housing" />
            <CardContent>
              <Typography variant="body1">
                <strong>Total Housing Units:</strong> {formatNumber(housing.totalHousingUnits)}
              </Typography>
              <Typography variant="body1">
                <strong>Vacancy Rate:</strong> {formatPercentage(housing.vacancyRate)}
              </Typography>
              <Typography variant="body1">
                <strong>Median Home Value:</strong> {formatCurrencyValue(housing.medianHomeValue)}
              </Typography>
              <Typography variant="body1">
                <strong>Median Rent:</strong> {formatCurrencyValue(housing.medianRent)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: '50%', p: 1 }}>
          <Card variant="outlined">
            <CardHeader title="Occupancy" />
            <CardContent>
              <Typography variant="body1">
                <strong>Owner Occupied:</strong> {formatNumber(housing.ownerOccupied)}
              </Typography>
              <Typography variant="body1">
                <strong>Renter Occupied:</strong> {formatNumber(housing.renterOccupied)}
              </Typography>
              <Typography variant="body1">
                <strong>Occupancy Rate:</strong> {formatPercentage(housing.occupancyRate)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  };
  
  // Render market insights
  const renderMarketInsights = () => {
    if (!censusData) {
      return <Typography>No market insights available</Typography>;
    }
    
    // Generate insights based on census data
    const insights: MarketInsight[] = [];
    
    // Add housing market insights
    if (censusData.housing?.medianHomeValue) {
      insights.push({
        type: 'housing',
        title: 'Median Home Value',
        value: censusData.housing.medianHomeValue,
        insight: `The median home value in this area is ${formatCurrencyValue(censusData.housing.medianHomeValue)}.`
      });
    }
    
    if (censusData.housing?.vacancyRate) {
      insights.push({
        type: 'housing',
        title: 'Vacancy Rate',
        value: censusData.housing.vacancyRate,
        insight: `The housing vacancy rate in this area is ${formatPercentage(censusData.housing.vacancyRate)}.`
      });
    }
    
    // Add income insights
    if (censusData.income?.medianHouseholdIncome) {
      insights.push({
        type: 'income',
        title: 'Median Household Income',
        value: censusData.income.medianHouseholdIncome,
        insight: `The median household income in this area is ${formatCurrencyValue(censusData.income.medianHouseholdIncome)}.`
      });
    }
    
    // Add demographic insights
    if (censusData.demographics?.totalPopulation) {
      insights.push({
        type: 'demographics',
        title: 'Population',
        value: censusData.demographics.totalPopulation,
        insight: `The area has a population of ${formatNumber(censusData.demographics.totalPopulation)} people.`
      });
    }
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        {insights.map((insight, index) => (
          <Box sx={{ width: '50%', p: 1 }} key={index}>
            <Card variant="outlined">
              <CardHeader title={insight.title} />
              <CardContent>
                <Typography variant="body1">{insight.insight}</Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    );
  };
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Census Data
      </Typography>
      
      {/* Location input form */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ width: { xs: '100%', sm: '33.33%' }, p: 1 }}>
            <TextField
              label="ZIP Code"
              value={customZip}
              onChange={(e) => setCustomZip(e.target.value)}
              fullWidth
              margin="normal"
            />
          </Box>
          <Box sx={{ width: { xs: '100%', sm: '33.33%' }, p: 1 }}>
            <TextField
              label="State"
              value={customState}
              onChange={(e) => setCustomState(e.target.value)}
              fullWidth
              margin="normal"
              placeholder="e.g. CA"
            />
          </Box>
          <Box sx={{ width: { xs: '100%', sm: '33.33%' }, p: 1 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={loadCensusData}
              sx={{ mt: 2 }}
              fullWidth
            >
              Load Census Data
            </Button>
          </Box>
        </Box>
      </Box>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Box sx={{ my: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      
      {!loading && !error && censusData && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="census data tabs">
              <Tab label="Market Insights" />
              <Tab label="Demographics" />
              <Tab label="Income" />
              <Tab label="Housing" />
            </Tabs>
          </Box>
          
          {activeTab === 0 && renderMarketInsights()}
          {activeTab === 1 && renderDemographicData()}
          {activeTab === 2 && renderIncomeData()}
          {activeTab === 3 && renderHousingData()}
        </>
      )}
      
      {!loading && !error && !censusData && (
        <Box sx={{ my: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography>
            Enter a ZIP code or state to load census data.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default CensusDataDisplay; 