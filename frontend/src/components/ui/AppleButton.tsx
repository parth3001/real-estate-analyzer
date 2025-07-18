// Apple-Style Button Component
// Enhanced button with proper shadows and transitions

import React from 'react';
import { Button } from '@mui/material';

interface AppleButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

export const AppleButton: React.FC<AppleButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  onClick,
  type = 'button'
}) => {
  const sizeStyles = {
    small: { padding: '8px 16px', fontSize: '14px', minHeight: '36px' },
    medium: { padding: '12px 24px', fontSize: '16px', minHeight: '44px' },
    large: { padding: '16px 32px', fontSize: '18px', minHeight: '52px' }
  };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      color: 'white',
      '&:hover': {
        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
        transform: 'translateY(-1px)',
        boxShadow: '0 8px 25px -8px rgba(59, 130, 246, 0.4)'
      }
    },
    secondary: {
      backgroundColor: 'grey.100',
      color: 'grey.700',
      '&:hover': {
        backgroundColor: 'grey.200',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px -4px rgba(0, 0, 0, 0.1)'
      }
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'primary.600',
      border: '1px solid',
      borderColor: 'primary.200',
      '&:hover': {
        backgroundColor: 'primary.50',
        borderColor: 'primary.300',
        transform: 'translateY(-1px)'
      }
    }
  };

  return (
    <Button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      fullWidth={fullWidth}
      sx={{
        borderRadius: '12px',
        textTransform: 'none' as const,
        fontWeight: 600,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        ...sizeStyles[size],
        ...variantStyles[variant],
        '&:disabled': {
          opacity: 0.6,
          transform: 'none',
          boxShadow: 'none'
        }
      }}
      startIcon={icon}
    >
      {loading ? 'Loading...' : children}
    </Button>
  );
};

export default AppleButton;