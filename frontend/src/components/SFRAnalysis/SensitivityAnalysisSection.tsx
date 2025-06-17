import React from 'react';
import {
  GridLegacy as Grid,
  Card,
  CardContent,
  Typography,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

interface SensitivityAnalysisSectionProps {
  sensitivityAnalysis?: {
    bestCase?: {
      cashFlow?: number;
      cashOnCashReturn?: number;
      totalReturn?: number;
    };
    worstCase?: {
      cashFlow?: number;
      cashOnCashReturn?: number;
      totalReturn?: number;
    };
  };
}

// Format number as currency
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format number as percentage
const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
};

const SensitivityAnalysisSection: React.FC<SensitivityAnalysisSectionProps> = ({ sensitivityAnalysis }) => {
  // If no sensitivity analysis data is available
  if (!sensitivityAnalysis || !sensitivityAnalysis.bestCase || !sensitivityAnalysis.worstCase) {
    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Sensitivity analysis data not available
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  const { bestCase, worstCase } = sensitivityAnalysis;
  
  // Calculate the difference between best and worst case
  const cashFlowDiff = ((bestCase.cashFlow || 0) - (worstCase.cashFlow || 0));
  const cashFlowDiffPercent = worstCase.cashFlow && worstCase.cashFlow !== 0 
    ? (cashFlowDiff / Math.abs(worstCase.cashFlow)) * 100 
    : 0;
  
  const coCRDiff = ((bestCase.cashOnCashReturn || 0) - (worstCase.cashOnCashReturn || 0));
  const totalReturnDiff = ((bestCase.totalReturn || 0) - (worstCase.totalReturn || 0));
  
  return (
    <>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'background.default' }}>
              <TableCell>Metric</TableCell>
              <TableCell align="right">Best Case</TableCell>
              <TableCell align="right">Worst Case</TableCell>
              <TableCell align="right">Difference</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                Annual Cash Flow
                <Tooltip title={`Best Case: 5% higher income, 5% lower expenses, 2% lower vacancy (min 1%), 20% higher appreciation, and 0.5% lower interest rate.\nWorst Case: 5% lower income, 10% higher expenses, 3% higher vacancy, 30% lower appreciation, and 1% higher interest rate.\nThese scenarios show how annual cash flow changes under optimistic and pessimistic assumptions.`}>
                  <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                </Tooltip>
              </TableCell>
              <TableCell align="right" sx={{ color: 'success.main' }}>
                {formatCurrency(bestCase.cashFlow)}
              </TableCell>
              <TableCell align="right" sx={{ color: (worstCase.cashFlow || 0) < 0 ? 'error.main' : 'text.primary' }}>
                {formatCurrency(worstCase.cashFlow)}
              </TableCell>
              <TableCell align="right">
                {formatCurrency(cashFlowDiff)} ({cashFlowDiffPercent.toFixed(1)}%)
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Cash-on-Cash Return
                <Tooltip title="Annual cash flow as percentage of initial investment">
                  <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                </Tooltip>
              </TableCell>
              <TableCell align="right" sx={{ color: 'success.main' }}>
                {formatPercent(bestCase.cashOnCashReturn)}
              </TableCell>
              <TableCell align="right" sx={{ color: (worstCase.cashOnCashReturn || 0) < 0 ? 'error.main' : 'text.primary' }}>
                {formatPercent(worstCase.cashOnCashReturn)}
              </TableCell>
              <TableCell align="right">
                {formatPercent(coCRDiff)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Total Return (Projected)
                <Tooltip title="Total return including cash flow and appreciation">
                  <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                </Tooltip>
              </TableCell>
              <TableCell align="right" sx={{ color: 'success.main' }}>
                {formatCurrency(bestCase.totalReturn)}
              </TableCell>
              <TableCell align="right" sx={{ color: (worstCase.totalReturn || 0) < 0 ? 'error.main' : 'text.primary' }}>
                {formatCurrency(worstCase.totalReturn)}
              </TableCell>
              <TableCell align="right">
                {formatCurrency(totalReturnDiff)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Risk Assessment
                <Tooltip title="Evaluation of investment risk based on sensitivity analysis">
                  <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                </Tooltip>
              </Typography>
              <Typography variant="body2">
                {cashFlowDiffPercent > 100 ? (
                  "High volatility: This investment shows significant sensitivity to market conditions. Consider additional reserves to manage potential downside scenarios."
                ) : cashFlowDiffPercent > 50 ? (
                  "Moderate volatility: This investment has some sensitivity to market conditions, but maintains reasonable stability."
                ) : (
                  "Low volatility: This investment shows strong stability across different market conditions, indicating lower risk."
                )}
              </Typography>
              {worstCase.cashFlow && worstCase.cashFlow < 0 && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  Warning: Negative cash flow possible in worst-case scenario. Consider risk mitigation strategies.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default SensitivityAnalysisSection; 