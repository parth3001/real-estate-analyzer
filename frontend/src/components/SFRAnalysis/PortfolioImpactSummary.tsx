import React from 'react';
import {
  Box,
  Typography,
  Card,
  Alert,
  Stack,
  Chip
} from '@mui/material';
import Grid from '@mui/system/Grid';
import {
  Folder,
  TrendingUp,
  AttachMoney,
  Assessment
} from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';

interface PortfolioImpactSummaryProps {
  portfolioId: string | null;
  portfolioName?: string;
  portfolioGoal?: string;
  currentProperties?: number;
  monthlyNetCashFlow?: number;
  projectedImpact?: {
    cashFlowIncrease: number;
    diversificationImprovement: string;
    goalProgress: string;
  };
}

export const PortfolioImpactSummary: React.FC<PortfolioImpactSummaryProps> = ({
  portfolioId,
  portfolioName,
  portfolioGoal,
  currentProperties = 0,
  monthlyNetCashFlow = 0,
  projectedImpact
}) => {
  // Don't render if no portfolio context
  if (!portfolioId) {
    return null;
  }

  return (
    <Card sx={{ 
      p: 3, 
      borderRadius: '16px',
      border: `1px solid ${appleColors.blue[200]}`,
      backgroundColor: appleColors.blue[25],
      mb: 3
    }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Folder sx={{ color: appleColors.blue[600] }} />
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            color: appleColors.gray[900],
            flex: 1
          }}
        >
          Portfolio Impact Analysis
        </Typography>
        <Chip 
          label="Portfolio Context"
          color="info"
          size="small"
        />
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ 
            p: 2, 
            backgroundColor: 'white', 
            borderRadius: '12px',
            border: `1px solid ${appleColors.gray[200]}`
          }}>
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                Target Portfolio
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {portfolioName}
              </Typography>
              <Typography variant="body2">
                {portfolioGoal?.replace('_', ' ')} • {currentProperties} properties
              </Typography>
            </Stack>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ 
            p: 2, 
            backgroundColor: 'white', 
            borderRadius: '12px',
            border: `1px solid ${appleColors.gray[200]}`
          }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <AttachMoney sx={{ fontSize: 20, color: appleColors.green[600] }} />
              <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                Current Cash Flow
              </Typography>
            </Stack>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              color: monthlyNetCashFlow >= 0 ? appleColors.green[700] : appleColors.red[700]
            }}>
              ${Math.round(monthlyNetCashFlow).toLocaleString()}/mo
            </Typography>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ 
            p: 2, 
            backgroundColor: 'white', 
            borderRadius: '12px',
            border: `1px solid ${appleColors.gray[200]}`
          }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <TrendingUp sx={{ fontSize: 20, color: appleColors.blue[600] }} />
              <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                Projected Impact
              </Typography>
            </Stack>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              color: (projectedImpact?.cashFlowIncrease || 0) >= 0 ? appleColors.green[700] : appleColors.red[700]
            }}>
              {projectedImpact?.cashFlowIncrease !== undefined 
                ? `${(projectedImpact.cashFlowIncrease >= 0 ? '+' : '')}$${Math.round(projectedImpact.cashFlowIncrease).toLocaleString()}/mo`
                : 'Analyzing...'
              }
            </Typography>
          </Box>
        </Grid>

        {projectedImpact && (
          <Grid size={{ xs: 12 }}>
            <Alert 
              severity="info"
              sx={{ 
                backgroundColor: appleColors.blue[50],
                border: `1px solid ${appleColors.blue[200]}`,
                borderRadius: '12px'
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                Strategic Portfolio Fit
              </Typography>
              <Typography variant="body2">
                {projectedImpact.diversificationImprovement} {projectedImpact.goalProgress}
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Card>
  );
};

export default PortfolioImpactSummary;