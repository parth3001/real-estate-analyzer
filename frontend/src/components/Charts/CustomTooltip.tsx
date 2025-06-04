import React from 'react';
import { Box, Typography } from '@mui/material';
import { TooltipProps } from 'recharts';

export const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ 
  active, 
  payload, 
  label 
}): React.ReactElement | null => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="body2">
          {label}: ${payload[0].value.toLocaleString()}
        </Typography>
      </Box>
    );
  }
  return null;
};

export default CustomTooltip; 