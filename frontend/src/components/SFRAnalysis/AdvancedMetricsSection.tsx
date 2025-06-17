import React from 'react';
import {
  GridLegacy as Grid,
  Card,
  CardContent,
  Typography,
  Tooltip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

interface AdvancedMetricsSectionProps {
  metrics: {
    breakEvenOccupancy?: number;
    equityMultiple?: number;
    onePercentRuleValue?: number;
    fiftyRuleAnalysis?: boolean;
    rentToPriceRatio?: number;
    pricePerBedroom?: number;
    debtToIncomeRatio?: number;
    grossRentMultiplier?: number;
    operatingExpenseRatio?: number;
    returnOnImprovements?: number;
    turnoverCostImpact?: number;
  };
}

// Format number as currency
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format number as percentage
const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
};

// Format number with decimal places
const formatDecimal = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00';
  }
  return value.toFixed(2);
};

const AdvancedMetricsSection: React.FC<AdvancedMetricsSectionProps> = ({ metrics }) => {
  return (
    <Grid container spacing={2}>
      {/* Break-Even Occupancy */}
      <Grid item xs={6} sm={4} md={3}>
        <Card variant="outlined" sx={{ height: '100%', width: '100%' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Break-Even Occupancy
              <Tooltip title="Minimum occupancy rate needed to cover all expenses">
                <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
              </Tooltip>
            </Typography>
            <Typography variant="h5" component="div">
              {formatPercent(metrics.breakEvenOccupancy)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Lower is better
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Equity Multiple */}
      <Grid item xs={6} sm={4} md={3}>
        <Card variant="outlined" sx={{ height: '100%', width: '100%' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Equity Multiple
              <Tooltip title="Total return divided by initial investment">
                <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
              </Tooltip>
            </Typography>
            <Typography variant="h5" component="div">
              {formatDecimal(metrics.equityMultiple)}x
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Higher is better
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* One Percent Rule */}
      <Grid item xs={6} sm={4} md={3}>
        <Card variant="outlined" sx={{ height: '100%', width: '100%' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              1% Rule Value
              <Tooltip title="Monthly rent as percentage of purchase price (>1% is favorable)">
                <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
              </Tooltip>
            </Typography>
            <Typography variant="h5" component="div">
              {formatPercent(metrics.onePercentRuleValue)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ color: (metrics.onePercentRuleValue || 0) >= 1 ? 'success.main' : 'warning.main' }}>
              {(metrics.onePercentRuleValue || 0) >= 1 ? 'Passes 1% Rule' : 'Below 1% Rule'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Fifty Percent Rule */}
      <Grid item xs={6} sm={4} md={3}>
        <Card variant="outlined" sx={{ height: '100%', width: '100%' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              50% Rule Analysis
              <Tooltip title="Operating expenses should be ≤ 50% of gross rent">
                <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
              </Tooltip>
            </Typography>
            <Typography variant="h5" component="div" sx={{ color: metrics.fiftyRuleAnalysis ? 'success.main' : 'error.main' }}>
              {metrics.fiftyRuleAnalysis ? 'Pass' : 'Fail'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Operating expense efficiency
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Rent-to-Price Ratio */}
      <Grid item xs={6} sm={4} md={3}>
        <Card variant="outlined" sx={{ height: '100%', width: '100%' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Rent-to-Price Ratio
              <Tooltip title="Monthly rent divided by purchase price (as percentage)">
                <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
              </Tooltip>
            </Typography>
            <Typography variant="h5" component="div">
              {formatPercent(metrics.rentToPriceRatio)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Higher is better
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Price Per Bedroom */}
      <Grid item xs={6} sm={4} md={3}>
        <Card variant="outlined" sx={{ height: '100%', width: '100%' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Price Per Bedroom
              <Tooltip title="Purchase price divided by number of bedrooms">
                <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
              </Tooltip>
            </Typography>
            <Typography variant="h5" component="div">
              {formatCurrency(metrics.pricePerBedroom)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Market comparison metric
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Debt-to-Income Ratio */}
      <Grid item xs={6} sm={4} md={3}>
        <Card variant="outlined" sx={{ height: '100%', width: '100%' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Debt-to-Income Ratio
              <Tooltip title="Annual debt service divided by annual income">
                <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
              </Tooltip>
            </Typography>
            <Typography variant="h5" component="div">
              {formatPercent(metrics.debtToIncomeRatio)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Lower is better
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Gross Rent Multiplier */}
      <Grid item xs={6} sm={4} md={3}>
        <Card variant="outlined" sx={{ height: '100%', width: '100%' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Gross Rent Multiplier
              <Tooltip title="Purchase price divided by annual gross rent">
                <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
              </Tooltip>
            </Typography>
            <Typography variant="h5" component="div">
              {formatDecimal(metrics.grossRentMultiplier)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Lower is better (typically 7-12)
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Operating Expense Ratio */}
      <Grid item xs={6} sm={4} md={3}>
        <Card variant="outlined" sx={{ height: '100%', width: '100%' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Operating Expense Ratio
              <Tooltip title="Operating expenses as % of effective gross income">
                <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
              </Tooltip>
            </Typography>
            <Typography variant="h5" component="div">
              {formatPercent(metrics.operatingExpenseRatio)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Typically 35-50% for SFR
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Return on Improvements */}
      <Grid item xs={6} sm={4} md={3}>
        <Card variant="outlined" sx={{ height: '100%', width: '100%' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Return on Improvements
              <Tooltip title="Return generated by capital improvements">
                <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
              </Tooltip>
            </Typography>
            <Typography variant="h5" component="div">
              {formatPercent(metrics.returnOnImprovements)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Higher is better
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Turnover Cost Impact */}
      <Grid item xs={6} sm={4} md={3}>
        <Card variant="outlined" sx={{ height: '100%', width: '100%' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Turnover Cost Impact
              <Tooltip title="Turnover costs as percentage of gross income">
                <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
              </Tooltip>
            </Typography>
            <Typography variant="h5" component="div">
              {formatPercent(metrics.turnoverCostImpact)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Lower is better
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default AdvancedMetricsSection; 