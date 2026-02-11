/**
 * Universal Calculator Component
 *
 * Main orchestration component for BRRRR and Buy & Hold calculators
 * Handles state management, debounced analysis, and anonymous user flow
 */

import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Paper, Alert, CircularProgress } from '@mui/material';
import { CalculatorTabs, type CalculatorStrategy } from './CalculatorTabs';
import { BRRRRInputForm } from './BRRRRInputForm';
import { BuyHoldInputForm } from './BuyHoldInputForm';
import { CalculatorResults } from './CalculatorResults';
import type { Analysis } from '../../types/analysis';
import { analyzeAnonymous, saveAnonymousAnalysis } from './calculatorService';
import { defaultBuyHoldData, defaultBRRRRData, type CalculatorFormData } from './types';
import { analytics } from '../../utils/analytics';

export const UniversalCalculator: React.FC = () => {
  const [activeStrategy, setActiveStrategy] = useState<CalculatorStrategy>('buy-hold');
  const [formData, setFormData] = useState<CalculatorFormData>(defaultBuyHoldData);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Track calculator started (only once per session)
  const hasTrackedStart = useRef(false);

  // Analysis function
  const runAnalysis = async (data: CalculatorFormData) => {
    // Only analyze if minimum required fields are present
    if (!data.purchasePrice || !data.monthlyRent || !data.downPayment) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Transform calculator form data to backend expected format
      const backendPayload = {
        // Core fields
        investmentStrategy: data.investmentStrategy,
        purchasePrice: data.purchasePrice,
        downPayment: data.downPayment,
        closingCosts: data.closingCosts || 0,
        interestRate: data.interestRate,
        loanTerm: data.loanTerm,

        // Rental income
        monthlyRent: data.monthlyRent,

        // Operating expenses - Send BOTH rates AND dollar amounts for backward compatibility
        propertyTaxRate: data.purchasePrice > 0 ? (data.propertyTax / data.purchasePrice) * 100 : 0,  // Annual tax → rate percentage
        insuranceRate: data.purchasePrice > 0 ? (data.insurance / data.purchasePrice) * 100 : 0,      // Annual insurance → rate percentage
        maintenanceCost: (data.maintenance || 0) * 12,  // Annual maintenance dollars
        propertyManagementRate: data.monthlyRent > 0 ? ((data.propertyManagement || 0) / data.monthlyRent) * 100 : 0,  // Percentage of rent
        annualPropertyTax: (data.propertyTax || 0),  // Annual tax dollars (for UI persistence)
        monthlyInsurance: (data.insurance || 0) / 12,  // Monthly insurance dollars (form collects annual)
        monthlyHOA: data.hoaFees || 0,        // Monthly HOA fees
        monthlyUtilities: data.utilities || 0,  // Monthly landlord-paid utilities
        monthlyCapEx: data.monthlyCapEx || 0,  // NEW: Monthly CapEx reserve

        // BRRRR-specific fields (only if BRRRR strategy)
        ...(data.investmentStrategy === 'brrrr' && {
          // Nested brrrr object for backend validation (brrrValidation.ts expects this structure)
          brrrr: {
            rehabBudget: data.rehabCosts || 0,
            afterRepairValue: data.arv || 0,
            refinanceLTV: data.refinanceLTV || 75,
          },
          // Flat fields for SFRAnalyzer backward compatibility
          rehabCosts: data.rehabCosts || 0,
          afterRepairValue: data.arv || 0,
          renovationCosts: data.rehabCosts || 0,  // Backend expects renovationCosts too
          refinanceLTV: data.refinanceLTV || 75,
          refinanceRate: data.refinanceRate || data.interestRate,
        }),

        // Long-term assumptions
        longTermAssumptions: data.longTermAssumptions || {
          projectionYears: 10,
          annualRentIncrease: 2,
          annualExpenseIncrease: 2,
          annualPropertyValueIncrease: 3,
          sellingCostsPercentage: 6,
          vacancyRate: data.vacancy || 5
        }
      };

      const response = await analyzeAnonymous(backendPayload as any);
      setAnalysis(response.analysis);

      // Track calculator completion
      analytics.trackCalculatorCompleted(
        data.investmentStrategy,
        response.analysis.investmentDecision?.professionalAssessment?.dealQuality || 0
      );

      // Save to localStorage for potential account creation
      saveAnonymousAnalysis(backendPayload as any, response.analysis);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  // Handle strategy change
  const handleStrategyChange = (strategy: CalculatorStrategy) => {
    setActiveStrategy(strategy);
    // Reset form data to defaults for selected strategy
    if (strategy === 'brrrr') {
      setFormData(defaultBRRRRData);
    } else {
      setFormData(defaultBuyHoldData);
    }
    setAnalysis(null);
    setError(null);
  };

  // Handle form field changes with debounce
  const handleFieldChange = (field: keyof CalculatorFormData, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Track calculator started (only once)
    if (!hasTrackedStart.current && value) {
      analytics.trackCalculatorStarted(activeStrategy);
      hasTrackedStart.current = true;
    }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced analysis (500ms delay)
    debounceTimer.current = setTimeout(() => {
      runAnalysis(newFormData);
    }, 500);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        {/* Tab Navigation */}
        <CalculatorTabs activeStrategy={activeStrategy} onStrategyChange={handleStrategyChange} />

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Input Form */}
        <Box sx={{ mb: 4 }}>
          {activeStrategy === 'brrrr' ? (
            <BRRRRInputForm formData={formData} onChange={handleFieldChange} />
          ) : (
            <BuyHoldInputForm formData={formData} onChange={handleFieldChange} />
          )}
        </Box>

        {/* Loading Indicator */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Results */}
        <CalculatorResults analysis={analysis} loading={loading} />

        {/* CTA is now inside CalculatorResults component with approved text */}
      </Paper>
    </Container>
  );
};
