import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  useTheme,
  Button,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import DeleteIcon from '@mui/icons-material/Delete';
import { SxProps } from '@mui/system';
import { GridProps } from '@mui/material/Grid';

// Add this flag outside the component to ensure it persists between renders
let hasLoadedDeals = false;

interface DealData {
  purchasePrice: number;
  monthlyRent: number;
  downPayment: number;
  unitTypes?: Array<{
    type?: string;
    count?: number;
    monthlyRent?: number;
    sqft?: number;
  }>;
  analysisResult?: {
    aiInsights?: {
      investmentScore?: number;
      summary?: string;
      strengths?: string[];
      weaknesses?: string[];
      recommendations?: string[];
    };
    aiAnalysis?: {
      investmentScore?: number;
      summary?: string;
      strengths?: string[];
      weaknesses?: string[];
      recommendations?: string[];
      unitMixAnalysis?: string;
      marketPositionAnalysis?: string;
      valueAddOpportunities?: string[];
      recommendedHoldPeriod?: string;
    };
  };
}

interface Deal {
  name: string;
  data: DealData;
  savedAt: string;
}

const Dashboard = () => {
  console.log('Dashboard component rendering!', hasLoadedDeals);
  const theme = useTheme();
  const navigate = useNavigate();
  const [savedDeals, setSavedDeals] = useState<Deal[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const effectRan = useRef(false);

  // Clear any potentially interfering localStorage items - only run once
  useEffect(() => {
    console.log('Dashboard cleanup effect');
    localStorage.removeItem('currentDeal');
  }, []);

  // Safe state setter that won't trigger infinite loops
  const setSavedDealsIfChanged = useCallback((deals: Deal[]) => {
    console.log('setSavedDealsIfChanged called');
    setSavedDeals(prevDeals => {
      // Only update if the data actually changed
      if (JSON.stringify(prevDeals) !== JSON.stringify(deals)) {
        console.log('Updating savedDeals state');
        return deals;
      }
      console.log('Deals unchanged, skipping update');
      return prevDeals;
    });
  }, []);

  // Modified useEffect with static flag
  useEffect(() => {
    console.log('Dashboard main useEffect running, effectRan:', effectRan.current, 'hasLoadedDeals:', hasLoadedDeals);
    
    // Only run this effect once using static flag
    if (!hasLoadedDeals) {
      console.log('Loading deals from localStorage - first time only');
      loadSavedDeals();
      hasLoadedDeals = true;
      effectRan.current = true;
    }
  }, [setSavedDealsIfChanged]);

  const loadSavedDeals = () => {
    try {
      console.log('loadSavedDeals function called');
      let deals: Deal[] = [];
      const savedDealsStr = localStorage.getItem('savedDeals');
      console.log('Raw localStorage data:', savedDealsStr);
      
      if (savedDealsStr) {
        deals = JSON.parse(savedDealsStr) as Deal[];
      } else {
        console.log('No saved deals found in localStorage');
        deals = [];
      }
      
      console.log('Loaded deals:', deals);
      // Use the safe setter
      setSavedDealsIfChanged(deals.sort((a, b) => 
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading saved deals:', error);
      setError('Error loading saved deals. Local storage may be corrupted.');
      setSavedDealsIfChanged([]);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, deal: Deal) => {
    e.stopPropagation(); // Prevent card click event
    setDealToDelete(deal);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (dealToDelete) {
      console.log('Deleting deal:', dealToDelete.name);
      console.log('Current deals before deletion:', savedDeals);
      
      const updatedDeals = savedDeals.filter(deal => deal !== dealToDelete);
      console.log('Updated deals after deletion:', updatedDeals);
      
      localStorage.setItem('savedDeals', JSON.stringify(updatedDeals));
      
      // Verify the update in localStorage
      const verifyDeals = JSON.parse(localStorage.getItem('savedDeals') || '[]');
      console.log('Verified deals in localStorage:', verifyDeals);
      
      setSavedDealsIfChanged(updatedDeals);
    }
    setDeleteDialogOpen(false);
    setDealToDelete(null);
  };

  const handleViewDeal = (deal: Deal) => {
    console.log('Viewing deal:', deal.name);
    
    // Determine if this is a multi-family deal by checking for unit types
    const isMultiFamilyDeal = deal.data.unitTypes && Array.isArray(deal.data.unitTypes);
    
    if (isMultiFamilyDeal) {
      localStorage.setItem('currentMultiFamilyDeal', JSON.stringify(deal));
      navigate('/analyze-multifamily');
    } else {
      localStorage.setItem('currentDeal', JSON.stringify(deal));
      navigate('/analyze');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Get monthly rent for either property type
  const getMonthlyRent = (deal: Deal): number => {
    // For multi-family, sum all unit rents
    if (deal.data.unitTypes && Array.isArray(deal.data.unitTypes)) {
      return deal.data.unitTypes.reduce((total, unit) => {
        const rent = typeof unit.monthlyRent === 'number' ? unit.monthlyRent : 0;
        const count = typeof unit.count === 'number' ? unit.count : 0;
        return total + (rent * count);
      }, 0);
    } 
    // For single-family
    return deal.data.monthlyRent || 0;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.info.main;
    if (score >= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const cardStyle = {
    height: '100%',
    background: `linear-gradient(145deg, ${theme.palette.grey[50]} 0%, ${theme.palette.grey[100]} 100%)`,
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[2],
    },
  };

  const iconStyle = {
    fontSize: '2rem',
    color: theme.palette.primary.main,
    mr: 2,
  };

  // Re-render prevention check
  console.log('Dashboard rendering UI with deals:', savedDeals.length);

  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.background.default, minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ color: theme.palette.text.primary }}>
          Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/analyze')}
          sx={{ px: 3, py: 1 }}
        >
          New Analysis
        </Button>
      </Box>

      {error && (
        <Box sx={{ 
          mb: 3, 
          p: 2, 
          bgcolor: theme.palette.error.light,
          color: theme.palette.error.dark,
          borderRadius: 1,
        }}>
          <Typography variant="body1">{error}</Typography>
          <Button 
            sx={{ mt: 1 }} 
            size="small" 
            variant="outlined" 
            color="error"
            onClick={() => {
              localStorage.setItem('savedDeals', JSON.stringify([]));
              setError(null);
              setSavedDealsIfChanged([]);
            }}
          >
            Reset Saved Deals
          </Button>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
            <Card sx={cardStyle}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AccountBalanceIcon sx={iconStyle} />
                  <Typography variant="h6" sx={{ color: 'inherit' }}>Total Deals</Typography>
                </Box>
                <Typography variant="h3" sx={{ color: 'inherit' }}>{savedDeals.length}</Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
            <Card sx={{
              ...cardStyle,
              borderLeft: `4px solid ${theme.palette.secondary.main}`,
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <TrendingUpIcon sx={{ ...iconStyle, color: theme.palette.secondary.main }} />
                  <Typography variant="h6" sx={{ color: 'inherit' }}>Active Analysis</Typography>
                </Box>
                <Typography variant="h3" sx={{ color: 'inherit' }}>
                  {savedDeals.filter(deal => deal.data?.analysisResult).length}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
            <Card sx={{
              ...cardStyle,
              borderLeft: `4px solid ${theme.palette.info.main}`,
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <HomeWorkIcon sx={{ ...iconStyle, color: theme.palette.info.main }} />
                  <Typography variant="h6" sx={{ color: 'inherit' }}>Properties</Typography>
                </Box>
                <Typography variant="h3" sx={{ color: 'inherit' }}>{savedDeals.length}</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Paper sx={{ 
          p: 3,
          backgroundColor: 'white',
          borderLeft: `4px solid ${theme.palette.grey[300]}`,
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
            Recent Analyses
          </Typography>
          
          {savedDeals.length === 0 ? (
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
              No recent analyses to display.
            </Typography>
          ) : (
            <Stack direction="row" spacing={3} useFlexGap flexWrap="wrap" sx={{ width: '100%' }}>
              {savedDeals.map((deal, index) => (
                <Box key={index} sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                  <Card 
                    sx={{ 
                      p: 2,
                      cursor: 'pointer',
                      width: '100%',
                      '&:hover': {
                        boxShadow: theme.shadows[4],
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => handleViewDeal(deal)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {deal.name || 'Unnamed Deal'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Analyzed on {new Date(deal.savedAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        {(deal.data?.analysisResult?.aiInsights?.investmentScore !== undefined || 
                          deal.data?.analysisResult?.aiAnalysis?.investmentScore !== undefined) && (
                          <Tooltip title={`Investment Score: ${
                            deal.data.analysisResult.aiInsights?.investmentScore || 
                            deal.data.analysisResult.aiAnalysis?.investmentScore
                          }/100`}>
                            <Box sx={{ 
                              ml: 1,
                              width: 40, 
                              height: 40, 
                              borderRadius: '50%', 
                              bgcolor: 'background.paper',
                              border: '2px solid',
                              borderColor: getScoreColor(
                                deal.data.analysisResult.aiInsights?.investmentScore || 
                                deal.data.analysisResult.aiAnalysis?.investmentScore || 0
                              ),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Typography variant="body2" fontWeight="bold">
                                {deal.data.analysisResult.aiInsights?.investmentScore || 
                                  deal.data.analysisResult.aiAnalysis?.investmentScore}
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                      </Box>
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleDeleteClick(e, deal)}
                        sx={{ 
                          color: theme.palette.error.main,
                          '&:hover': { 
                            backgroundColor: theme.palette.error.light,
                            color: theme.palette.error.dark,
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    {deal.data && (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Purchase Price: {formatCurrency(deal.data.purchasePrice)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Monthly Rent: {formatCurrency(getMonthlyRent(deal))}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Down Payment: {formatCurrency(deal.data.downPayment)}
                        </Typography>
                      </>
                    )}
                  </Card>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Deal</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this deal? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 