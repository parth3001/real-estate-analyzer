/**
 * TapToExpandField Component
 *
 * Apple-compliant progressive disclosure pattern for Phase 1: Universal Simple
 *
 * Design Principles:
 * - Tap entire row to expand with explicit "Customize" text for clarity
 * - iOS Settings app pattern: descriptive text + chevron
 * - Smooth 300ms expand/collapse animation
 * - Mobile: Always show chevron (no hover state)
 * - Desktop: Hover effect with subtle lift + underline on "Customize" text
 *
 * UX Enhancement (Dec 11, 2025):
 * - Added "Customize ›" / "Collapse ˅" text for discoverability
 * - Increased chevron size from 20px to 24px
 * - Changed chevron color to primary blue
 * - Added ARIA accessibility labels
 *
 * Usage:
 * <TapToExpandField
 *   label="Property Tax"
 *   displayValue="$3,600/year"
 *   helperText="Smart default based on local rates"
 *   isCustomized={false}
 * >
 *   <Slider ... />
 *   <TextField ... />
 * </TapToExpandField>
 */

import React, { useState } from 'react';
import { Box, Typography, Collapse, Chip } from '@mui/material';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { appleColors, appleEasing, appleDurations } from '../../../theme/appleDesignSystem';

export interface TapToExpandFieldProps {
  /** Field label (e.g., "Property Tax") */
  label: string;

  /** Display value when collapsed (e.g., "$3,600/year") */
  displayValue: string;

  /** Helper text explaining the value (e.g., "Smart default based on local rates") */
  helperText: string;

  /** Smart default metadata (optional) */
  smartDefault?: {
    value: number;
    source: string;
    confidence?: { score: number };
  };

  /** Whether user has customized this value */
  isCustomized?: boolean;

  /** Child content shown when expanded (e.g., sliders, text inputs) */
  children: React.ReactNode;

  /** Controlled expanded state (optional) */
  expanded?: boolean;

  /** Callback when expanded state changes (optional) */
  onExpandChange?: (expanded: boolean) => void;

  /** Default expanded state (optional, default: false) */
  defaultExpanded?: boolean;
}

export const TapToExpandField: React.FC<TapToExpandFieldProps> = ({
  label,
  displayValue,
  helperText,
  isCustomized = false,
  children,
  expanded: controlledExpanded,
  onExpandChange,
  defaultExpanded = false
}) => {
  // Use controlled or uncontrolled state
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    const newExpanded = !expanded;
    if (controlledExpanded === undefined) {
      setInternalExpanded(newExpanded);
    }
    if (onExpandChange) {
      onExpandChange(newExpanded);
    }
  };

  return (
    <Box
      onClick={handleToggle}
      role="button"
      aria-label={expanded ? `Collapse ${label}` : `Customize ${label}`}
      aria-expanded={expanded}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggle();
        }
      }}
      sx={{
        p: 2.5,
        mb: 2,
        backgroundColor: expanded ? appleColors.blue[50] : appleColors.gray[50],
        borderRadius: '12px',
        border: '1px solid',
        borderColor: expanded ? appleColors.blue[200] : 'transparent',
        cursor: 'pointer',
        transition: `all ${appleDurations.shorter}ms ${appleEasing.standard}`,

        '&:hover': {
          backgroundColor: expanded ? appleColors.blue[100] : appleColors.gray[100],
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          // UX Enhancement: Highlight "Customize" text on hover
          '& .customize-text': {
            color: appleColors.primary[600],
            textDecoration: 'underline',
            textDecorationColor: appleColors.primary[300]
          }
        },

        '&:active': {
          transform: 'scale(0.99)',
          transition: `all ${appleDurations.shortest}ms ${appleEasing.sharp}`
        }
      }}
    >
      {/* Collapsed View */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              {label}
            </Typography>
            {isCustomized && (
              <Chip
                label="Customized"
                size="small"
                sx={{
                  ml: 1,
                  height: 20,
                  fontSize: '0.625rem',
                  backgroundColor: appleColors.primary[100],
                  color: appleColors.primary[700],
                  fontWeight: 600
                }}
              />
            )}
          </Box>

          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ mb: 0.5, color: appleColors.gray[900] }}
          >
            {displayValue}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: '0.75rem' }}
          >
            {helperText}
          </Typography>
        </Box>

        {/* UX Enhancement: "Customize" badge (like "NEW" badge pattern) */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          ml: 2,
          flexShrink: 0
        }}>
          <Chip
            label={expanded ? "Collapse" : "Customize"}
            size="small"
            className="customize-badge"
            sx={{
              height: 24,
              fontSize: '0.75rem',
              fontFamily: 'SF Pro Text',
              fontWeight: 600,
              // UX Enhancement: Blue badge for high contrast against gray background
              backgroundColor: expanded ? appleColors.primary[500] : appleColors.primary[100],
              color: expanded ? '#FFFFFF' : appleColors.primary[700],
              border: '1px solid',
              borderColor: expanded ? appleColors.primary[600] : appleColors.primary[300],
              cursor: 'pointer',
              userSelect: 'none',
              transition: `all ${appleDurations.shorter}ms ${appleEasing.standard}`,

              '&:hover': {
                backgroundColor: appleColors.primary[600],
                color: '#FFFFFF',
                borderColor: appleColors.primary[700],
                transform: 'scale(1.05)',
                boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)' // Subtle blue glow
              },

              '& .MuiChip-label': {
                px: 1.5,
                fontFamily: 'SF Pro Text'
              }
            }}
          />
          <ChevronRightIcon
            sx={{
              fontSize: 24,
              color: appleColors.primary[500],
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: `transform ${appleDurations.shorter}ms ${appleEasing.standard}`
            }}
          />
        </Box>
      </Box>

      {/* Expanded View */}
      <Collapse in={expanded} timeout={appleDurations.standard}>
        <Box
          sx={{
            mt: 3,
            pt: 3,
            borderTop: '1px solid',
            borderColor: appleColors.gray[200]
          }}
          onClick={(e) => e.stopPropagation()} // Prevent collapse when interacting with children
        >
          {children}
        </Box>
      </Collapse>
    </Box>
  );
};

export default TapToExpandField;
