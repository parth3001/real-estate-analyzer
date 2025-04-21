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
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
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
    localStorage.setItem('currentDeal', JSON.stringify(deal.data));
    navigate('/analyze');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => navigate('/analyze')}
          >
            Create New Deal
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Property Name</TableCell>
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
                  <TableCell>{formatCurrency(deal.data.purchasePrice || 0)}</TableCell>
                  <TableCell>{formatCurrency(deal.data.downPayment || 0)}</TableCell>
                  <TableCell>{formatCurrency(deal.data.monthlyRent || 0)}</TableCell>
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