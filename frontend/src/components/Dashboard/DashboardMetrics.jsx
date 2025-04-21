import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HomeIcon from '@mui/icons-material/Home';

const MetricCard = ({ icon, title, value }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      height: '100%',
      bgcolor: 'background.paper',
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon}
      <Typography variant="h6" color="text.secondary">
        {title}
      </Typography>
    </Box>
    <Typography variant="h3" component="div" sx={{ fontWeight: 'medium' }}>
      {value}
    </Typography>
  </Paper>
);

const DashboardMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalDeals: 0,
    activeAnalysis: 0,
    properties: 0
  });

  useEffect(() => {
    // Get saved deals from localStorage
    const savedDeals = JSON.parse(localStorage.getItem('savedDeals') || '[]');
    const currentDeal = localStorage.getItem('currentDeal');
    
    setMetrics({
      totalDeals: savedDeals.length,
      activeAnalysis: currentDeal ? 1 : 0,
      properties: savedDeals.length // For now, each deal represents one property
    });
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <MetricCard
          icon={<AccountBalanceIcon color="primary" sx={{ fontSize: 28 }} />}
          title="Total Deals"
          value={metrics.totalDeals}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <MetricCard
          icon={<TrendingUpIcon color="primary" sx={{ fontSize: 28 }} />}
          title="Active Analysis"
          value={metrics.activeAnalysis}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <MetricCard
          icon={<HomeIcon color="primary" sx={{ fontSize: 28 }} />}
          title="Properties"
          value={metrics.properties}
        />
      </Grid>
    </Grid>
  );
};

export default DashboardMetrics; 