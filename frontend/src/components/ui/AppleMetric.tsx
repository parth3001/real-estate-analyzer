// Apple-Style Metric Card Component
// Enhanced metric card for displaying financial metrics with trend indicators

import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface AppleMetricCardProps {
  label: string;
  value: string | number;
  format?: 'currency' | 'percent' | 'number';
  trend?: number;
  highlight?: boolean;
  icon?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

export const AppleMetricCard: React.FC<AppleMetricCardProps> = ({
  label,
  value,
  format = 'number',
  trend,
  highlight = false,
  icon,
  size = 'medium'
}) => {
  const formatValue = (val: string | number, fmt: string) => {
    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(numVal)) return '0';
    
    switch (fmt) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(numVal);
      case 'percent':
        return `${numVal.toFixed(1)}%`;
      default:
        return numVal.toLocaleString();
    }
  };

  const sizeStyles = {
    small: { padding: '16px', fontSize: '16px' },
    medium: { padding: '24px', fontSize: '20px' },
    large: { padding: '32px', fontSize: '24px' }
  };

  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: highlight ? '2px solid' : '1px solid',
        borderColor: highlight ? 'primary.main' : 'grey.200',
        backgroundColor: highlight ? 'primary.50' : 'background.paper',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.15)',
          borderColor: highlight ? 'primary.600' : 'grey.300'
        }
      }}
    >
      <CardContent sx={{ padding: sizeStyles[size].padding }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            fontWeight={500}
            sx={{ fontSize: '14px' }}
          >
            {label}
          </Typography>
          
          {trend !== undefined && (
            <Box 
              display="flex" 
              alignItems="center" 
              sx={{
                backgroundColor: trend > 0 ? 'success.50' : 'error.50',
                color: trend > 0 ? 'success.700' : 'error.700',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              {trend > 0 ? (
                <TrendingUp sx={{ fontSize: 14, mr: 0.5 }} />
              ) : (
                <TrendingDown sx={{ fontSize: 14, mr: 0.5 }} />
              )}
              {Math.abs(trend)}%
            </Box>
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          {icon && (
            <Box 
              sx={{ 
                color: highlight ? 'primary.600' : 'grey.600',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {icon}
            </Box>
          )}
          
          <Typography 
            variant="h4" 
            fontWeight={700}
            color={highlight ? 'primary.700' : 'text.primary'}
            sx={{ fontSize: sizeStyles[size].fontSize }}
          >
            {formatValue(value, format)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AppleMetricCard;