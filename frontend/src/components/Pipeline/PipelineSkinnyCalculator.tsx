import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Divider,
  Paper,
  Chip,
  Tooltip
} from '@mui/material';
import Grid from '@mui/system/Grid';
import {
  Calculate as CalculateIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import type { PipelineDeal } from '../../types/pipeline';
import { PropertyType, PropertyStrategy } from '../../types/pipeline';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { pipelineApi } from '../../services/pipelineApi';
import { propertyApi } from '../../services/api';

interface PipelineSkinnyCalculatorProps {
  open: boolean;
  onClose: () => void;
  deal: PipelineDeal;
  onAnalysisComplete?: (results: SkinnyCalculatorResults) => void;
}

interface SkinnyCalculatorInputs {
  monthlyRent: number;
  monthlyExpenses: number;
  downPayment: number;
  interestRate: number;
  loanTermYears: number;
}

interface SkinnyCalculatorResults {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  capRate: number;
  cashOnCashReturn: number;
  totalInvestment: number;
  canScore: boolean; // true for SFR + BUY_HOLD
}

export const PipelineSkinnyCalculator: React.FC<PipelineSkinnyCalculatorProps> = ({
  open,
  onClose,
  deal,
  onAnalysisComplete
}) => {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState<SkinnyCalculatorInputs>({
    monthlyRent: 0,
    monthlyExpenses: 0,
    downPayment: deal.askingPrice * 0.25, // Default 25% down
    interestRate: 7.0, // Default current rate
    loanTermYears: 30
  });
  
  const [results, setResults] = useState<SkinnyCalculatorResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  // Store the saved input values separately
  const [savedInputs, setSavedInputs] = useState<SkinnyCalculatorInputs | null>(null);
  
  // Initialize inputs when deal changes - use existing analysis or quickMetrics
  useEffect(() => {
    console.log('PipelineSkinnyCalculator - Deal data:', deal);
    console.log('PipelineSkinnyCalculator - Saved inputs:', savedInputs);
    console.log('PipelineSkinnyCalculator - quickMetrics:', JSON.stringify(deal.quickMetrics, null, 2));
    console.log('PipelineSkinnyCalculator - analysisStatus:', deal.analysisStatus);
    console.log('PipelineSkinnyCalculator - analysisId:', deal.analysisId);
    
    // If deal is fully analyzed, try to load data from the full Deal analysis
    if (deal.analysisStatus === 'COMPLETE' && deal.analysisId) {
      console.log('🎯 Deal is analyzed, attempting to load full analysis data...');
      
      const loadAnalyzedData = async () => {
        try {
          console.log('🔄 Loading deal analysis data for ID:', deal.analysisId);
          
          // Use the propertyApi to load the deal data with proper authentication
          const response = await propertyApi.getProperty(deal.analysisId!);
          
          if (response.status === 200 && response.data) {
            const dealData = response.data;
            console.log('✅ Loaded full analysis data:', dealData);
            console.log('🔍 Deal data structure check:', {
              hasMonthlyRent: !!dealData.monthlyRent,
              hasDownPayment: !!dealData.downPayment,
              hasInterestRate: !!dealData.interestRate,
              hasPurchasePrice: !!dealData.purchasePrice,
              hasAnalysis: !!dealData.analysis,
              analysisKeys: dealData.analysis ? Object.keys(dealData.analysis) : []
            });
            
            // Extract input values from the original deal data (not analysis results)
            const extractedInputs: SkinnyCalculatorInputs = {
              // Use original input values from the deal
              monthlyRent: Math.round((dealData.monthlyRent || dealData.rentalIncome || deal.askingPrice * 0.01) * 100) / 100, // Fallback to 1% rule
              monthlyExpenses: Math.round((dealData.monthlyOperatingExpenses || 
                             (dealData.monthlyExpenses) ||
                             ((dealData.propertyTaxRate || 1.2) / 100 * dealData.purchasePrice / 12 + 
                              (dealData.insuranceRate || 0.5) / 100 * dealData.purchasePrice / 12 + 
                              (dealData.maintenanceCost || dealData.monthlyRent * 0.1) + 
                              (dealData.propertyManagementRate || 8) / 100 * dealData.monthlyRent) || 500) * 100) / 100,
              downPayment: Math.round((dealData.downPayment || deal.askingPrice * 0.25) * 100) / 100,
              interestRate: Math.round((dealData.interestRate || 7.0) * 100) / 100,
              loanTermYears: dealData.loanTerm || dealData.loanTermYears || 30
            };
            
            console.log('📊 Extracted input values from deal:', extractedInputs);
            setInputs(extractedInputs);
            setSavedInputs(extractedInputs);
            
            // Use the actual analysis results if available (for display, but inputs come from original data)
            if (dealData.analysis && dealData.analysis.monthlyAnalysis && dealData.analysis.keyMetrics) {
              const analysisResults: SkinnyCalculatorResults = {
                monthlyIncome: dealData.analysis.monthlyAnalysis.income?.gross || extractedInputs.monthlyRent,
                monthlyExpenses: dealData.analysis.monthlyAnalysis.expenses?.total || extractedInputs.monthlyExpenses,
                monthlyCashFlow: dealData.analysis.monthlyAnalysis.cashFlow || (extractedInputs.monthlyRent - extractedInputs.monthlyExpenses),
                annualCashFlow: (dealData.analysis.monthlyAnalysis.cashFlow || (extractedInputs.monthlyRent - extractedInputs.monthlyExpenses)) * 12,
                capRate: dealData.analysis.keyMetrics.capRate || 0,
                cashOnCashReturn: dealData.analysis.keyMetrics.cashOnCashReturn || 0,
                totalInvestment: extractedInputs.downPayment + (deal.askingPrice * 0.025),
                canScore: deal.propertyType === PropertyType.SFR && deal.strategy === PropertyStrategy.BUY_HOLD
              };
              
              console.log('📈 Using real analysis results:', analysisResults);
              setResults(analysisResults);
              setShowResults(true);
              return; // Skip the quickMetrics fallback
            } else {
              // If no full analysis, calculate basic metrics from inputs
              console.log('📊 No full analysis found, calculating basic metrics from inputs');
              const basicResults: SkinnyCalculatorResults = {
                monthlyIncome: extractedInputs.monthlyRent,
                monthlyExpenses: extractedInputs.monthlyExpenses,
                monthlyCashFlow: extractedInputs.monthlyRent - extractedInputs.monthlyExpenses,
                annualCashFlow: (extractedInputs.monthlyRent - extractedInputs.monthlyExpenses) * 12,
                capRate: ((extractedInputs.monthlyRent - extractedInputs.monthlyExpenses) * 12) / deal.askingPrice * 100,
                cashOnCashReturn: ((extractedInputs.monthlyRent - extractedInputs.monthlyExpenses) * 12) / extractedInputs.downPayment * 100,
                totalInvestment: extractedInputs.downPayment + (deal.askingPrice * 0.025),
                canScore: deal.propertyType === PropertyType.SFR && deal.strategy === PropertyStrategy.BUY_HOLD
              };
              setResults(basicResults);
              setShowResults(true);
            }
          } else {
            console.warn('⚠️ Could not load deal data, status:', response.status);
            if (response.status === 404) {
              console.warn('Deal not found - may be ownership or sync issue');
            }
          }
        } catch (error) {
          console.error('❌ Error loading full analysis:', error);
        }
      };
      
      loadAnalyzedData();
    }
    
    // Fallback: use quickMetrics if available
    if (deal.quickMetrics) {
      console.log('Pre-populating from existing quickMetrics...');
      
      // Check if we have saved input values in quickMetrics
      const inputValues = (deal.quickMetrics as any).inputValues;
      
      if (inputValues) {
        console.log('Restoring saved input values:', inputValues);
        setInputs(inputValues);
        setSavedInputs(inputValues);
        
        // Recalculate results based on saved inputs to ensure accuracy
        const loanAmount = deal.askingPrice - inputValues.downPayment;
        const monthlyRate = inputValues.interestRate / 100 / 12;
        const numPayments = inputValues.loanTermYears * 12;
        
        const monthlyMortgage = monthlyRate > 0 
          ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
            (Math.pow(1 + monthlyRate, numPayments) - 1)
          : loanAmount / numPayments;
        
        const totalMonthlyExpenses = inputValues.monthlyExpenses + monthlyMortgage;
        const monthlyCashFlow = inputValues.monthlyRent - totalMonthlyExpenses;
        const annualCashFlow = monthlyCashFlow * 12;
        const annualNOI = (inputValues.monthlyRent - inputValues.monthlyExpenses) * 12;
        const capRate = annualNOI / deal.askingPrice * 100;
        const totalInvestment = inputValues.downPayment + (deal.askingPrice * 0.025);
        const cashOnCashReturn = annualCashFlow / totalInvestment * 100;
        
        const calculatedResults: SkinnyCalculatorResults = {
          monthlyIncome: inputValues.monthlyRent,
          monthlyExpenses: totalMonthlyExpenses,
          monthlyCashFlow,
          annualCashFlow,
          capRate,
          cashOnCashReturn,
          totalInvestment,
          canScore: deal.propertyType === PropertyType.SFR && deal.strategy === PropertyStrategy.BUY_HOLD
        };
        
        setResults(calculatedResults);
        setShowResults(true);
      } else {
        // Fallback: Display the stored results but with default inputs
        console.log('Displaying stored results with default inputs...');
        setInputs({
          monthlyRent: deal.quickMetrics.monthlyIncome || 0,
          monthlyExpenses: 500, // Default estimate
          downPayment: deal.askingPrice * 0.25,
          interestRate: 7.0,
          loanTermYears: 30
        });
        
        const existingResults: SkinnyCalculatorResults = {
          monthlyIncome: deal.quickMetrics.monthlyIncome || 0,
          monthlyExpenses: 0, // Will be recalculated when user makes changes
          monthlyCashFlow: deal.quickMetrics.monthlyCashFlow || 0,
          annualCashFlow: (deal.quickMetrics.monthlyCashFlow || 0) * 12,
          capRate: deal.quickMetrics.capRate || 0,
          cashOnCashReturn: deal.quickMetrics.cashOnCashReturn || 0,
          totalInvestment: deal.askingPrice * 0.275,
          canScore: deal.propertyType === PropertyType.SFR && deal.strategy === PropertyStrategy.BUY_HOLD
        };
        setResults(existingResults);
        setShowResults(true);
      }
    } else {
      console.log('No quickMetrics found, starting fresh...');
      // No existing analysis, start fresh
      setInputs({
        monthlyRent: 0,
        monthlyExpenses: 0,
        downPayment: deal.askingPrice * 0.25,
        interestRate: 7.0,
        loanTermYears: 30
      });
      setResults(null);
      setShowResults(false);
      setSavedInputs(null);
    }
  }, [deal]);

  const handleInputChange = (field: keyof SkinnyCalculatorInputs, value: number) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateMetrics = async () => {
    const loanAmount = deal.askingPrice - inputs.downPayment;
    const monthlyRate = inputs.interestRate / 100 / 12;
    const numPayments = inputs.loanTermYears * 12;
    
    // Calculate monthly mortgage payment
    const monthlyMortgage = monthlyRate > 0 
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : loanAmount / numPayments;
    
    const totalMonthlyExpenses = inputs.monthlyExpenses + monthlyMortgage;
    const monthlyCashFlow = inputs.monthlyRent - totalMonthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;
    
    // Calculate NOI (before debt service)
    const annualNOI = (inputs.monthlyRent - inputs.monthlyExpenses) * 12;
    const capRate = annualNOI / deal.askingPrice * 100;
    
    // Calculate cash-on-cash return
    const totalInvestment = inputs.downPayment + (deal.askingPrice * 0.025); // Include ~2.5% closing costs
    const cashOnCashReturn = annualCashFlow / totalInvestment * 100;
    
    const calculatedResults: SkinnyCalculatorResults = {
      monthlyIncome: inputs.monthlyRent,
      monthlyExpenses: totalMonthlyExpenses,
      monthlyCashFlow,
      annualCashFlow,
      capRate,
      cashOnCashReturn,
      totalInvestment,
      canScore: deal.propertyType === PropertyType.SFR && deal.strategy === PropertyStrategy.BUY_HOLD
    };
    
    setResults(calculatedResults);
    setShowResults(true);
    
    // Save the quick metrics AND input values to the deal
    try {
      const quickMetrics = {
        monthlyIncome: inputs.monthlyRent,
        monthlyCashFlow,
        capRate,
        cashOnCashReturn,
        // Also save the input values for proper restoration
        inputValues: {
          monthlyRent: inputs.monthlyRent,
          monthlyExpenses: inputs.monthlyExpenses,
          downPayment: inputs.downPayment,
          interestRate: inputs.interestRate,
          loanTermYears: inputs.loanTermYears
        }
      };
      
      await pipelineApi.saveQuickMetrics(deal._id, quickMetrics);
      console.log('Quick metrics saved successfully:', JSON.stringify(quickMetrics, null, 2));
      
      // Save the inputs locally for this session
      setSavedInputs(inputs);
      
      // Call the callback if provided
      if (onAnalysisComplete) {
        onAnalysisComplete(calculatedResults);
      }
    } catch (error) {
      console.error('Error saving quick metrics:', error);
    }
  };

  const handleDealScoring = async () => {
    if (results && onAnalysisComplete) {
      onAnalysisComplete(results);
    }

    // Task #122 (2026-07-26): v2.0 single-experience routing. Completed
    // deals open in the workspace; new-analysis requests seed the chat
    // composer with the deal's numbers so the user can review and hit
    // send. No fork into the legacy /sfr-analysis wizard.

    // COMPLETED deal → workspace (unlocked or paywall — handled there)
    if (deal.analysisStatus === 'COMPLETE' && deal.analysisId) {
      navigate(`/analysis/${deal.analysisId}`);
      onClose();
      return;
    }

    // NEW analysis → chat, prefilled with the pipeline deal's data.
    // The chat overlay reads `reanalyzr.chat.prefill` on mount and
    // hydrates the composer with this text (see ChatOverlay Task #122).
    const purchasePrice = deal.askingPrice ?? 0;
    const downPct =
      purchasePrice > 0 && inputs.downPayment > 0
        ? Math.round((inputs.downPayment / purchasePrice) * 100)
        : undefined;
    const lines: string[] = [
      `Analyze ${deal.address ?? 'this property'} as a buy-and-hold rental.`,
      '',
      `Purchase price: $${purchasePrice.toLocaleString()}`,
    ];
    if (downPct != null) lines.push(`Down payment: ${downPct}%`);
    if (inputs.interestRate > 0) lines.push(`Interest rate: ${inputs.interestRate}%`);
    if (inputs.loanTermYears > 0) lines.push(`Loan term: ${inputs.loanTermYears} years`);
    if (inputs.monthlyRent > 0)
      lines.push(`Estimated rent: $${inputs.monthlyRent.toLocaleString()}/month`);
    if (inputs.monthlyExpenses > 0)
      lines.push(`Monthly operating expenses: $${inputs.monthlyExpenses.toLocaleString()}`);
    lines.push('', 'Score this deal and give me the full analysis.');

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('reanalyzr.chat.prefill', lines.join('\n'));
      // Fresh sessionId so this lands on a new thread, not the last one.
      sessionStorage.removeItem('reanalyzr.chat.sessionId');
    }
    navigate('/app');
    onClose();
  };

  const handleClose = () => {
    // Don't reset inputs when closing - they should persist
    // Only reset if there was no saved data to begin with
    if (!deal.quickMetrics) {
      setInputs({
        monthlyRent: 0,
        monthlyExpenses: 0,
        downPayment: deal.askingPrice * 0.25,
        interestRate: 7.0,
        loanTermYears: 30
      });
      setResults(null);
      setShowResults(false);
    }
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalculateIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Quick Deal Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {deal.dealName} • {deal.propertyType} • {formatCurrency(deal.askingPrice)}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={3}>
          {/* Input Section */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Property Financials
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Monthly Rent"
              type="number"
              value={inputs.monthlyRent || ''}
              onChange={(e) => handleInputChange('monthlyRent', Number(e.target.value))}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Monthly Operating Expenses"
              type="number"
              value={inputs.monthlyExpenses || ''}
              onChange={(e) => handleInputChange('monthlyExpenses', Number(e.target.value))}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
              helperText="Taxes, insurance, maintenance, management, etc."
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Down Payment"
              type="number"
              value={inputs.downPayment || ''}
              onChange={(e) => handleInputChange('downPayment', Number(e.target.value))}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Interest Rate"
              type="number"
              value={inputs.interestRate || ''}
              onChange={(e) => handleInputChange('interestRate', Number(e.target.value))}
              InputProps={{
                endAdornment: <Typography sx={{ ml: 1 }}>%</Typography>,
              }}
              inputProps={{ step: 0.1 }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Loan Term"
              type="number"
              value={inputs.loanTermYears || ''}
              onChange={(e) => handleInputChange('loanTermYears', Number(e.target.value))}
              InputProps={{
                endAdornment: <Typography sx={{ ml: 1 }}>years</Typography>,
              }}
            />
          </Grid>

          <Grid size={12}>
            <Button
              variant="contained"
              onClick={calculateMetrics}
              startIcon={<CalculateIcon />}
              disabled={!inputs.monthlyRent || !inputs.monthlyExpenses}
              sx={{ borderRadius: 2 }}
            >
              Calculate Metrics
            </Button>
          </Grid>

          {/* Results Section */}
          {showResults && results && (
            <>
              <Grid size={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Analysis Results
                </Typography>
              </Grid>

              <Grid size={12}>
                <Paper sx={{ p: 3, backgroundColor: 'grey.50' }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ 
                          fontWeight: 700, 
                          color: results.monthlyCashFlow >= 0 ? 'success.main' : 'error.main' 
                        }}>
                          {formatCurrency(results.monthlyCashFlow)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Monthly Cash Flow
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {formatPercent(results.capRate, 1)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cap Rate
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                          {formatPercent(results.cashOnCashReturn, 1)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cash-on-Cash Return
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Typography variant="body2">
                          Annual Cash Flow: <strong>{formatCurrency(results.annualCashFlow)}</strong>
                        </Typography>
                        <Typography variant="body2">
                          Total Investment: <strong>{formatCurrency(results.totalInvestment)}</strong>
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Deal Scoring Section */}
              <Grid size={12}>
                <Paper sx={{ p: 3, mt: 2, backgroundColor: 'primary.50' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUpIcon color="primary" />
                        Professional Deal Scoring
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Get a 0-100 deal quality score with a full metric breakdown
                      </Typography>
                    </Box>
                    
                    {results.canScore && deal.analysisStatus === 'COMPLETE' ? (
                      <Button
                        variant="contained"
                        onClick={handleDealScoring}
                        sx={{ borderRadius: 2 }}
                      >
                        Get Deal Score
                      </Button>
                    ) : results.canScore && deal.analysisStatus !== 'COMPLETE' ? (
                      <Tooltip title="Chat with the AI to run a full-metric analysis on this deal">
                        <Button
                          variant="outlined"
                          onClick={handleDealScoring}
                          sx={{ borderRadius: 2 }}
                        >
                          Run Full Analysis for Scoring
                        </Button>
                      </Tooltip>
                    ) : (
                      <Box sx={{ textAlign: 'center' }}>
                        <Chip 
                          label="Coming Soon" 
                          disabled 
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Currently available for<br />SFR + Buy & Hold only
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};