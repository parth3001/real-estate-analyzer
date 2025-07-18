// Apple-Style React Components for PropTech Platform
// Complete implementation with TypeScript and Material-UI integration

import React from 'react';
import { Card, CardContent, Button, TextField, Box, Typography } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

// =============================================================================
// 1. APPLE METRIC CARD COMPONENT
// =============================================================================

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

// =============================================================================
// 2. APPLE BUTTON COMPONENT
// =============================================================================

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

// =============================================================================
// 3. APPLE INPUT COMPONENT
// =============================================================================

interface AppleInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  error?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const AppleInput: React.FC<AppleInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  required = false,
  disabled = false,
  fullWidth = true,
  multiline = false,
  rows = 4,
  startIcon,
  endIcon
}) => {
  return (
    <Box width={fullWidth ? '100%' : 'auto'}>
      {label && (
        <Typography 
          variant="body2" 
          fontWeight={600}
          color="text.primary"
          sx={{ mb: 1, fontSize: '14px' }}
        >
          {label}
          {required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
        </Typography>
      )}
      
      <TextField
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={!!error}
        helperText={error}
        disabled={disabled}
        fullWidth={fullWidth}
        multiline={multiline}
        rows={multiline ? rows : undefined}
        InputProps={{
          startAdornment: startIcon,
          endAdornment: endIcon
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'background.paper',
            fontSize: '16px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            
            '& fieldset': {
              borderColor: 'grey.200',
              borderWidth: '1px'
            },
            
            '&:hover fieldset': {
              borderColor: 'primary.300',
              borderWidth: '1px'
            },
            
            '&.Mui-focused fieldset': {
              borderColor: 'primary.500',
              borderWidth: '2px',
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
            },
            
            '&.Mui-error fieldset': {
              borderColor: 'error.500'
            }
          },
          
          '& .MuiInputBase-input': {
            padding: '14px 16px',
            fontSize: '16px',
            
            '&::placeholder': {
              color: 'grey.400',
              opacity: 1
            }
          }
        }}
      />
    </Box>
  );
};

// =============================================================================
// 4. APPLE PROGRESS INDICATOR COMPONENT
// =============================================================================

interface ProgressStep {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

interface AppleProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: string;
  completedSteps: string[];
  onStepClick?: (stepId: string) => void;
}

export const AppleProgressIndicator: React.FC<AppleProgressIndicatorProps> = ({
  steps,
  currentStep,
  completedSteps,
  onStepClick
}) => {
  const getStepStatus = (stepId: string) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };

  const statusStyles = {
    completed: {
      backgroundColor: 'success.500',
      color: 'white',
      boxShadow: '0 4px 12px -4px rgba(16, 185, 129, 0.4)'
    },
    current: {
      backgroundColor: 'primary.500',
      color: 'white',
      boxShadow: '0 4px 12px -4px rgba(59, 130, 246, 0.4)',
      transform: 'scale(1.1)'
    },
    upcoming: {
      backgroundColor: 'grey.100',
      color: 'grey.600',
      border: '2px solid',
      borderColor: 'grey.200'
    }
  };

  return (
    <Box 
      display="flex" 
      alignItems="center" 
      justifyContent="space-between"
      sx={{ 
        padding: '24px',
        backgroundColor: 'background.paper',
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'grey.100'
      }}
    >
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <Box 
            display="flex" 
            alignItems="center"
            sx={{ 
              cursor: onStepClick ? 'pointer' : 'default',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onClick={() => onStepClick?.(step.id)}
          >
            {/* Step Circle */}
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                ...statusStyles[getStepStatus(step.id)]
              }}
            >
              {step.icon || (
                <Typography fontWeight={700} fontSize="16px">
                  {index + 1}
                </Typography>
              )}
            </Box>

            {/* Step Content */}
            <Box ml={2}>
              <Typography 
                variant="body1" 
                fontWeight={600}
                color={getStepStatus(step.id) === 'upcoming' ? 'text.secondary' : 'text.primary'}
              >
                {step.title}
              </Typography>
              {step.subtitle && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: '12px' }}
                >
                  {step.subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <Box
              sx={{
                flex: 1,
                height: '2px',
                mx: 3,
                backgroundColor: completedSteps.includes(steps[index + 1].id) || 
                                 steps[index + 1].id === currentStep ? 
                                 'primary.300' : 'grey.200',
                borderRadius: '1px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};

// =============================================================================
// 5. APPLE CARD COMPONENT
// =============================================================================

interface AppleCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  hover?: boolean;
  padding?: 'small' | 'medium' | 'large';
  highlight?: boolean;
  onClick?: () => void;
}

export const AppleCard: React.FC<AppleCardProps> = ({
  children,
  title,
  subtitle,
  actions,
  hover = true,
  padding = 'medium',
  highlight = false,
  onClick
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
        })
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

// =============================================================================
// 6. APPLE LOADING SPINNER COMPONENT
// =============================================================================

interface AppleLoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
}

export const AppleLoadingSpinner: React.FC<AppleLoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary'
}) => {
  const sizeMap = {
    small: 20,
    medium: 32,
    large: 48
  };

  const colorMap = {
    primary: '#3B82F6',
    secondary: '#6B7280',
    white: '#FFFFFF'
  };

  return (
    <Box
      sx={{
        width: sizeMap[size],
        height: sizeMap[size],
        borderRadius: '50%',
        border: `3px solid ${colorMap[color]}30`,
        borderTopColor: colorMap[color],
        animation: 'spin 1s linear infinite',
        '@keyframes spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      }}
    />
  );
};

// =============================================================================
// 7. APPLE STATUS BADGE COMPONENT
// =============================================================================

interface AppleStatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: React.ReactNode;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
}

export const AppleStatusBadge: React.FC<AppleStatusBadgeProps> = ({
  status,
  children,
  size = 'medium',
  variant = 'filled'
}) => {
  const statusStyles = {
    success: {
      filled: { backgroundColor: 'success.100', color: 'success.700' },
      outlined: { borderColor: 'success.500', color: 'success.600' }
    },
    warning: {
      filled: { backgroundColor: 'warning.100', color: 'warning.700' },
      outlined: { borderColor: 'warning.500', color: 'warning.600' }
    },
    error: {
      filled: { backgroundColor: 'error.100', color: 'error.700' },
      outlined: { borderColor: 'error.500', color: 'error.600' }
    },
    info: {
      filled: { backgroundColor: 'primary.100', color: 'primary.700' },
      outlined: { borderColor: 'primary.500', color: 'primary.600' }
    },
    neutral: {
      filled: { backgroundColor: 'grey.100', color: 'grey.700' },
      outlined: { borderColor: 'grey.500', color: 'grey.600' }
    }
  };

  const sizeStyles = {
    small: { padding: '4px 8px', fontSize: '12px' },
    medium: { padding: '6px 12px', fontSize: '14px' }
  };

  return (
    <Box
      sx={{
        borderRadius: '12px',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        border: variant === 'outlined' ? '1px solid' : 'none',
        ...sizeStyles[size],
        ...statusStyles[status][variant]
      }}
    >
      {children}
    </Box>
  );
};

// =============================================================================
// 8. USAGE EXAMPLES COMPONENT
// =============================================================================

export const AppleComponentsExample: React.FC = () => {
  const [inputValue, setInputValue] = React.useState('');

  return (
    <Box sx={{ p: 4, backgroundColor: 'grey.50', minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight={700} mb={4}>
        Apple Components Library
      </Typography>

      {/* Metric Cards Grid */}
      <Typography variant="h6" fontWeight={600} mb={2}>Metric Cards</Typography>
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={3} mb={6}>
        <AppleMetricCard 
          label="Monthly Cash Flow"
          value={1247}
          format="currency"
          trend={12.5}
          highlight
        />
        <AppleMetricCard 
          label="Cap Rate"
          value={7.2}
          format="percent"
          trend={-0.8}
        />
        <AppleMetricCard 
          label="Total ROI"
          value={156789}
          format="currency"
        />
      </Box>

      {/* Buttons */}
      <Typography variant="h6" fontWeight={600} mb={2}>Buttons</Typography>
      <Box display="flex" gap={2} mb={6} flexWrap="wrap">
        <AppleButton variant="primary">Analyze Property</AppleButton>
        <AppleButton variant="secondary">Load Sample</AppleButton>
        <AppleButton variant="ghost">Cancel</AppleButton>
        <AppleButton variant="primary" loading>Processing...</AppleButton>
      </Box>

      {/* Input Example */}
      <Typography variant="h6" fontWeight={600} mb={2}>Input Field</Typography>
      <Box maxWidth={400} mb={6}>
        <AppleInput 
          label="Property Address"
          placeholder="Enter property address..."
          value={inputValue}
          onChange={setInputValue}
          required
        />
      </Box>

      {/* Progress Indicator */}
      <Typography variant="h6" fontWeight={600} mb={2}>Progress Indicator</Typography>
      <Box mb={6}>
        <AppleProgressIndicator 
          steps={[
            { id: '1', title: 'Property Details', subtitle: 'Basic information' },
            { id: '2', title: 'Financing', subtitle: 'Loan details' },
            { id: '3', title: 'Analysis', subtitle: 'Review results' }
          ]}
          currentStep="2"
          completedSteps={['1']}
        />
      </Box>

      {/* Status Badges */}
      <Typography variant="h6" fontWeight={600} mb={2}>Status Badges</Typography>
      <Box display="flex" gap={2} mb={6} flexWrap="wrap">
        <AppleStatusBadge status="success">Excellent</AppleStatusBadge>
        <AppleStatusBadge status="warning">Caution</AppleStatusBadge>
        <AppleStatusBadge status="error">Poor</AppleStatusBadge>
        <AppleStatusBadge status="info">Info</AppleStatusBadge>
        <AppleStatusBadge status="neutral" variant="outlined">Neutral</AppleStatusBadge>
      </Box>

      {/* Apple Card */}
      <Typography variant="h6" fontWeight={600} mb={2}>Apple Card</Typography>
      <AppleCard 
        title="Property Analysis Summary"
        subtitle="Last updated: Today at 2:30 PM"
        actions={<AppleButton variant="ghost" size="small">View Details</AppleButton>}
      >
        <Typography variant="body1" color="text.secondary">
          This property shows strong investment potential with positive cash flow
          and competitive cap rates in the local market.
        </Typography>
      </AppleCard>
    </Box>
  );
};