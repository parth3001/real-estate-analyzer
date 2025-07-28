import React from 'react';
import { Tooltip, IconButton, Box, Typography } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { useEducationalContent } from '../../contexts/DualModeContext';

interface EducationalTooltipProps {
  title: string;
  description: string;
  children?: React.ReactElement;
  placement?: 'bottom-end' | 'bottom-start' | 'bottom' | 'left-end' | 'left-start' | 'left' | 'right-end' | 'right-start' | 'right' | 'top-end' | 'top-start' | 'top';
  learnMoreUrl?: string;
  whyItMatters?: string;
}

export const EducationalTooltip: React.FC<EducationalTooltipProps> = ({
  title,
  description,
  children,
  placement = 'top',
  learnMoreUrl,
  whyItMatters
}) => {
  const { shouldShowTooltips } = useEducationalContent();

  // Only show in novice mode
  if (!shouldShowTooltips) {
    return children || null;
  }

  const tooltipContent = (
    <Box sx={{ maxWidth: 320, p: 1 }}>
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontWeight: 'bold', 
          mb: 0.5,
          color: 'primary.main',
          fontSize: '14px'
        }}
      >
        {title}
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          mb: whyItMatters || learnMoreUrl ? 1 : 0,
          fontSize: '13px',
          lineHeight: 1.4
        }}
      >
        {description}
      </Typography>
      
      {whyItMatters && (
        <Box sx={{ mb: learnMoreUrl ? 1 : 0 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 'bold',
              fontSize: '12px',
              color: 'text.secondary'
            }}
          >
            💡 Why it matters:
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              fontSize: '12px',
              lineHeight: 1.3,
              color: 'text.secondary',
              mt: 0.5
            }}
          >
            {whyItMatters}
          </Typography>
        </Box>
      )}
      
      {learnMoreUrl && (
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: '12px',
            color: 'primary.main',
            cursor: 'pointer',
            textDecoration: 'underline',
            '&:hover': {
              textDecoration: 'none'
            }
          }}
          onClick={() => window.open(learnMoreUrl, '_blank')}
        >
          📚 Learn more
        </Typography>
      )}
    </Box>
  );

  const IconWithTooltip = (
    <Tooltip 
      title={tooltipContent} 
      placement={placement} 
      arrow
      enterTouchDelay={0}
      leaveTouchDelay={3000}
      sx={{
        '& .MuiTooltip-tooltip': {
          backgroundColor: 'background.paper',
          color: 'text.primary',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          fontSize: '13px',
          maxWidth: 'none'
        },
        '& .MuiTooltip-arrow': {
          color: 'background.paper',
        }
      }}
    >
      <IconButton 
        size="small" 
        sx={{ 
          ml: 0.5,
          p: 0.5,
          color: 'primary.main',
          opacity: 0.7,
          '&:hover': {
            opacity: 1,
            backgroundColor: 'primary.50'
          },
          transition: 'all 0.2s ease'
        }}
        aria-label={`Learn about ${title}`}
      >
        <HelpOutline sx={{ fontSize: 16 }} />
      </IconButton>
    </Tooltip>
  );

  // If children are provided, wrap them with the tooltip
  if (children) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {children}
        {IconWithTooltip}
      </Box>
    );
  }

  // Otherwise, return just the help icon with tooltip
  return IconWithTooltip;
};

// Convenience component for wrapping form labels
export const EducationalLabel: React.FC<{
  label: string;
  tooltip: {
    title: string;
    description: string;
    whyItMatters?: string;
    learnMoreUrl?: string;
  };
  required?: boolean;
}> = ({ label, tooltip, required }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
      <Typography
        component="label"
        variant="body2"
        sx={{
          fontWeight: 500,
          color: 'text.primary'
        }}
      >
        {label}
        {required && (
          <Typography component="span" sx={{ color: 'error.main', ml: 0.25 }}>
            *
          </Typography>
        )}
      </Typography>
      <EducationalTooltip
        title={tooltip.title}
        description={tooltip.description}
        whyItMatters={tooltip.whyItMatters}
        learnMoreUrl={tooltip.learnMoreUrl}
      />
    </Box>
  );
};