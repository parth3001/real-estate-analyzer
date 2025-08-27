import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import {
  Timeline,
  LocationOn,
  AttachMoney,
  Home
} from '@mui/icons-material';
import type { GoalPathInsights } from '../../services/portfolioAIApi';

interface GoalPathCardProps {
  insights: GoalPathInsights;
}

const GoalPathCard: React.FC<GoalPathCardProps> = ({ insights }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Properties Needed Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Home sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ ml: 1, fontWeight: 'medium' }}>
              Properties Needed
            </Typography>
            <Chip
              label={`${insights.propertiesNeeded.count} more`}
              color="primary"
              size="small"
              sx={{ ml: 'auto' }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="medium">
                Count
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatNumber(insights.propertiesNeeded.count)}
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="medium">
                Avg. Price
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(insights.propertiesNeeded.avgPrice)}
              </Typography>
            </Box>
          </Box>
          
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight="medium">
              Recommended Types
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {insights.propertiesNeeded.types.map((type, index) => (
                <Chip
                  key={index}
                  label={type}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Target Locations Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LocationOn sx={{ color: 'secondary.main' }} />
            <Typography variant="h6" sx={{ ml: 1, fontWeight: 'medium' }}>
              Target Locations
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="medium">
                Primary Market
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {insights.targetLocations.primary}
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="medium">
                Secondary Market
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {insights.targetLocations.secondary}
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            <strong>Strategy:</strong> {insights.targetLocations.reasoning}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Capital Required Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AttachMoney sx={{ color: 'success.main' }} />
            <Typography variant="h6" sx={{ ml: 1, fontWeight: 'medium' }}>
              Capital Required
            </Typography>
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Investment
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(insights.capitalRequired.totalInvestment)}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="caption" color="text.secondary">
                Down Payments
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(insights.capitalRequired.downPayments)}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="caption" color="text.secondary">
                Reserves
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(insights.capitalRequired.reserves)}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="caption" color="text.secondary">
                Closing Costs
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(insights.capitalRequired.closingCosts)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Timeline Section */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Timeline sx={{ color: 'warning.main' }} />
            <Typography variant="h6" sx={{ ml: 1, fontWeight: 'medium' }}>
              Next Steps Timeline
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 1, borderLeft: 4, borderLeftColor: 'warning.main' }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Year 1 Focus
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {insights.timeline.year1}
              </Typography>
            </Box>
            
            <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1, borderLeft: 4, borderLeftColor: 'info.main' }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Year 2 Focus
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {insights.timeline.year2}
              </Typography>
            </Box>
            
            <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 1, borderLeft: 4, borderLeftColor: 'success.main' }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Year 3 Focus
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {insights.timeline.year3}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight="medium">
              💡 These are near-term milestones building toward your longer-term investment goals
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GoalPathCard;