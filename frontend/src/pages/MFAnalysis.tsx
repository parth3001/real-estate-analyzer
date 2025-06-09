import React from 'react';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const MFAnalysis: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Multi-Family Property Analysis
      </Typography>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Coming Soon
        </Typography>
        <Typography variant="body1" paragraph>
          The Multi-Family Property analysis feature is currently being rebuilt. 
          Please check back soon for a comprehensive multi-family analysis tool with unit mix optimization and detailed metrics.
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default MFAnalysis; 