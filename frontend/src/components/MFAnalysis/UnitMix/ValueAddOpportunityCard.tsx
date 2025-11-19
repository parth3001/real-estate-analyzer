/**
 * Value-Add Opportunity Card Component
 *
 * Displays the upside potential from raising rents to market rate.
 * Prominently shows annual revenue increase opportunity.
 *
 * @component
 */

import React from 'react';
import {
  Card,
  CardContent,
  Stack,
  Box,
  Typography,
  Chip,
  Alert
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { formatCurrency } from '../../../utils/formatters';
import { appleColors } from '../../../theme/appleDesignSystem';

interface ValueAddOpportunityCardProps {
  currentAnnualRent: number;
  marketAnnualRent: number;
  annualUpside: number;
  upsidePercentage: number;
  hasMarketData: boolean;
}

export const ValueAddOpportunityCard: React.FC<ValueAddOpportunityCardProps> = ({
  currentAnnualRent,
  marketAnnualRent,
  annualUpside,
  upsidePercentage,
  hasMarketData
}) => {
  // Don't show card if no market data available
  if (!hasMarketData || marketAnnualRent === 0) {
    return (
      <Alert severity="info" sx={{ marginBottom: 3 }}>
        <Typography variant="body2">
          Market rent data not available. Add market rent estimates in the Unit Mix table to see value-add opportunities.
        </Typography>
      </Alert>
    );
  }

  const isOpportunity = annualUpside > 0;
  const isAboveMarket = annualUpside < 0;

  // Issue #12: UX redesign - Clean Card design matching Apple design system
  return (
    <Card
      elevation={0}
      sx={{
        mb: 3,
        borderLeft: isOpportunity
          ? `4px solid ${appleColors.success[500]}`
          : isAboveMarket
          ? `2px solid ${appleColors.warning[500]}`
          : `2px solid ${appleColors.blue[500]}`,
        border: isOpportunity
          ? `1px solid ${appleColors.success[200]}`
          : isAboveMarket
          ? `1px solid ${appleColors.warning[200]}`
          : `1px solid ${appleColors.blue[200]}`,
        backgroundColor: 'white'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header Row */}
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: isOpportunity
                ? appleColors.success[50]
                : isAboveMarket
                ? appleColors.warning[50]
                : appleColors.blue[50],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isOpportunity ? (
              <TrendingUpIcon sx={{
                color: appleColors.success[600],
                fontSize: 24
              }} />
            ) : isAboveMarket ? (
              <WarningAmberIcon sx={{
                color: appleColors.warning[600],
                fontSize: 24
              }} />
            ) : (
              <TrendingDownIcon sx={{
                color: appleColors.blue[600],
                fontSize: 24
              }} />
            )}
          </Box>
          <Typography
            variant="h6"
            fontWeight={600}
            color={isOpportunity ? appleColors.success[700] : isAboveMarket ? appleColors.warning[800] : appleColors.blue[700]}
            flex={1}
          >
            {isOpportunity ? 'Value-Add Opportunity' : isAboveMarket ? 'Above Market Pricing' : 'At Market Rate'}
          </Typography>
          <Chip
            label={`${Math.abs(upsidePercentage).toFixed(1)}%`}
            size="small"
            sx={{
              backgroundColor: isOpportunity
                ? appleColors.success[100]
                : isAboveMarket
                ? appleColors.warning[100]
                : appleColors.blue[100],
              color: isOpportunity
                ? appleColors.success[700]
                : isAboveMarket
                ? appleColors.warning[800]
                : appleColors.blue[700],
              fontWeight: 600,
              border: isOpportunity
                ? `1px solid ${appleColors.success[300]}`
                : isAboveMarket
                ? `1px solid ${appleColors.warning[300]}`
                : `1px solid ${appleColors.blue[300]}`
            }}
          />
        </Stack>

        {/* Main Metric */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mb={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Box flex={1}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isOpportunity ? 'Potential Annual Increase' : isAboveMarket ? 'Potential Annual Decrease' : 'Market Alignment'}
            </Typography>
            <Typography
              variant="h5"
              fontWeight={700}
              color={isOpportunity ? appleColors.success[700] : isAboveMarket ? appleColors.warning[800] : appleColors.blue[700]}
            >
              {isOpportunity ? '+' : isAboveMarket ? '-' : ''}{formatCurrency(Math.abs(annualUpside))}/year
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {isOpportunity && `Potential to increase rents by ${upsidePercentage.toFixed(1)}%`}
              {isAboveMarket && `Current rents are ${Math.abs(upsidePercentage).toFixed(1)}% above market`}
              {!isOpportunity && !isAboveMarket && 'Property is optimally priced at market rate'}
            </Typography>
          </Box>

          {/* Current → Market Comparison */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Current → Market
            </Typography>
            <Typography variant="body1" fontWeight={600} color="text.primary">
              {formatCurrency(currentAnnualRent)} → {formatCurrency(marketAnnualRent)}
            </Typography>
          </Box>
        </Stack>

        {/* Action/Risk Guidance */}
        <Box
          sx={{
            p: 2,
            backgroundColor: isOpportunity
              ? appleColors.success[50]
              : isAboveMarket
              ? appleColors.warning[50]
              : appleColors.blue[50],
            borderRadius: 2,
            border: isOpportunity
              ? `1px solid ${appleColors.success[100]}`
              : isAboveMarket
              ? `1px solid ${appleColors.warning[100]}`
              : `1px solid ${appleColors.blue[100]}`
          }}
        >
          <Typography variant="body2" color="text.primary">
            {isOpportunity && (
              <>
                <strong>Action:</strong> Raise rents to market rate on tenant turnover to capture additional revenue.
              </>
            )}
            {isAboveMarket && (
              <>
                <strong>Risk:</strong> Rents may decrease to market rates when units turn over, reducing annual income.
              </>
            )}
            {!isOpportunity && !isAboveMarket && (
              <>
                <strong>Action:</strong> Maintain current rent levels as property is optimally priced.
              </>
            )}
          </Typography>
          {isOpportunity && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              At 5% cap rate, this adds approximately {formatCurrency(annualUpside * 20)} to property value
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ValueAddOpportunityCard;
