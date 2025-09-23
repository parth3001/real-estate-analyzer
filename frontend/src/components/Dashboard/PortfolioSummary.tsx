import React, { useState, useEffect, memo } from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Chip,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  AccountBalance as PortfolioIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  HelpOutline as HelpOutlineIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AppleCard, AppleButton } from '../ui/AppleComponents';
import { portfolioApi } from '../../services/api';

interface PortfolioData {
  id: string;
  name: string;
  goal: string;
  propertyCount: number;
  totalValue: number;
  monthlyNetCashFlow: number;
  targetProgress: number;
}

const PortfolioSummary: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<PortfolioData[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalPortfolios: 0,
    totalProperties: 0,
    totalValue: 0,
    averageCashFlow: 0
  });

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      const response = await portfolioApi.getPortfolios();

      console.log('Portfolio API Response:', response);

      if (response.status === 200 && response.data) {
        console.log('Full portfolio response data:', response.data);

        // Handle different possible data structures
        let portfolioData: any[] = [];

        if (Array.isArray(response.data)) {
          // Direct array response
          portfolioData = response.data;
        } else if (response.data.portfolios && Array.isArray(response.data.portfolios)) {
          // Nested in portfolios array
          portfolioData = response.data.portfolios;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Nested in data array
          portfolioData = response.data.data;
        } else if (typeof response.data === 'object') {
          // Single portfolio object - convert to array
          portfolioData = [response.data];
        }

        console.log('Processed portfolio data (array):', portfolioData);
        setPortfolios(portfolioData);

        if (portfolioData.length > 0) {
          // Calculate totals safely
          const totalProperties = portfolioData.reduce((sum: number, p: any) => sum + (p.propertyCount || 0), 0);
          const totalValue = portfolioData.reduce((sum: number, p: any) => sum + (p.totalValue || 0), 0);
          const totalCashFlow = portfolioData.reduce((sum: number, p: any) => sum + (p.monthlyNetCashFlow || 0), 0);

          setTotalStats({
            totalPortfolios: portfolioData.length,
            totalProperties,
            totalValue,
            averageCashFlow: portfolioData.length > 0 ? totalCashFlow / portfolioData.length : 0
          });
        } else {
          setTotalStats({
            totalPortfolios: 0,
            totalProperties: 0,
            totalValue: 0,
            averageCashFlow: 0
          });
        }
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      // Set empty array on error to prevent crashes
      setPortfolios([]);
      setTotalStats({
        totalPortfolios: 0,
        totalProperties: 0,
        totalValue: 0,
        averageCashFlow: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${Math.round(amount).toLocaleString()}`;
  };

  const getPortfolioHealthColor = (portfolio: PortfolioData): string => {
    if (portfolio.propertyCount === 0) return 'grey';
    if (portfolio.monthlyNetCashFlow > 0) return 'success';
    if (portfolio.monthlyNetCashFlow === 0) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <AppleCard padding="large">
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          Portfolio Summary
        </Typography>
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
      </AppleCard>
    );
  }

  if (portfolios.length === 0) {
    return (
      <AppleCard padding="large">
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          Portfolio Summary
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <PortfolioIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            No portfolios created yet
          </Typography>
          <AppleButton
            variant="primary"
            onClick={() => navigate('/portfolio/create')}
          >
            Create Portfolio
          </AppleButton>
        </Box>
      </AppleCard>
    );
  }

  return (
    <AppleCard padding="large">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            Portfolio Summary
          </Typography>
          <Tooltip
            title="Overview of your investment portfolios including total value, cash flow performance, and goal progress tracking."
            placement="top"
            arrow
          >
            <HelpOutlineIcon sx={{ fontSize: 18, color: 'text.secondary', cursor: 'help' }} />
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={`${totalStats.totalPortfolios} portfolios`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${totalStats.totalProperties} properties`}
            size="small"
            color="primary"
          />
        </Box>
      </Box>

      {/* Total Stats */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 2,
        mb: 3,
        p: 2,
        backgroundColor: 'grey.50',
        borderRadius: 2
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={600} color="primary.main">
            {formatCurrency(totalStats.totalValue)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total Portfolio Value
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h6"
            fontWeight={600}
            color={totalStats.averageCashFlow >= 0 ? 'success.main' : 'error.main'}
          >
            {totalStats.averageCashFlow >= 0 ? '+' : ''}{formatCurrency(totalStats.averageCashFlow)}/mo
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Average Cash Flow
          </Typography>
        </Box>
      </Box>

      {/* Individual Portfolios */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Array.isArray(portfolios) && portfolios.length > 0 && portfolios.map((portfolio) => {
          const healthColor = getPortfolioHealthColor(portfolio);
          const HealthIcon = portfolio.propertyCount === 0 ? WarningIcon :
                            portfolio.monthlyNetCashFlow >= 0 ? CheckCircleIcon : WarningIcon;

          return (
            <Box
              key={portfolio.id || (portfolio as any)._id}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: 'grey.50',
                  borderColor: 'primary.main'
                }
              }}
              onClick={() => navigate(`/portfolio/${portfolio.id}`)}
            >
              {/* Portfolio Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HealthIcon sx={{ fontSize: 20, color: `${healthColor}.main` }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    {portfolio.name}
                  </Typography>
                </Box>
                <Chip
                  label={portfolio.goal}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              </Box>

              {/* Portfolio Metrics */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {portfolio.propertyCount} properties • {formatCurrency(portfolio.totalValue)}
                </Typography>
                <Typography
                  variant="caption"
                  color={portfolio.monthlyNetCashFlow >= 0 ? 'success.main' : 'error.main'}
                  fontWeight={600}
                >
                  {portfolio.monthlyNetCashFlow >= 0 ? '+' : ''}{formatCurrency(portfolio.monthlyNetCashFlow)}/mo
                </Typography>
              </Box>

              {/* Progress Bar (if target progress available) */}
              {portfolio.targetProgress !== undefined && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Goal Progress
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {Math.round(portfolio.targetProgress)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(portfolio.targetProgress, 100)}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: portfolio.targetProgress >= 80 ? 'success.main' :
                                      portfolio.targetProgress >= 50 ? 'warning.main' : 'error.main',
                        borderRadius: 3
                      }
                    }}
                  />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Action Button */}
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <AppleButton
          variant="ghost"
          onClick={() => navigate('/portfolio')}
          icon={<TrendingUpIcon />}
        >
          View All Portfolios
        </AppleButton>
      </Box>
    </AppleCard>
  );
};

export default memo(PortfolioSummary);