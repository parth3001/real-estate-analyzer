import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Slider,
  TextField,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Button,
  Collapse,
  Alert
} from '@mui/material';
import Grid from '@mui/system/Grid';
import {
  Restore as RestoreIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';
import { propertyApi } from '../../services/api';
import type { SFRPropertyData } from '../../types/property';
import type { Analysis } from '../../types/analysis';
import PreviewModeComponent from '../common/PreviewModeComponent';
import PreviewMetricCard from '../common/PreviewMetricCard';

interface DynamicSlidersProps {
  propertyData: SFRPropertyData;
  analysis: Analysis;
  onParameterChange: (updatedData: SFRPropertyData) => Promise<void>;
  onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void;
}

interface SliderConfig {
  key: keyof SFRPropertyData;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  description: string;
  category: 'financial' | 'property' | 'assumptions';
  impact: 'high' | 'medium' | 'low';
  tooltip: string;
}

const DynamicSliders: React.FC<DynamicSlidersProps> = ({
  propertyData,
  analysis,
  onParameterChange,
  onUnsavedChangesChange
}) => {
  // Ensure we have valid property data
  if (!propertyData) {
    return (
      <Card sx={{ borderRadius: '16px', overflow: 'hidden' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary">
            No property data available. Please analyze a property first.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const [localData, setLocalData] = useState<SFRPropertyData>(propertyData);
  const [originalData] = useState<SFRPropertyData>(propertyData);
  const [expandedCategory, setExpandedCategory] = useState<string>('financial');
  const [impactIndicators, setImpactIndicators] = useState<Record<string, 'positive' | 'negative' | 'neutral'>>({});
  const [quickMetrics, setQuickMetrics] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastCalculationTime, setLastCalculationTime] = useState<number>(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Race condition prevention system
  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [, setLastRequestId] = useState<string>('');

  const sliderConfigs: SliderConfig[] = [
    // Financial Parameters
    {
      key: 'purchasePrice',
      label: 'Purchase Price',
      min: 50000,
      max: 1000000,
      step: 5000,
      format: (value) => `$${value.toLocaleString()}`,
      description: 'Total property acquisition cost',
      category: 'financial',
      impact: 'high',
      tooltip: 'Lower purchase price improves returns but may indicate property issues'
    },
    {
      key: 'downPayment',
      label: 'Down Payment',
      min: 5000,
      max: 300000,
      step: 2500,
      format: (value) => `$${value.toLocaleString()} (${((value / (localData.purchasePrice || 300000)) * 100).toFixed(1)}%)`,
      description: 'Initial cash investment',
      category: 'financial',
      impact: 'high',
      tooltip: 'Higher down payment reduces monthly payments but ties up more capital'
    },
    {
      key: 'interestRate',
      label: 'Interest Rate',
      min: 3.0,
      max: 10.0,
      step: 0.25,
      format: (value) => `${value.toFixed(2)}%`,
      description: 'Annual mortgage interest rate',
      category: 'financial',
      impact: 'high',
      tooltip: 'Interest rate significantly impacts monthly payments and cash flow'
    },
    {
      key: 'monthlyRent',
      label: 'Monthly Rent',
      min: 500,
      max: 8000,
      step: 50,
      format: (value) => `$${value.toLocaleString()}/mo`,
      description: 'Expected monthly rental income',
      category: 'property',
      impact: 'high',
      tooltip: 'Primary income source - validate with comparable properties'
    },

    // Property Parameters
    {
      key: 'propertyTaxRate',
      label: 'Property Tax Rate',
      min: 0.5,
      max: 4.0,
      step: 0.1,
      format: (value) => `${value.toFixed(1)}%`,
      description: 'Annual property tax as % of value',
      category: 'property',
      impact: 'medium',
      tooltip: 'Property taxes vary by location and can change over time'
    },
    {
      key: 'insuranceRate',
      label: 'Insurance Rate',
      min: 0.3,
      max: 2.5,
      step: 0.1,
      format: (value) => `${value.toFixed(1)}%`,
      description: 'Annual insurance as % of value',
      category: 'property',
      impact: 'medium',
      tooltip: 'Insurance costs depend on location, age, and coverage level'
    },
    {
      key: 'maintenanceCost',
      label: 'Annual Maintenance',
      min: 1000,
      max: 10000,
      step: 250,
      format: (value) => `$${value.toLocaleString()}`,
      description: 'Expected annual maintenance costs',
      category: 'property',
      impact: 'medium',
      tooltip: 'Rule of thumb: 1-2% of property value annually'
    },

    // Assumption Parameters
    {
      key: 'propertyManagementRate',
      label: 'Management Fee',
      min: 0,
      max: 15,
      step: 0.5,
      format: (value) => `${value}%`,
      description: 'Property management fee',
      category: 'assumptions',
      impact: 'medium',
      tooltip: 'Typical range: 6-12% of rental income'
    }
  ];

  // Calculate impact of parameter changes
  const calculateImpact = useCallback((key: keyof SFRPropertyData, newValue: number) => {
    const originalValue = originalData[key] as number;
    const percentChange = ((newValue - originalValue) / originalValue) * 100;
    
    // Determine if change is positive or negative for returns
    const positiveImpactKeys = ['monthlyRent'];
    const negativeImpactKeys = ['purchasePrice', 'interestRate', 'propertyTaxRate', 'insuranceRate', 'maintenanceCost', 'propertyManagementRate'];
    
    let isPositive = false;
    if (positiveImpactKeys.includes(key as string)) {
      isPositive = percentChange > 0;
    } else if (negativeImpactKeys.includes(key as string)) {
      isPositive = percentChange < 0;
    } else if (key === 'downPayment') {
      // Down payment has complex impact - higher DP reduces monthly payments but ties up capital
      isPositive = Math.abs(percentChange) < 10; // neutral for small changes
    }
    
    if (Math.abs(percentChange) < 2) return 'neutral';
    return isPositive ? 'positive' : 'negative';
  }, [originalData]);

  // Handle slider changes with race condition prevention
  const handleSliderChange = useCallback(async (key: keyof SFRPropertyData, value: number) => {
    const newData = { ...localData, [key]: value };
    setLocalData(newData);
    
    // Track that we have unsaved changes
    setHasUnsavedChanges(true);
    
    // Update impact indicator
    const impact = calculateImpact(key, value);
    setImpactIndicators(prev => ({ ...prev, [key]: impact }));
    
    // Generate unique request ID for this calculation
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    // Clear existing timeout to prevent multiple full analyses
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    
    // Perform quick calculation immediately for instant feedback
    setIsCalculating(true);
    const startTime = Date.now();
    
    // Use a ref-like pattern to track the latest request without stale closure issues
    setActiveRequestId(requestId);
    
    try {
      const quickResponse = await propertyApi.quickCalculate(newData);
      
      // Use a callback to check the latest active request ID to avoid stale closures
      setActiveRequestId(currentActiveId => {
        if (requestId === currentActiveId && quickResponse.status === 200 && quickResponse.data) {
          const calcTime = Date.now() - startTime;
          setLastCalculationTime(calcTime);
          setQuickMetrics(quickResponse.data);
          setIsCalculating(false);
          
          console.log(`Quick calculation (${requestId.substring(requestId.length - 4)}) completed in ${calcTime}ms`);
          
          // Performance warning if exceeding target
          if (calcTime > 100) {
            console.warn('Quick calculation exceeded 100ms target:', calcTime, 'ms');
          }
        } else if (requestId !== currentActiveId) {
          console.log(`Quick calculation (${requestId.substring(requestId.length - 4)}) cancelled - newer request active`);
        }
        
        return currentActiveId; // Don't actually change the activeRequestId here
      });
      
      // Also use the direct check as backup, but clear loading state regardless if this is latest
      setTimeout(() => {
        setActiveRequestId(currentActiveId => {
          if (requestId === currentActiveId) {
            setIsCalculating(false);
          }
          return currentActiveId;
        });
      }, 0);
      
    } catch (error) {
      console.error(`Quick calculation (${requestId.substring(requestId.length - 4)}) failed:`, error);
      // Always clear calculating state on error to prevent stuck UI
      setIsCalculating(false);
    }
    
    // Set timeout for full AI analysis (only if significant changes)
    const needsFullAnalysis = Math.abs((value - (originalData[key] as number)) / (originalData[key] as number)) > 0.1;
    
    if (needsFullAnalysis) {
      const timeout = setTimeout(() => {
        // Use callback to check if this is still the latest request
        setActiveRequestId(currentActiveId => {
          if (requestId === currentActiveId) {
            console.log(`Triggering full analysis (${requestId.substring(requestId.length - 4)}) due to significant change in ${key}`);
            setLastRequestId(requestId);
            onParameterChange(newData);
          } else {
            console.log(`Full analysis (${requestId.substring(requestId.length - 4)}) cancelled - newer request active`);
          }
          return currentActiveId;
        });
      }, 2000); // 2 second delay for full analysis
      
      setUpdateTimeout(timeout);
    }
  }, [localData, calculateImpact, onParameterChange, updateTimeout, originalData]);

  // Handle direct input changes
  const handleInputChange = useCallback((key: keyof SFRPropertyData, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      handleSliderChange(key, numValue);
    }
  }, [handleSliderChange]);

  // Reset to original values
  const handleReset = useCallback(() => {
    // Cancel any pending requests
    if (updateTimeout) {
      clearTimeout(updateTimeout);
      setUpdateTimeout(null);
    }
    
    // Generate new request ID for reset and clear calculating state
    const resetRequestId = `reset-${Date.now()}`;
    setActiveRequestId(resetRequestId);
    setIsCalculating(false);
    
    setLocalData(originalData);
    setImpactIndicators({});
    setQuickMetrics(null);
    setHasUnsavedChanges(false);
    onParameterChange(originalData);
  }, [originalData, onParameterChange, updateTimeout]);

  // Reset specific parameter
  const handleResetParameter = useCallback((key: keyof SFRPropertyData) => {
    const originalValue = originalData[key] as number;
    handleSliderChange(key, originalValue);
  }, [originalData, handleSliderChange]);

  // Category filtering
  const getSlidersByCategory = (category: string) => {
    return sliderConfigs.filter(config => config.category === category);
  };

  // Impact color mapping
  const getImpactColor = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive': return appleColors.success[500];
      case 'negative': return appleColors.error[500];
      default: return appleColors.gray[400];
    }
  };

  const getImpactIcon = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive': return <TrendingUpIcon sx={{ fontSize: 16 }} />;
      case 'negative': return <TrendingDownIcon sx={{ fontSize: 16 }} />;
      default: return undefined;
    }
  };

  // Notify parent of unsaved changes state
  useEffect(() => {
    onUnsavedChangesChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChangesChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [updateTimeout]);

  return (
    <Card sx={{ borderRadius: '16px', overflow: 'hidden' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: appleColors.gray[900] }}>
                Interactive Analysis
              </Typography>
              <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                Explore "what-if" scenarios with instant preview updates
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip
                label={isCalculating ? "Calculating..." : "Live Preview"}
                color={isCalculating ? "default" : "primary"}
                size="small"
                sx={{ fontWeight: 500 }}
              />
              {activeRequestId && (
                <Chip
                  label={`ID: ${activeRequestId.substring(activeRequestId.length - 4)}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', fontSize: '10px' }}
                />
              )}
              <Button
                size="small"
                onClick={handleReset}
                startIcon={<RestoreIcon />}
                sx={{ textTransform: 'none' }}
              >
                Reset All
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Preview Mode Component */}
        <PreviewModeComponent
          hasUnsavedChanges={hasUnsavedChanges}
          onApplyChanges={() => {
            console.log('🚀 DynamicSliders: Apply Changes clicked - forcing complete reload');
            console.log('🚀 DynamicSliders: Changes include:', Object.keys(localData).filter(key => 
              JSON.stringify(localData[key as keyof typeof localData]) !== JSON.stringify(propertyData[key as keyof typeof propertyData])
            ));
            
            // Cancel any pending automatic analysis to prevent conflicts
            if (updateTimeout) {
              console.log('🚀 DynamicSliders: Cancelling pending automatic analysis');
              clearTimeout(updateTimeout);
              setUpdateTimeout(null);
              setActiveRequestId(null);
            }
            
            // Clear preview state immediately
            setHasUnsavedChanges(false);
            setQuickMetrics(null);
            setIsCalculating(false);
            
            // Force complete re-analysis (same as initial property analysis)
            console.log('🚀 DynamicSliders: Triggering FULL analysis reload via onParameterChange');
            
            // TEMP HACK: Since we don't have a dedicated onApplyChanges handler yet,
            // we'll add special handling to onParameterChange to distinguish Apply Changes
            // from automatic parameter changes
            (localData as any).__applyChangesMode = true;
            onParameterChange(localData);
          }}
          onDiscardChanges={handleReset}
          featureName="Interactive Analysis"
          isCalculating={isCalculating}
          calculationTime={lastCalculationTime}
        >
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <PreviewMetricCard
                value={`$${(quickMetrics?.monthlyAnalysis?.cashFlow ?? analysis?.monthlyAnalysis?.cashFlow ?? 0).toFixed(0)}/mo`}
                label="Monthly Cash Flow"
                isPreview={!!quickMetrics?.monthlyAnalysis?.cashFlow}
                valueColor={(quickMetrics?.monthlyAnalysis?.cashFlow ?? analysis?.monthlyAnalysis?.cashFlow ?? 0) >= 0 ? appleColors.success[600] : appleColors.error[600]}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <PreviewMetricCard
                value={`${(quickMetrics?.keyMetrics?.cashOnCashReturn ?? analysis?.keyMetrics?.cashOnCashReturn ?? 0).toFixed(1)}%`}
                label="Cash-on-Cash Return"
                isPreview={!!quickMetrics?.keyMetrics?.cashOnCashReturn}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <PreviewMetricCard
                value={`${(quickMetrics?.keyMetrics?.capRate ?? analysis?.keyMetrics?.capRate ?? 0).toFixed(2)}%`}
                label="Cap Rate"
                isPreview={!!quickMetrics?.keyMetrics?.capRate}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <PreviewMetricCard
                value={`${Math.round(analysis?.aiInsights?.investmentScore ?? 0)}/100`}
                label="AI Investment Score"
                isPreview={false}
                valueColor={(analysis?.aiInsights?.investmentScore ?? 0) >= 70 ? appleColors.success[600] : (analysis?.aiInsights?.investmentScore ?? 0) >= 50 ? appleColors.warning[600] : appleColors.error[600]}
              />
            </Grid>
          </Grid>
        </PreviewModeComponent>

        {/* Performance Alert */}
        {Object.values(impactIndicators).some(impact => impact === 'negative') && (
          <Alert 
            severity="warning" 
            sx={{ mb: 3, borderRadius: '12px' }}
            icon={<WarningIcon />}
          >
            <Typography variant="body2">
              Some parameter changes may negatively impact returns. Consider the deal fixer suggestions below.
            </Typography>
          </Alert>
        )}

        {/* Category Navigation */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1}>
            {['financial', 'property', 'assumptions'].map((category) => (
              <Button
                key={category}
                variant={expandedCategory === category ? "contained" : "outlined"}
                size="small"
                onClick={() => setExpandedCategory(category)}
                sx={{ 
                  textTransform: 'capitalize',
                  borderRadius: '8px',
                  px: 2
                }}
              >
                {category}
              </Button>
            ))}
          </Stack>
        </Box>

        {/* Sliders by Category */}
        {['financial', 'property', 'assumptions'].map((category) => (
          <Collapse key={category} in={expandedCategory === category}>
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={3}>
                {getSlidersByCategory(category).map((config) => {
                  const currentValue = localData[config.key] as number || 0;
                  const impact = impactIndicators[config.key] || 'neutral';
                  
                  return (
                    <Grid size={{ xs: 12, md: 6 }} key={config.key}>
                      <Box sx={{ p: 2, border: `1px solid ${appleColors.gray[200]}`, borderRadius: '12px' }}>
                        {/* Parameter Header */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {config.label}
                              </Typography>
                              <Tooltip title={config.tooltip} arrow>
                                <InfoIcon sx={{ fontSize: 16, color: appleColors.gray[400] }} />
                              </Tooltip>
                              {impact !== 'neutral' && (
                                <Chip
                                  size="small"
                                  icon={getImpactIcon(impact)}
                                  label={impact === 'positive' ? 'Helps' : 'Hurts'}
                                  sx={{
                                    bgcolor: `${getImpactColor(impact)}20`,
                                    color: getImpactColor(impact),
                                    fontSize: '11px',
                                    height: '20px'
                                  }}
                                />
                              )}
                            </Stack>
                            <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
                              {config.description}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleResetParameter(config.key)}
                            sx={{ ml: 1 }}
                          >
                            <RestoreIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Stack>

                        {/* Value Display */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: getImpactColor(impact) }}>
                            {config.format(currentValue)}
                          </Typography>
                        </Box>

                        {/* Slider */}
                        <Box sx={{ mb: 2 }}>
                          <Slider
                            value={currentValue}
                            min={config.min}
                            max={config.max}
                            step={config.step}
                            onChange={(_, value) => handleSliderChange(config.key, value as number)}
                            valueLabelDisplay="auto"
                            valueLabelFormat={config.format}
                            sx={{
                              color: getImpactColor(impact),
                              '& .MuiSlider-thumb': {
                                bgcolor: getImpactColor(impact)
                              },
                              '& .MuiSlider-track': {
                                bgcolor: getImpactColor(impact)
                              }
                            }}
                          />
                        </Box>

                        {/* Direct Input */}
                        <TextField
                          size="small"
                          value={currentValue}
                          onChange={(e) => handleInputChange(config.key, e.target.value)}
                          fullWidth
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px'
                            }
                          }}
                        />
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Collapse>
        ))}


        {/* Summary of Changes */}
        {Object.keys(impactIndicators).length > 0 && (
          <Box sx={{ mt: 3, p: 2, bgcolor: appleColors.gray[50], borderRadius: '12px' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Parameter Changes
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {Object.entries(impactIndicators).map(([key, impact]) => {
                const config = sliderConfigs.find(c => c.key === key);
                if (!config || impact === 'neutral') return null;
                
                return (
                  <Chip
                    key={key}
                    size="small"
                    label={`${config.label}: ${impact === 'positive' ? 'Improved' : 'Worsened'}`}
                    sx={{
                      bgcolor: `${getImpactColor(impact)}20`,
                      color: getImpactColor(impact)
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DynamicSliders;