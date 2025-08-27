import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp,
  TrendingDown,
  MoreVert as MoreVertIcon,
  AccountBalance,
  Assessment,
  PieChart
} from '@mui/icons-material';
import { AppleCard } from '../ui/AppleComponents';
import { appleColors } from '../../theme/appleDesignSystem';
import { portfolioApi } from '../../services/api';
import type { PortfolioSummary } from '../../types/portfolio';

interface PortfolioListProps {
  onCreatePortfolio: () => void;
  onViewPortfolio: (portfolioId: string) => void;
}

export const PortfolioList: React.FC<PortfolioListProps> = ({
  onCreatePortfolio,
  onViewPortfolio
}) => {
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);

  // Load portfolios on component mount
  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await portfolioApi.getPortfolios();
      
      if (response.data.success) {
        setPortfolios(response.data.portfolios);
      } else {
        setError('Failed to load portfolios');
      }
    } catch (err: any) {
      console.error('Error loading portfolios:', err);
      setError(err.response?.data?.error || 'Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, portfolioId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedPortfolio(portfolioId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedPortfolio(null);
  };

  const handleArchivePortfolio = async () => {
    if (!selectedPortfolio) return;
    
    try {
      await portfolioApi.archivePortfolio(selectedPortfolio);
      await loadPortfolios(); // Refresh the list
      handleMenuClose();
    } catch (err: any) {
      console.error('Error archiving portfolio:', err);
      setError(err.response?.data?.error || 'Failed to archive portfolio');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getGoalColor = (goal: string) => {
    switch (goal) {
      case 'CASH_FLOW':
        return appleColors.green[600];
      case 'WEALTH_BUILDING':
        return appleColors.blue[600];
      case 'ESTATE_BUILDING':
        return appleColors.purple[600];
      case 'INFLATION_HEDGE':
        return appleColors.orange[600];
      default:
        return appleColors.gray[600];
    }
  };

  const getGoalLabel = (goal: string) => {
    switch (goal) {
      case 'CASH_FLOW':
        return 'Cash Flow';
      case 'WEALTH_BUILDING':
        return 'Wealth Building';
      case 'ESTATE_BUILDING':
        return 'Estate Building';
      case 'INFLATION_HEDGE':
        return 'Inflation Hedge';
      case 'DIVERSIFICATION':
        return 'Diversification';
      case 'REIT_ALTERNATIVE':
        return 'REIT Alternative';
      case 'OPPORTUNISTIC':
        return 'Opportunistic';
      default:
        return goal;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'CONSERVATIVE':
        return appleColors.green[500];
      case 'MODERATE':
        return appleColors.orange[500];
      case 'AGGRESSIVE':
        return appleColors.red[500];
      default:
        return appleColors.gray[500];
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={60} sx={{ color: appleColors.blue[600] }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: appleColors.gray[900],
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            My Portfolios
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreatePortfolio}
            sx={{
              backgroundColor: appleColors.blue[600],
              color: 'white',
              fontWeight: 600,
              px: 3,
              py: 1.5,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: appleColors.blue[700],
              }
            }}
          >
            Create Portfolio
          </Button>
        </Box>

        <Typography
          variant="h6"
          sx={{
            color: appleColors.gray[600],
            fontWeight: 400,
            mb: 3
          }}
        >
          Track and optimize your real estate investment performance
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Portfolio Grid */}
      {portfolios.length === 0 ? (
        <AppleCard padding="large">
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AccountBalance 
              sx={{ 
                fontSize: 80, 
                color: appleColors.gray[400], 
                mb: 3 
              }} 
            />
            
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: appleColors.gray[700],
                mb: 2
              }}
            >
              No Portfolios Yet
            </Typography>
            
            <Typography
              variant="body1"
              sx={{
                color: appleColors.gray[600],
                mb: 4,
                maxWidth: 400,
                mx: 'auto'
              }}
            >
              Create your first portfolio to start tracking your real estate investments and get professional insights.
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={onCreatePortfolio}
              sx={{
                backgroundColor: appleColors.blue[600],
                color: 'white',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: appleColors.blue[700],
                }
              }}
            >
              Create Your First Portfolio
            </Button>
          </Box>
        </AppleCard>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            md: 'repeat(2, 1fr)', 
            lg: 'repeat(3, 1fr)' 
          }, 
          gap: 3 
        }}>
          {portfolios.map((portfolio) => (
            <Box key={portfolio.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                  border: `1px solid ${appleColors.gray[200]}`,
                  transition: 'all 0.2s ease-in-out',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  }
                }}
                onClick={() => onViewPortfolio(portfolio.id)}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header with menu */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: appleColors.gray[900],
                          mb: 1,
                          lineHeight: 1.3
                        }}
                      >
                        {portfolio.name}
                      </Typography>
                      
                      {portfolio.description && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: appleColors.gray[600],
                            mb: 2,
                            lineHeight: 1.4
                          }}
                        >
                          {portfolio.description}
                        </Typography>
                      )}
                    </Box>
                    
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, portfolio.id);
                      }}
                      sx={{ ml: 1 }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  {/* Goal and Risk Chips */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    <Chip
                      label={getGoalLabel(portfolio.primaryGoal)}
                      size="small"
                      sx={{
                        backgroundColor: getGoalColor(portfolio.primaryGoal) + '20',
                        color: getGoalColor(portfolio.primaryGoal),
                        fontWeight: 600,
                        border: `1px solid ${getGoalColor(portfolio.primaryGoal)}40`
                      }}
                    />
                    <Chip
                      label={portfolio.riskTolerance}
                      size="small"
                      sx={{
                        backgroundColor: getRiskColor(portfolio.riskTolerance) + '20',
                        color: getRiskColor(portfolio.riskTolerance),
                        fontWeight: 600,
                        border: `1px solid ${getRiskColor(portfolio.riskTolerance)}40`
                      }}
                    />
                  </Box>

                  {/* Metrics */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            color: appleColors.gray[900],
                            mb: 0.5
                          }}
                        >
                          {portfolio.totalProperties}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: appleColors.gray[600],
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            fontWeight: 600
                          }}
                        >
                          Properties
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 700,
                              color: portfolio.monthlyNetCashFlow >= 0 ? appleColors.green[600] : appleColors.red[600],
                              mr: 0.5
                            }}
                          >
                            {formatCurrency(portfolio.monthlyNetCashFlow)}
                          </Typography>
                          {portfolio.monthlyNetCashFlow >= 0 ? (
                            <TrendingUp sx={{ color: appleColors.green[600], fontSize: 20 }} />
                          ) : (
                            <TrendingDown sx={{ color: appleColors.red[600], fontSize: 20 }} />
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: appleColors.gray[600],
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            fontWeight: 600
                          }}
                        >
                          Monthly Cash Flow
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Total Value */}
                  {portfolio.totalValue > 0 && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${appleColors.gray[200]}` }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: appleColors.gray[600],
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            fontWeight: 600,
                            mb: 0.5
                          }}
                        >
                          Total Portfolio Value
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: appleColors.gray[900]
                          }}
                        >
                          {formatCurrency(portfolio.totalValue)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ px: 3, pb: 3, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{
                      borderColor: appleColors.blue[600],
                      color: appleColors.blue[600],
                      fontWeight: 600,
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: appleColors.blue[50],
                        borderColor: appleColors.blue[700],
                      }
                    }}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add portfolio"
        onClick={onCreatePortfolio}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          backgroundColor: appleColors.blue[600],
          '&:hover': {
            backgroundColor: appleColors.blue[700],
          },
          display: { xs: 'flex', md: 'none' }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Portfolio Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              minWidth: 160,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }
          }
        }}
      >
        <MenuItem 
          onClick={() => {
            if (selectedPortfolio) onViewPortfolio(selectedPortfolio);
            handleMenuClose();
          }}
        >
          <Assessment sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleArchivePortfolio}>
          <PieChart sx={{ mr: 1 }} />
          Archive Portfolio
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default PortfolioList;