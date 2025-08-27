import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  Alert,
  Stack
} from '@mui/material';
import {
  Warning,
  TrendingUp,
  Assignment,
  CheckCircle,
  Error,
  InfoOutlined
} from '@mui/icons-material';
import type { HealthCheckInsights } from '../../services/portfolioAIApi';

interface HealthCheckCardProps {
  insights: HealthCheckInsights;
}

const HealthCheckCard: React.FC<HealthCheckCardProps> = ({ insights }) => {
  const getSeverityMuiColor = (severity: 'HIGH' | 'MEDIUM' | 'LOW'): 'error' | 'warning' | 'success' | 'info' => {
    switch (severity) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'info';
    }
  };

  const getSeverityMuiIcon = (severity: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (severity) {
      case 'HIGH': return <Error />;
      case 'MEDIUM': return <Warning />;
      case 'LOW': return <CheckCircle />;
      default: return <InfoOutlined />;
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        borderLeft: 4,
        borderLeftColor: getSeverityMuiColor(insights.biggestRisk.severity) + '.main'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Biggest Risk Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {getSeverityMuiIcon(insights.biggestRisk.severity)}
            <Typography variant="h6" sx={{ ml: 1, fontWeight: 'medium' }}>
              Biggest Risk
            </Typography>
            <Chip
              label={insights.biggestRisk.severity}
              color={getSeverityMuiColor(insights.biggestRisk.severity)}
              size="small"
              sx={{ ml: 'auto' }}
            />
          </Box>
          
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            {insights.biggestRisk.title}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {insights.biggestRisk.description}
          </Typography>
          
          <Alert 
            severity={getSeverityMuiColor(insights.biggestRisk.severity)} 
            sx={{ mb: 0 }}
            variant="outlined"
          >
            <Typography variant="body2">
              <strong>Impact:</strong> {insights.biggestRisk.impact}
            </Typography>
          </Alert>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Best Opportunity Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TrendingUp sx={{ color: 'success.main' }} />
            <Typography variant="h6" sx={{ ml: 1, fontWeight: 'medium' }}>
              Best Opportunity
            </Typography>
          </Box>
          
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            {insights.bestOpportunity.title}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {insights.bestOpportunity.description}
          </Typography>
          
          <Stack spacing={1}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight="medium">
                Potential Impact
              </Typography>
              <Typography variant="body2">
                {insights.bestOpportunity.potentialImpact}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight="medium">
                Timeframe
              </Typography>
              <Typography variant="body2">
                {insights.bestOpportunity.timeframe}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Action This Month Section */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Assignment sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ ml: 1, fontWeight: 'medium' }}>
              Action This Month
            </Typography>
          </Box>
          
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            {insights.actionThisMonth.action}
          </Typography>
          
          <Stack spacing={1}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight="medium">
                Why This Matters
              </Typography>
              <Typography variant="body2">
                {insights.actionThisMonth.why}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight="medium">
                Expected Result
              </Typography>
              <Typography variant="body2" color="success.main" fontWeight="medium">
                {insights.actionThisMonth.expectedResult}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HealthCheckCard;