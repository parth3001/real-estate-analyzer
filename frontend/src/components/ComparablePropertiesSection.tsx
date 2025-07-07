import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  GridLegacy as Grid,
  LinearProgress,
  Divider
} from '@mui/material';
import { formatCurrency, formatDecimal } from '../utils/formatters';

interface ComparableProperty {
  address: string;
  distance: number;
  salePrice: number;
  saleDate: Date | string;
  pricePerSqft: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  daysOnMarket: number;
  propertyType: string;
  rentEstimate?: number;
  yearBuilt?: number;
  lotSize?: number;
}

interface SubjectProperty {
  address: string;
  purchasePrice: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  monthlyRent?: number;
  yearBuilt?: number;
}

interface ComparablePropertiesSectionProps {
  subjectProperty: SubjectProperty;
  comparableProperties: ComparableProperty[];
  isLoading?: boolean;
}

const ComparablePropertiesSection: React.FC<ComparablePropertiesSectionProps> = ({
  subjectProperty,
  comparableProperties,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Calculate subject property metrics
  const subjectPricePerSqft = subjectProperty.purchasePrice / subjectProperty.squareFootage;
  
  // Calculate comparable statistics
  const comparableStats = React.useMemo(() => {
    if (!comparableProperties || comparableProperties.length === 0) {
      return null;
    }

    const salePrices = comparableProperties.map(c => c.salePrice).sort((a, b) => a - b);
    const pricesPerSqft = comparableProperties.map(c => c.pricePerSqft).filter(p => p > 0).sort((a, b) => a - b);
    const daysOnMarket = comparableProperties.map(c => c.daysOnMarket).filter(d => d > 0).sort((a, b) => a - b);

    const medianSalePrice = salePrices[Math.floor(salePrices.length / 2)];
    const avgSalePrice = salePrices.reduce((sum, price) => sum + price, 0) / salePrices.length;
    
    const medianPricePerSqft = pricesPerSqft.length > 0 ? pricesPerSqft[Math.floor(pricesPerSqft.length / 2)] : 0;
    const avgPricePerSqft = pricesPerSqft.length > 0 ? pricesPerSqft.reduce((sum, price) => sum + price, 0) / pricesPerSqft.length : 0;
    
    const avgDaysOnMarket = daysOnMarket.length > 0 ? daysOnMarket.reduce((sum, days) => sum + days, 0) / daysOnMarket.length : 0;

    return {
      count: comparableProperties.length,
      medianSalePrice,
      avgSalePrice,
      medianPricePerSqft,
      avgPricePerSqft,
      avgDaysOnMarket,
      priceRange: {
        min: Math.min(...salePrices),
        max: Math.max(...salePrices)
      }
    };
  }, [comparableProperties]);

  // Calculate how subject property compares
  const comparison = React.useMemo(() => {
    if (!comparableStats) return null;

    const priceDiffVsMedian = ((subjectProperty.purchasePrice - comparableStats.medianSalePrice) / comparableStats.medianSalePrice) * 100;
    const priceDiffVsAvg = ((subjectProperty.purchasePrice - comparableStats.avgSalePrice) / comparableStats.avgSalePrice) * 100;
    const sqftPriceDiffVsAvg = ((subjectPricePerSqft - comparableStats.avgPricePerSqft) / comparableStats.avgPricePerSqft) * 100;

    return {
      priceDiffVsMedian,
      priceDiffVsAvg,
      sqftPriceDiffVsAvg,
      dealQuality: priceDiffVsMedian < -5 ? 'Excellent Deal' : 
                   priceDiffVsMedian < 0 ? 'Good Deal' :
                   priceDiffVsMedian < 10 ? 'Fair Deal' : 'Expensive'
    };
  }, [subjectProperty, comparableStats, subjectPricePerSqft]);

  if (isLoading) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>Comparable Properties Analysis</Typography>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading comparable properties data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!comparableProperties || comparableProperties.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>Comparable Properties Analysis</Typography>
          <Alert severity="info">
            No comparable properties found in this area. This analysis requires recent sales data from similar properties.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>Comparable Properties Analysis</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Analysis based on {comparableStats?.count} recent sales of similar properties
        </Typography>
        
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label="Deal Analysis" />
          <Tab label="Property Comparison" />
          <Tab label="Market Position" />
        </Tabs>
        
        {/* Deal Analysis Tab */}
        {activeTab === 0 && (
          <Box>
            {comparison && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>Deal Quality Assessment</Typography>
                      <Chip 
                        label={comparison.dealQuality}
                        color={
                          comparison.dealQuality === 'Excellent Deal' ? 'success' :
                          comparison.dealQuality === 'Good Deal' ? 'primary' :
                          comparison.dealQuality === 'Fair Deal' ? 'warning' : 'error'
                        }
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="body2">
                        Your purchase price is{' '}
                        <strong>
                          {comparison.priceDiffVsMedian > 0 ? '+' : ''}{comparison.priceDiffVsMedian.toFixed(1)}%
                        </strong>{' '}
                        compared to the median sale price of comparable properties.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>Price Per Square Foot</Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(subjectPricePerSqft)}/sqft
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Market Average: {formatCurrency(comparableStats?.avgPricePerSqft || 0)}/sqft
                      </Typography>
                      <Typography variant="body2">
                        Your price is{' '}
                        <strong>
                          {comparison.sqftPriceDiffVsAvg > 0 ? '+' : ''}{comparison.sqftPriceDiffVsAvg.toFixed(1)}%
                        </strong>{' '}
                        vs. comparable properties
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            <Alert 
              severity={
                comparison?.dealQuality === 'Excellent Deal' || comparison?.dealQuality === 'Good Deal' ? 'success' :
                comparison?.dealQuality === 'Fair Deal' ? 'info' : 'warning'
              }
              sx={{ mb: 2 }}
            >
              <Typography variant="body2">
                {comparison?.dealQuality === 'Excellent Deal' && 
                  'This appears to be an excellent deal based on recent comparable sales. You\'re getting good value for your investment.'}
                {comparison?.dealQuality === 'Good Deal' && 
                  'This looks like a good deal compared to recent sales in the area. You\'re paying below market rates.'}
                {comparison?.dealQuality === 'Fair Deal' && 
                  'This property is priced fairly relative to recent comparable sales. It\'s in line with current market rates.'}
                {comparison?.dealQuality === 'Expensive' && 
                  'This property is priced above recent comparable sales. Consider negotiating or ensure there are unique value factors.'}
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Property Comparison Tab */}
        {activeTab === 1 && (
          <Box>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Property</TableCell>
                    <TableCell align="right">Sale Price</TableCell>
                    <TableCell align="right">$/SqFt</TableCell>
                    <TableCell align="center">Bed/Bath</TableCell>
                    <TableCell align="right">SqFt</TableCell>
                    <TableCell align="right">Days on Market</TableCell>
                    <TableCell align="right">Distance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Subject Property Row */}
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        Subject Property
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {subjectProperty.address}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(subjectProperty.purchasePrice)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(subjectPricePerSqft)}
                    </TableCell>
                    <TableCell align="center">
                      {subjectProperty.bedrooms}/{subjectProperty.bathrooms}
                    </TableCell>
                    <TableCell align="right">
                      {subjectProperty.squareFootage.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">-</TableCell>
                    <TableCell align="right">-</TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Divider />
                    </TableCell>
                  </TableRow>
                  
                  {/* Comparable Properties */}
                  {comparableProperties
                    .sort((a, b) => a.distance - b.distance)
                    .slice(0, 10)
                    .map((comp, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2">
                          Comparable {index + 1}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {comp.address}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(comp.salePrice)}
                      </TableCell>
                      <TableCell align="right">
                        {comp.pricePerSqft > 0 ? formatCurrency(comp.pricePerSqft) : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        {comp.bedrooms}/{comp.bathrooms}
                      </TableCell>
                      <TableCell align="right">
                        {comp.sqft > 0 ? comp.sqft.toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell align="right">
                        {comp.daysOnMarket > 0 ? comp.daysOnMarket : 'N/A'}
                      </TableCell>
                      <TableCell align="right">
                        {formatDecimal(comp.distance, 2)} mi
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Market Position Tab */}
        {activeTab === 2 && comparableStats && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Sale Price Statistics</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Median Sale Price</Typography>
                      <Typography variant="h6">{formatCurrency(comparableStats.medianSalePrice)}</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Average Sale Price</Typography>
                      <Typography variant="body1">{formatCurrency(comparableStats.avgSalePrice)}</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Price Range</Typography>
                      <Typography variant="body1">
                        {formatCurrency(comparableStats.priceRange.min)} - {formatCurrency(comparableStats.priceRange.max)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Market Metrics</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Average Price per SqFt</Typography>
                      <Typography variant="h6">{formatCurrency(comparableStats.avgPricePerSqft)}/sqft</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Average Days on Market</Typography>
                      <Typography variant="body1">{Math.round(comparableStats.avgDaysOnMarket)} days</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Sample Size</Typography>
                      <Typography variant="body1">{comparableStats.count} recent sales</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {comparison && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Based on comparable sales analysis, your property is positioned{' '}
                <strong>
                  {Math.abs(comparison.priceDiffVsMedian) < 5 ? 'in line with' :
                   comparison.priceDiffVsMedian < 0 ? 'below' : 'above'}
                </strong>{' '}
                the local market. Recent sales suggest properties in this area typically sell within{' '}
                <strong>{Math.round(comparableStats.avgDaysOnMarket)} days</strong>.
              </Alert>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ComparablePropertiesSection;