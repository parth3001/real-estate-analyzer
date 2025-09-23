// Enhanced Investment Dashboard
// Architecture-approved design with portfolio intelligence and decision insights

import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import InvestmentDashboard from '../components/Dashboard/InvestmentDashboard';

const Dashboard: React.FC = () => {
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh dashboard when user navigates back from other pages
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [location.pathname]);

  // InvestmentDashboard provides comprehensive portfolio view
  // with pipeline health, decision queue, and activity tracking
  return (
    <Box>
      <InvestmentDashboard key={refreshKey} />
    </Box>
  );
};

export default Dashboard;