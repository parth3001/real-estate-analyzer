// Apple-Style Card Component
// Enhanced card with title, subtitle, actions and hover effects

import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface AppleCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  hover?: boolean;
  padding?: 'small' | 'medium' | 'large';
  highlight?: boolean;
  onClick?: () => void;
  sx?: SxProps<Theme>;
}

export const AppleCard: React.FC<AppleCardProps> = ({
  children,
  title,
  subtitle,
  actions,
  hover = true,
  padding = 'medium',
  highlight = false,
  onClick,
  sx
}) => {
  const paddingStyles = {
    small: '16px',
    medium: '24px',
    large: '32px'
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        borderRadius: '16px',
        border: '1px solid',
        borderColor: highlight ? 'primary.200' : 'grey.100',
        backgroundColor: highlight ? 'primary.50' : 'background.paper',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        ...(hover && {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.15)',
            borderColor: highlight ? 'primary.300' : 'grey.200'
          }
        }),
        ...sx
      }}
    >
      <CardContent sx={{ padding: paddingStyles[padding] }}>
        {(title || subtitle || actions) && (
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="flex-start"
            mb={title || subtitle ? 3 : 0}
          >
            <Box>
              {title && (
                <Typography 
                  variant="h6" 
                  fontWeight={600}
                  color="text.primary"
                  sx={{ mb: 0.5 }}
                >
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
            {actions && (
              <Box>{actions}</Box>
            )}
          </Box>
        )}
        {children}
      </CardContent>
    </Card>
  );
};

export default AppleCard;