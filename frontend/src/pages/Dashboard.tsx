import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ApartmentIcon from '@mui/icons-material/Apartment';
import SavedSearchIcon from '@mui/icons-material/SavedSearch';

const Dashboard: React.FC = () => {
  const actionCards = [
    {
      title: 'Single-Family Analysis',
      description: 'Analyze single-family rental properties with detailed financial projections.',
      icon: <AnalyticsIcon fontSize="large" color="primary" />,
      path: '/sfr-analysis',
      buttonText: 'Start SFR Analysis',
    },
    {
      title: 'Multi-Family Analysis',
      description: 'Evaluate multi-family properties with unit mix optimization and detailed metrics.',
      icon: <ApartmentIcon fontSize="large" color="primary" />,
      path: '/mf-analysis',
      buttonText: 'Start MF Analysis',
    },
    {
      title: 'Saved Properties',
      description: 'View and manage your saved property analyses and comparisons.',
      icon: <SavedSearchIcon fontSize="large" color="primary" />,
      path: '/saved-properties',
      buttonText: 'View Saved Properties',
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Real Estate Deal Analyzer
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          Make data-driven investment decisions with comprehensive financial analysis 
          and AI-powered insights for real estate properties.
        </Typography>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 4, 
        justifyContent: 'center'
      }}>
        {actionCards.map((card, index) => (
          <Box 
            key={index} 
            sx={{ 
              width: { xs: '100%', sm: 'calc(50% - 32px)', md: 'calc(33.333% - 32px)' },
              minWidth: { xs: '100%', sm: '280px', md: '280px' },
              maxWidth: '400px'
            }}
          >
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  {card.icon}
                </Box>
                <Typography variant="h5" component="h2" gutterBottom align="center">
                  {card.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }} align="center">
                  {card.description}
                </Typography>
                <Box sx={{ mt: 'auto' }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    component={Link}
                    to={card.path}
                  >
                    {card.buttonText}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Dashboard; 