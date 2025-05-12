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
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Home as HomeIcon, Apartment as ApartmentIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SavedDeals = () => {
  const [savedDeals, setSavedDeals] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const deals = JSON.parse(localStorage.getItem('savedDeals') || '[]');
    setSavedDeals(deals);
  }, []);

  const handleDelete = (index) => {
    const updatedDeals = savedDeals.filter((_, i) => i !== index);
    localStorage.setItem('savedDeals', JSON.stringify(updatedDeals));
    setSavedDeals(updatedDeals);
  };

  const handleEdit = (deal) => {
    // Determine if this is a multi-family deal by checking for unit types
    const isMultiFamilyDeal = deal.data.unitTypes && Array.isArray(deal.data.unitTypes);
    
    if (isMultiFamilyDeal) {
      localStorage.setItem('currentMultiFamilyDeal', JSON.stringify({
        name: deal.name,
        data: deal.data
      }));
      navigate('/analyze-multifamily');
    } else {
      localStorage.setItem('currentDeal', JSON.stringify(deal));
      navigate('/analyze');
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
    if (deal.data.unitTypes && Array.isArray(deal.data.unitTypes)) {
      return 'multifamily';
    }
    return 'sfr';
  };

  const getTotalUnits = (deal) => {
    if (getDealType(deal) === 'multifamily' && deal.data.totalUnits) {
      return deal.data.totalUnits;
    }
    return 1; // Single-family is 1 unit
  };

  // Get monthly rent for either property type
  const getMonthlyRent = (deal) => {
    if (getDealType(deal) === 'multifamily') {
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
    if (type === 'multifamily') {
      navigate('/analyze-multifamily');
    } else {
      navigate('/analyze');
    }
  };

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
              onClick={() => createNewDeal('multifamily')}
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
              {savedDeals.map((deal, index) => (
                <TableRow key={index}>
                  <TableCell>{deal.name}</TableCell>
                  <TableCell>
                    <Chip 
                      icon={getDealType(deal) === 'multifamily' ? <ApartmentIcon /> : <HomeIcon />}
                      label={getDealType(deal) === 'multifamily' ? 'Multi-Family' : 'Single Family'} 
                      size="small" 
                      color={getDealType(deal) === 'multifamily' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{getTotalUnits(deal)}</TableCell>
                  <TableCell>{formatCurrency(deal.data.purchasePrice || 0)}</TableCell>
                  <TableCell>{formatCurrency(deal.data.downPayment || 0)}</TableCell>
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
                        onClick={() => handleDelete(index)}
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