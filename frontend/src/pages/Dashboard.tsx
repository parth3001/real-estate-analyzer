import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HomeWorkIcon from '@mui/icons-material/HomeWork';

const Dashboard = () => {
  const theme = useTheme();

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
      <Typography variant="h4" gutterBottom sx={{ color: theme.palette.text.primary, mb: 4 }}>
        Dashboard
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
            <Card sx={cardStyle}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AccountBalanceIcon sx={iconStyle} />
                  <Typography variant="h6" sx={{ color: 'inherit' }}>Total Deals</Typography>
                </Box>
                <Typography variant="h3" sx={{ color: 'inherit' }}>0</Typography>
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
                <Typography variant="h3" sx={{ color: 'inherit' }}>0</Typography>
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
                <Typography variant="h3" sx={{ color: 'inherit' }}>0</Typography>
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
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            No recent analyses to display.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard; 