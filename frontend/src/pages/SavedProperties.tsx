import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const SavedProperties: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Saved Properties
      </Typography>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Coming Soon
        </Typography>
        <Typography variant="body1" paragraph>
          The Saved Properties feature is currently being rebuilt.
          Please check back soon to manage and compare your saved property analyses.
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default SavedProperties; 