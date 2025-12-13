/**
 * HybridSliderInput Component
 *
 * Solves Josh Lupo's feedback: "Sliders are limiting, I can't input exact values"
 *
 * Design Principles:
 * - Slider for visual feedback (shows typical range)
 * - Text input for precision (source of truth)
 * - Allow out-of-range values with warning (Josh's requirement)
 * - Slider disables when value is outside range
 * - Apple-compliant styling (SF Pro, 12px radius, smooth transitions)
 *
 * Usage:
 * <HybridSliderInput
 *   label="Monthly Rent"
 *   value={2000}
 *   onChange={(value) => setRent(value)}
 *   min={500}
 *   max={5000}
 *   step={50}
 *   unit="currency"
 *   marks={[
 *     { value: 500, label: '$500' },
 *     { value: 2500, label: 'Market Avg' },
 *     { value: 5000, label: '$5,000' }
 *   ]}
 * />
 */

import React from 'react';
import { Box, Slider, TextField, Typography, InputAdornment, Alert } from '@mui/material';
import { appleColors, appleEasing, appleDurations } from '../../../theme/appleDesignSystem';
import { formatCurrency } from '../../../utils/formatters';

export interface HybridSliderInputProps {
  /** Field label (e.g., "Monthly Rent") */
  label: string;

  /** Current value (source of truth) */
  value: number;

  /** Callback when value changes */
  onChange: (value: number) => void;

  /** Minimum value for slider range */
  min: number;

  /** Maximum value for slider range */
  max: number;

  /** Step increment for slider */
  step: number;

  /** Unit type (currency or percentage) */
  unit: 'currency' | 'percentage';

  /** Optional slider marks */
  marks?: { value: number; label: string | React.ReactNode }[];

  /** Optional helper text */
  helperText?: string;

  /** Disabled state */
  disabled?: boolean;
}

export const HybridSliderInput: React.FC<HybridSliderInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  marks,
  helperText,
  disabled = false
}) => {
  const isOutOfRange = value < min || value > max;

  // Handle slider change
  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      onChange(newValue);
    }
  };

  // Handle text input change
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <Box>
      <Typography
        variant="body2"
        fontWeight={500}
        sx={{ mb: 2, color: appleColors.gray[800] }}
      >
        {label}
      </Typography>

      {helperText && (
        <Typography
          variant="caption"
          sx={{ mb: 1.5, display: 'block', color: appleColors.gray[600] }}
        >
          {helperText}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {/* Slider */}
        <Slider
          value={isOutOfRange ? min : value}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          marks={marks}
          disabled={disabled || isOutOfRange}
          sx={{
            flex: 1,
            color: appleColors.primary[500],
            height: 6,

            '& .MuiSlider-thumb': {
              width: 20,
              height: 20,
              backgroundColor: 'white',
              border: `2px solid ${appleColors.primary[500]}`,
              transition: `all ${appleDurations.shorter}ms ${appleEasing.standard}`,

              '&:hover, &.Mui-focusVisible': {
                boxShadow: `0 0 0 8px ${appleColors.primary[100]}`
              },

              '&.Mui-active': {
                width: 24,
                height: 24
              }
            },

            '& .MuiSlider-track': {
              border: 'none',
              height: 6,
              borderRadius: 3
            },

            '& .MuiSlider-rail': {
              opacity: 0.3,
              backgroundColor: appleColors.gray[300],
              height: 6,
              borderRadius: 3
            },

            '& .MuiSlider-mark': {
              backgroundColor: appleColors.gray[400],
              height: 8,
              width: 2,
              borderRadius: 1,
              '&.MuiSlider-markActive': {
                backgroundColor: 'currentColor'
              }
            },

            '& .MuiSlider-markLabel': {
              fontSize: '0.75rem',
              color: appleColors.gray[600],
              fontWeight: 500
            },

            '&.Mui-disabled': {
              color: appleColors.gray[300],
              '& .MuiSlider-thumb': {
                borderColor: appleColors.gray[300]
              }
            }
          }}
        />

        {/* Text Input */}
        <TextField
          type="number"
          value={value}
          onChange={handleTextChange}
          disabled={disabled}
          sx={{
            width: unit === 'currency' ? 140 : 100,
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              fontWeight: 600,
              color: appleColors.gray[900],

              '& input': {
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums' // Monospaced numbers
              }
            }
          }}
          slotProps={{
            input: {
              startAdornment: unit === 'currency' ? (
                <InputAdornment position="start">
                  <Typography fontWeight={600} color={appleColors.gray[700]}>
                    $
                  </Typography>
                </InputAdornment>
              ) : undefined,
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="body2" fontWeight={500} color={appleColors.gray[600]}>
                    {unit === 'percentage' ? '%' : '/mo'}
                  </Typography>
                </InputAdornment>
              )
            },
            htmlInput: {
              step,
              min: 0 // Allow any value >= 0, no max constraint for text input
            }
          }}
        />
      </Box>

      {/* Out-of-Range Warning */}
      {isOutOfRange && (
        <Alert
          severity="warning"
          sx={{
            mt: 2,
            borderRadius: '12px',
            backgroundColor: appleColors.orange[50],
            border: `1px solid ${appleColors.orange[200]}`,
            '& .MuiAlert-icon': {
              color: appleColors.orange[600]
            }
          }}
        >
          <Typography variant="body2" fontWeight={500}>
            Value{' '}
            <strong>
              {unit === 'currency' ? formatCurrency(value, 0) : `${value}%`}
            </strong>{' '}
            is outside typical range (
            {unit === 'currency' ? formatCurrency(min, 0) : `${min}%`} -{' '}
            {unit === 'currency' ? formatCurrency(max, 0) : `${max}%`})
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default HybridSliderInput;
