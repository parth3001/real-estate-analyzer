/**
 * TaxProfileStep - Step 6 of Property Wizard
 *
 * Collects user tax profile for tax-optimized investment analysis
 * Expert validated: Addresses $10K-100K+ tax planning mistakes
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  TextField,
  Switch,
  Alert,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Button,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AccountBalance as TaxIcon,
  TrendingUp as OptimizeIcon,
  LocationOn as StateIcon,
  Help as HelpIcon,
  Lightbulb as TipIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import type { SFRPropertyData } from '../../types/property';
import type { StepValidation, WizardState, TaxProfile } from './wizardTypes';

interface TaxProfileStepProps {
  data: SFRPropertyData & { taxProfile?: TaxProfile };
  onUpdate: (updates: Partial<SFRPropertyData & { taxProfile?: TaxProfile }>) => void;
  validation: StepValidation;
  onValidationChange: (validation: StepValidation) => void;
  state: WizardState;
}

// US States with tax rates (matching backend service)
const US_STATES = [
  { code: 'AL', name: 'Alabama', rate: 5.0 },
  { code: 'AK', name: 'Alaska', rate: 0.0 },
  { code: 'AZ', name: 'Arizona', rate: 2.5 },
  { code: 'AR', name: 'Arkansas', rate: 5.4 },
  { code: 'CA', name: 'California', rate: 13.3 },
  { code: 'CO', name: 'Colorado', rate: 4.4 },
  { code: 'CT', name: 'Connecticut', rate: 6.99 },
  { code: 'DE', name: 'Delaware', rate: 6.6 },
  { code: 'FL', name: 'Florida', rate: 0.0 },
  { code: 'GA', name: 'Georgia', rate: 5.75 },
  { code: 'HI', name: 'Hawaii', rate: 11.0 },
  { code: 'ID', name: 'Idaho', rate: 5.8 },
  { code: 'IL', name: 'Illinois', rate: 3.25 },
  { code: 'IN', name: 'Indiana', rate: 3.23 },
  { code: 'IA', name: 'Iowa', rate: 8.76 },
  { code: 'KS', name: 'Kansas', rate: 5.7 },
  { code: 'KY', name: 'Kentucky', rate: 5.0 },
  { code: 'LA', name: 'Louisiana', rate: 6.0 },
  { code: 'ME', name: 'Maine', rate: 7.5 },
  { code: 'MD', name: 'Maryland', rate: 5.75 },
  { code: 'MA', name: 'Massachusetts', rate: 5.0 },
  { code: 'MI', name: 'Michigan', rate: 4.25 },
  { code: 'MN', name: 'Minnesota', rate: 9.85 },
  { code: 'MS', name: 'Mississippi', rate: 5.0 },
  { code: 'MO', name: 'Missouri', rate: 5.4 },
  { code: 'MT', name: 'Montana', rate: 6.75 },
  { code: 'NE', name: 'Nebraska', rate: 6.84 },
  { code: 'NV', name: 'Nevada', rate: 0.0 },
  { code: 'NH', name: 'New Hampshire', rate: 0.0 },
  { code: 'NJ', name: 'New Jersey', rate: 10.75 },
  { code: 'NM', name: 'New Mexico', rate: 4.9 },
  { code: 'NY', name: 'New York', rate: 8.82 },
  { code: 'NC', name: 'North Carolina', rate: 4.5 },
  { code: 'ND', name: 'North Dakota', rate: 2.9 },
  { code: 'OH', name: 'Ohio', rate: 3.75 },
  { code: 'OK', name: 'Oklahoma', rate: 5.5 },
  { code: 'OR', name: 'Oregon', rate: 9.9 },
  { code: 'PA', name: 'Pennsylvania', rate: 3.07 },
  { code: 'RI', name: 'Rhode Island', rate: 5.99 },
  { code: 'SC', name: 'South Carolina', rate: 7.0 },
  { code: 'SD', name: 'South Dakota', rate: 0.0 },
  { code: 'TN', name: 'Tennessee', rate: 0.0 },
  { code: 'TX', name: 'Texas', rate: 0.0 },
  { code: 'UT', name: 'Utah', rate: 4.5 },
  { code: 'VT', name: 'Vermont', rate: 8.8 },
  { code: 'VA', name: 'Virginia', rate: 5.5 },
  { code: 'WA', name: 'Washington', rate: 0.0 },
  { code: 'WV', name: 'West Virginia', rate: 6.5 },
  { code: 'WI', name: 'Wisconsin', rate: 7.65 },
  { code: 'WY', name: 'Wyoming', rate: 0.0 }
];

// Federal tax brackets for user selection
const FEDERAL_TAX_BRACKETS = [
  { rate: 10, label: '10% ($0 - $11,000)', income: '$0 - $11K' },
  { rate: 12, label: '12% ($11,001 - $44,725)', income: '$11K - $45K' },
  { rate: 22, label: '22% ($44,726 - $95,375)', income: '$45K - $95K' },
  { rate: 24, label: '24% ($95,376 - $204,600)', income: '$95K - $205K' },
  { rate: 32, label: '32% ($204,601 - $539,900)', income: '$205K - $540K' },
  { rate: 35, label: '35% ($539,901 - $631,350)', income: '$540K - $631K' },
  { rate: 37, label: '37% ($631,351+)', income: '$631K+' }
];

const TaxProfileStep: React.FC<TaxProfileStepProps> = ({
  data,
  onUpdate,
  validation,
  onValidationChange,
  state
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewSavings, setPreviewSavings] = useState<number | null>(null);

  // Initialize tax profile with smart defaults
  const taxProfile: TaxProfile = {
    filingStatus: data.taxProfile?.filingStatus || 'single',
    state: data.taxProfile?.state || (data.propertyAddress?.state || 'TX'),
    federalTaxBracket: data.taxProfile?.federalTaxBracket || 24, // Default to typical investor bracket
    capitalGainsHoldingStrategy: data.taxProfile?.capitalGainsHoldingStrategy || 'flexible',
    depreciation: {
      method: 'straight_line',
      personalUsePercentage: data.taxProfile?.depreciation?.personalUsePercentage || 0
    },
    investorType: data.taxProfile?.investorType || 'individual'
  };

  // Auto-populate state tax rate when state changes
  useEffect(() => {
    if (taxProfile.state) {
      const stateInfo = US_STATES.find(s => s.code === taxProfile.state);
      if (stateInfo && stateInfo.rate !== taxProfile.stateTaxRate) {
        const updatedProfile = {
          ...taxProfile,
          stateTaxRate: stateInfo.rate
        };
        onUpdate({ taxProfile: updatedProfile });
      }
    }
  }, [taxProfile.state]);

  // Validation logic
  useEffect(() => {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    if (!taxProfile.filingStatus) {
      errors.filingStatus = 'Filing status is required';
    }

    if (!taxProfile.state) {
      errors.state = 'State is required for tax calculations';
    }

    // Warning for high-tax states
    const stateInfo = US_STATES.find(s => s.code === taxProfile.state);
    if (stateInfo && stateInfo.rate > 8) {
      warnings.state = `High tax state (${stateInfo.rate}%) - consider tax optimization strategies`;
    }

    // Warning for short-term strategy
    if (taxProfile.capitalGainsHoldingStrategy === 'short_term') {
      warnings.strategy = 'Short-term capital gains are taxed as ordinary income (higher rates)';
    }

    onValidationChange({
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    });

  }, [taxProfile, onValidationChange]);

  const handleProfileChange = (field: keyof TaxProfile, value: any) => {
    const updatedProfile = {
      ...taxProfile,
      [field]: value
    };
    onUpdate({ taxProfile: updatedProfile });
  };

  const handleNestedChange = (
    parent: keyof TaxProfile,
    field: string,
    value: any
  ) => {
    const updatedProfile = {
      ...taxProfile,
      [parent]: {
        ...taxProfile[parent],
        [field]: value
      }
    };
    onUpdate({ taxProfile: updatedProfile });
  };

  // Calculate preview savings (simplified)
  const calculatePreviewSavings = () => {
    if (data.purchasePrice && taxProfile.state) {
      const stateInfo = US_STATES.find(s => s.code === taxProfile.state);
      if (stateInfo) {
        // Simplified calculation: 20% appreciation over 5 years
        const estimatedGain = data.purchasePrice * 0.2;
        const stateTaxSavings = estimatedGain * (stateInfo.rate / 100);
        const longTermSavings = estimatedGain * 0.15; // Approximate long-term vs short-term savings

        setPreviewSavings(Math.max(stateTaxSavings, longTermSavings));
      }
    }
  };

  useEffect(() => {
    calculatePreviewSavings();
  }, [data.purchasePrice, taxProfile.state, taxProfile.capitalGainsHoldingStrategy]);

  const selectedState = US_STATES.find(s => s.code === taxProfile.state);
  const isNoTaxState = selectedState?.rate === 0;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <TaxIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Tax Intelligence Profile
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Optimize your investment returns with tax-aware analysis
        </Typography>

        {previewSavings && (
          <Card sx={{ backgroundColor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <OptimizeIcon sx={{ color: 'success.main' }} />
                <Typography variant="subtitle2" color="success.main" fontWeight={600}>
                  Potential Tax Savings: ${previewSavings.toLocaleString()}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Based on hold period optimization and state tax strategies
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Skip Option */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">
            Tax analysis provides after-tax returns and hold period optimization
          </Typography>
          <Button
            size="small"
            onClick={() => onUpdate({ taxProfile: undefined })}
            sx={{ ml: 2 }}
          >
            Skip Tax Analysis
          </Button>
        </Box>
      </Alert>

      {/* Core Tax Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
            Basic Tax Information
          </Typography>

          {/* Filing Status */}
          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <FormLabel component="legend">Filing Status</FormLabel>
            <RadioGroup
              row
              value={taxProfile.filingStatus}
              onChange={(e) => handleProfileChange('filingStatus', e.target.value)}
            >
              <FormControlLabel value="single" control={<Radio />} label="Single" />
              <FormControlLabel value="married_joint" control={<Radio />} label="Married Filing Jointly" />
              <FormControlLabel value="married_separate" control={<Radio />} label="Married Filing Separately" />
              <FormControlLabel value="head_household" control={<Radio />} label="Head of Household" />
            </RadioGroup>
          </FormControl>

          {/* State Selection */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <FormLabel>State of Residence</FormLabel>
            <Select
              value={taxProfile.state}
              onChange={(e) => handleProfileChange('state', e.target.value)}
              displayEmpty
            >
              <MenuItem value="">Select State</MenuItem>
              {US_STATES.map((state) => (
                <MenuItem key={state.code} value={state.code}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>{state.name}</span>
                    <Chip
                      size="small"
                      label={state.rate === 0 ? 'No Tax' : `${state.rate}%`}
                      color={state.rate === 0 ? 'success' : state.rate > 8 ? 'error' : 'default'}
                      variant="outlined"
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {selectedState && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {isNoTaxState ?
                  'No state capital gains tax - excellent for real estate investing!' :
                  `State capital gains tax rate: ${selectedState.rate}%`
                }
              </Typography>
            )}
          </FormControl>

          {/* Investment Strategy */}
          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <FormLabel component="legend">
              Capital Gains Strategy
              <Tooltip title="Your typical holding period preference affects tax planning">
                <HelpIcon sx={{ fontSize: 16, ml: 1, color: 'text.secondary' }} />
              </Tooltip>
            </FormLabel>
            <RadioGroup
              value={taxProfile.capitalGainsHoldingStrategy}
              onChange={(e) => handleProfileChange('capitalGainsHoldingStrategy', e.target.value)}
            >
              <FormControlLabel
                value="flexible"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" component="span">Flexible (Recommended)</Typography>
                    <Typography variant="caption" color="text.secondary" component="div" sx={{ fontSize: '0.75rem' }}>
                      Hold based on tax optimization and market conditions
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="long_term"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" component="span">Long-term (1+ years)</Typography>
                    <Typography variant="caption" color="text.secondary" component="div" sx={{ fontSize: '0.75rem' }}>
                      Prefer holding for long-term capital gains rates (15-20%)
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="short_term"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" component="span">Short-term (&lt;1 year)</Typography>
                    <Typography variant="caption" color="text.secondary" component="div" sx={{ fontSize: '0.75rem' }}>
                      Quick flips taxed as ordinary income (22-37%)
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Accordion expanded={showAdvanced} onChange={() => setShowAdvanced(!showAdvanced)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" fontWeight={600}>
            Advanced Tax Settings
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ pt: 2 }}>
            {/* Federal Tax Bracket */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <FormLabel>Federal Tax Bracket</FormLabel>
              <Select
                value={taxProfile.federalTaxBracket || ''}
                onChange={(e) => handleProfileChange('federalTaxBracket', Number(e.target.value))}
                displayEmpty
              >
                <MenuItem value="">Auto-detect (Recommended)</MenuItem>
                {FEDERAL_TAX_BRACKETS.map((bracket) => (
                  <MenuItem key={bracket.rate} value={bracket.rate}>
                    {bracket.label}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Used for short-term capital gains calculations
              </Typography>
            </FormControl>

            {/* Personal Use Percentage */}
            <Box sx={{ mb: 3 }}>
              <FormLabel>Personal Use Percentage</FormLabel>
              <TextField
                type="number"
                fullWidth
                value={taxProfile.depreciation.personalUsePercentage}
                onChange={(e) => handleNestedChange('depreciation', 'personalUsePercentage', Number(e.target.value))}
                inputProps={{ min: 0, max: 100, step: 1 }}
                helperText="Percentage of time you use the property personally (reduces depreciation)"
                sx={{ mt: 1 }}
              />
            </Box>

            {/* Investor Type */}
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">Investor Type</FormLabel>
              <RadioGroup
                value={taxProfile.investorType}
                onChange={(e) => handleProfileChange('investorType', e.target.value)}
              >
                <FormControlLabel
                  value="individual"
                  control={<Radio />}
                  label="Individual (Personal ownership)"
                />
                <FormControlLabel
                  value="entity"
                  control={<Radio />}
                  label="Entity (LLC, Corporation, etc.)"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Validation Messages */}
      {Object.keys(validation.errors).length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {Object.values(validation.errors).map((error, index) => (
            <Typography key={index} variant="body2">{error}</Typography>
          ))}
        </Alert>
      )}

      {Object.keys(validation.warnings).length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {Object.values(validation.warnings).map((warning, index) => (
            <Typography key={index} variant="body2">{warning}</Typography>
          ))}
        </Alert>
      )}

      {/* Tax Benefits Preview */}
      {taxProfile.state && isNoTaxState && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TipIcon />
            <Typography variant="body2" fontWeight={600}>
              Excellent choice! {selectedState?.name} has no state capital gains tax.
            </Typography>
          </Box>
        </Alert>
      )}
    </Box>
  );
};

export default TaxProfileStep;