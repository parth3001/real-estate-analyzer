import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Button, Grid } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardMetrics from './DashboardMetrics';

const Dashboard = () => {
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const loadSavedDeals = () => {
    try {
      const savedDeals = JSON.parse(localStorage.getItem('savedDeals') || '[]');
      console.log('Loading saved deals:', savedDeals); // Debug log
      
      // Get all deals and sort them by date (newest first)
      const sortedDeals = savedDeals.sort((a, b) => 
        new Date(b.savedAt) - new Date(a.savedAt)
      );
      setRecentAnalyses(sortedDeals);
    } catch (error) {
      console.error('Error loading saved deals:', error);
      setRecentAnalyses([]);
    }
  };

  // Load saved deals whenever the component mounts or when navigating to it
  useEffect(() => {
    console.log('Dashboard mounted or location changed'); // Debug log
    loadSavedDeals();
  }, [location]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/analyze')}
        >
          New Analysis
        </Button>
      </Box>

      <DashboardMetrics />

      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Recent Analyses
        </Typography>
        
        {recentAnalyses.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No recent analyses to display.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/analyze')}
              sx={{ mt: 2 }}
            >
              Create New Analysis
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {recentAnalyses.map((analysis, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper 
                  sx={{ 
                    p: 3,
                    '&:hover': {
                      boxShadow: 3,
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => {
                    // Load this deal's data into the form
                    localStorage.setItem('currentDeal', JSON.stringify(analysis));
                    navigate('/analyze');
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    {analysis.name || 'Unnamed Deal'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Analyzed on {new Date(analysis.savedAt).toLocaleDateString()}
                  </Typography>
                  {analysis.data && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Purchase Price: {formatCurrency(analysis.data.purchasePrice || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Monthly Rent: {formatCurrency(analysis.data.monthlyRent || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Down Payment: {formatCurrency(analysis.data.downPayment || 0)}
                      </Typography>
                    </>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default Dashboard; 