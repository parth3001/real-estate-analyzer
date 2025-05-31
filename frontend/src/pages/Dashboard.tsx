import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Tooltip,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AddIcon from '@mui/icons-material/Add';

interface Deal {
  name: string;
  type: 'sfr' | 'multifamily';
  data: {
    propertyAddress?: {
      street?: string;
      city?: string;
      state?: string;
    };
    purchasePrice?: number;
    downPayment?: number;
    monthlyRent?: number;
    totalUnits?: number;
    unitTypes?: Array<{
      monthlyRent: number;
      count: number;
    }>;
    analysisResult?: {
      capRate?: number;
      cashOnCashReturn?: number;
      noi?: number;
    };
  };
  savedAt: string;
}

const Dashboard: React.FC = () => {
  const [savedDeals, setSavedDeals] = useState<Deal[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadSavedDeals();
  }, []);

  const loadSavedDeals = () => {
    try {
      const dealsStr = localStorage.getItem('savedDeals');
      if (dealsStr) {
        const deals = JSON.parse(dealsStr);
        setSavedDeals(deals.sort((a: Deal, b: Deal) => 
          new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading deals:', error);
    }
  };

  const handleDelete = (index: number) => {
    const updatedDeals = savedDeals.filter((_, i) => i !== index);
    localStorage.setItem('savedDeals', JSON.stringify(updatedDeals));
    setSavedDeals(updatedDeals);
  };

  const handleEdit = (deal: Deal) => {
    if (deal.type === 'multifamily') {
      localStorage.setItem('currentMultiFamilyDeal', JSON.stringify(deal));
      navigate('/analyze-multifamily');
    } else {
      localStorage.setItem('currentDeal', JSON.stringify(deal));
      navigate('/analyze');
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value?: number) => {
    if (!value && value !== 0) return '-';
    return `${value.toFixed(2)}%`;
  };

  const getMonthlyRent = (deal: Deal) => {
    if (deal.type === 'multifamily' && deal.data.unitTypes) {
      return deal.data.unitTypes.reduce((total, unit) => 
        total + (unit.monthlyRent * unit.count), 0);
    }
    return deal.data.monthlyRent || 0;
  };

  const getPropertyIdentifier = (deal: Deal) => {
    if (deal.type === 'multifamily') {
      return deal.name;
    }
    const address = deal.data.propertyAddress;
    if (address) {
      return `${address.street || ''}, ${address.city || ''}, ${address.state || ''}`.trim();
    }
    return deal.name;
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            Property Analysis Dashboard
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/analyze')}
            >
              New SFR Analysis
            </Button>
            <Button
              variant="contained"
              startIcon={<ApartmentIcon />}
              onClick={() => navigate('/analyze-multifamily')}
            >
              New MF Analysis
            </Button>
          </Stack>
        </Stack>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Property</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Units</TableCell>
                <TableCell align="right">Purchase Price</TableCell>
                <TableCell align="right">Down Payment</TableCell>
                <TableCell align="right">Monthly Rent</TableCell>
                <TableCell align="right">Cap Rate</TableCell>
                <TableCell align="right">Cash on Cash</TableCell>
                <TableCell align="right">NOI</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {savedDeals.map((deal, index) => (
                <TableRow key={index} hover>
                  <TableCell>{getPropertyIdentifier(deal)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      icon={deal.type === 'multifamily' ? <ApartmentIcon /> : <HomeIcon />}
                      label={deal.type === 'multifamily' ? 'Multi-Family' : 'Single Family'}
                      color={deal.type === 'multifamily' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">{deal.data.totalUnits || 1}</TableCell>
                  <TableCell align="right">{formatCurrency(deal.data.purchasePrice)}</TableCell>
                  <TableCell align="right">{formatCurrency(deal.data.downPayment)}</TableCell>
                  <TableCell align="right">{formatCurrency(getMonthlyRent(deal))}</TableCell>
                  <TableCell align="right">{formatPercent(deal.data.analysisResult?.capRate)}</TableCell>
                  <TableCell align="right">{formatPercent(deal.data.analysisResult?.cashOnCashReturn)}</TableCell>
                  <TableCell align="right">{formatCurrency(deal.data.analysisResult?.noi)}</TableCell>
                  <TableCell>{new Date(deal.savedAt).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit Analysis">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(deal)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {savedDeals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No deals analyzed yet. Start by creating a new analysis.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default Dashboard; 