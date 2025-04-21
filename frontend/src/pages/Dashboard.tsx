import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import DeleteIcon from '@mui/icons-material/Delete';
import { SxProps } from '@mui/system';
import { GridProps } from '@mui/material/Grid';

interface DealData {
  purchasePrice: number;
  monthlyRent: number;
  downPayment: number;
  analysisResult?: any;
}

interface Deal {
  name: string;
  data: DealData;
  savedAt: string;
}

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [savedDeals, setSavedDeals] = useState<Deal[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);

  useEffect(() => {
    try {
      const deals = JSON.parse(localStorage.getItem('savedDeals') || '[]') as Deal[];
      console.log('Loading saved deals:', deals);
      setSavedDeals(deals.sort((a, b) => 
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading saved deals:', error);
      setSavedDeals([]);
    }
  }, []);

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
      
      setSavedDeals(updatedDeals);
    }
    setDeleteDialogOpen(false);
    setDealToDelete(null);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
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
                    onClick={() => {
                      localStorage.setItem('currentDeal', JSON.stringify(deal));
                      navigate('/analyze');
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {deal.name || 'Unnamed Deal'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Analyzed on {new Date(deal.savedAt).toLocaleDateString()}
                        </Typography>
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
                          Monthly Rent: {formatCurrency(deal.data.monthlyRent)}
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