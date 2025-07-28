import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { TrendingUp, TrendingDown, Remove } from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';

interface Metric {
  label: string;
  value: number | string;
  format: 'currency' | 'percent' | 'decimal' | 'multiplier' | 'score';
  status?: 'positive' | 'negative' | 'warning' | 'neutral';
  benchmark?: string;
}

interface ProMetricsBarProps {
  metrics: Metric[];
  title?: string;
}

const ProMetricsBar: React.FC<ProMetricsBarProps> = ({ metrics, title }) => {
  const formatValue = (value: number | string, format: string): string => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percent':
        return `${value.toFixed(2)}%`;
      case 'decimal':
        return value.toFixed(2);
      case 'multiplier':
        return `${value.toFixed(2)}x`;
      case 'score':
        return `${Math.round(value)}/100`;
      default:
        return value.toString();
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'positive':
        return <TrendingUp sx={{ fontSize: 14, color: appleColors.green[600] }} />;
      case 'negative':
        return <TrendingDown sx={{ fontSize: 14, color: appleColors.red[600] }} />;
      default:
        return <Remove sx={{ fontSize: 14, color: appleColors.gray[500] }} />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'positive':
        return appleColors.green[600];
      case 'negative':
        return appleColors.red[600];
      case 'warning':
        return appleColors.orange[600];
      default:
        return appleColors.gray[700];
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: appleColors.gray[50],
        borderRadius: '12px',
        p: 2,
        mb: 3,
        border: `1px solid ${appleColors.gray[200]}`,
      }}
    >
      {title && (
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: appleColors.gray[700] }}>
          {title}
        </Typography>
      )}
      
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
          '& > *:not(:last-child)': {
            borderRight: `1px solid ${appleColors.gray[300]}`,
            pr: 2,
          },
        }}
      >
        {metrics.map((metric, index) => (
          <Tooltip
            key={index}
            title={metric.benchmark ? `Target: ${metric.benchmark}` : ''}
            arrow
            placement="top"
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                minWidth: 'fit-content',
              }}
            >
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: appleColors.gray[600],
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    display: 'block',
                  }}
                >
                  {metric.label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getStatusIcon(metric.status)}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: getStatusColor(metric.status),
                      fontSize: '14px',
                    }}
                  >
                    {formatValue(metric.value, metric.format)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
};

export default ProMetricsBar;