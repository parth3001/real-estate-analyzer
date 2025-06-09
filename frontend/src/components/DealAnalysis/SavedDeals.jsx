import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  ButtonGroup,
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Home as HomeIcon, Apartment as ApartmentIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DealService } from '../../services/dealService';

const SavedDeals = () => {
  const [savedDeals, setSavedDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load deals from API/localStorage
  const loadDeals = async () => {
    setLoading(true);
    try {
      console.log("Loading deals from service");
      const savedDeals = await DealService.getAllDeals();
      console.log("Loaded deals:", savedDeals);
      setSavedDeals(savedDeals);
    } catch (error) {
      console.error('Error loading deals:', error);
      setError('Failed to load deals. ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle deal deletion
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      try {
        console.log("Deleting deal:", id);
        const success = await DealService.deleteDeal(id);
        
        if (success) {
          // Update local state after successful deletion
          setSavedDeals((prevDeals) => prevDeals.filter((deal) => deal.id !== id));
          setError('Deal deleted successfully');
        } else {
          throw new Error('Failed to delete deal');
        }
      } catch (error) {
        console.error('Error deleting deal:', error);
        setError('Failed to delete deal. ' + error.message);
      }
    }
  };

  // Handle edit deal
  const handleEdit = async (deal) => {
    try {
      console.log("Editing deal:", deal);
      // First, make sure we have the full deal data from the service
      const fullDeal = await DealService.getDealById(deal.id);
      
      if (!fullDeal) {
        throw new Error('Could not find deal');
      }
      
      console.log("Full deal data:", fullDeal);
      
      // Set this deal as current deal in the service
      await DealService.setCurrentDeal(fullDeal);
      
      // Navigate to the appropriate form based on property type
      if (fullDeal.type === 'SFR') {
        navigate('/sfr-analysis?id=' + fullDeal.id);
      } else if (fullDeal.type === 'MF') {
        navigate('/multi-family-analysis?id=' + fullDeal.id);
      } else {
        navigate('/deal-analysis?id=' + fullDeal.id);
      }
    } catch (error) {
      console.error('Error editing deal:', error);
      setError('Failed to edit deal. ' + error.message);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getDealType = (deal) => {
    if (deal.type) {
      return deal.type.toLowerCase();
    }
    if (deal.data && deal.data.unitTypes && Array.isArray(deal.data.unitTypes)) {
      return 'mf';
    }
    return 'sfr';
  };

  const getTotalUnits = (deal) => {
    if (getDealType(deal) === 'mf' && deal.data && deal.data.totalUnits) {
      return deal.data.totalUnits;
    }
    return 1; // Single-family is 1 unit
  };

  // Get monthly rent for either property type
  const getMonthlyRent = (deal) => {
    if (!deal.data) return 0;
    
    if (getDealType(deal) === 'mf') {
      // For multi-family, sum all unit rents
      if (deal.data.unitTypes && Array.isArray(deal.data.unitTypes)) {
        return deal.data.unitTypes.reduce((total, unit) => {
          return total + (unit.monthlyRent * unit.count || 0);
        }, 0);
      }
      return 0;
    } else {
      // For single-family
      return deal.data.monthlyRent || 0;
    }
  };

  const createNewDeal = (type) => {
    if (type === 'mf') {
      navigate('/analyze-multifamily');
    } else {
      navigate('/analyze');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading saved deals...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Saved Deals
        </Typography>
        <Paper sx={{ p: 3, bgcolor: 'error.light' }}>
          <Typography variant="h6" color="error.dark">
            Error: {error}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Saved Deals
      </Typography>
      
      {savedDeals.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No saved deals found
          </Typography>
          <ButtonGroup variant="contained" sx={{ mt: 2 }}>
            <Button
              startIcon={<HomeIcon />}
              onClick={() => createNewDeal('sfr')}
            >
              Create Single-Family Deal
            </Button>
            <Button
              startIcon={<ApartmentIcon />}
              onClick={() => createNewDeal('mf')}
            >
              Create Multi-Family Deal
            </Button>
          </ButtonGroup>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Property Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Units</TableCell>
                <TableCell>Purchase Price</TableCell>
                <TableCell>Down Payment</TableCell>
                <TableCell>Monthly Rent</TableCell>
                <TableCell>Date Saved</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {savedDeals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>{deal.name}</TableCell>
                  <TableCell>
                    <Chip 
                      icon={getDealType(deal) === 'mf' ? <ApartmentIcon /> : <HomeIcon />}
                      label={getDealType(deal) === 'mf' ? 'Multi-Family' : 'Single Family'} 
                      size="small" 
                      color={getDealType(deal) === 'mf' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{getTotalUnits(deal)}</TableCell>
                  <TableCell>{formatCurrency(deal.data?.purchasePrice || 0)}</TableCell>
                  <TableCell>{formatCurrency(deal.data?.downPayment || 0)}</TableCell>
                  <TableCell>{formatCurrency(getMonthlyRent(deal))}</TableCell>
                  <TableCell>{new Date(deal.savedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit Deal">
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(deal)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Deal">
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(deal.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default SavedDeals; 