/**
 * Calculator Tabs Component
 *
 * Tab navigation for Universal Calculator
 * Supports BRRRR and Buy & Hold strategies (no disabled tabs per Apple UX principles)
 */

import React from 'react';
import { Tabs, Tab, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3,
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '1rem',
  minWidth: 120,
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: 600,
  },
  '&:hover': {
    color: theme.palette.primary.dark,
  },
}));

export type CalculatorStrategy = 'brrrr' | 'buy-hold';

interface CalculatorTabsProps {
  activeStrategy: CalculatorStrategy;
  onStrategyChange: (strategy: CalculatorStrategy) => void;
}

export const CalculatorTabs: React.FC<CalculatorTabsProps> = ({
  activeStrategy,
  onStrategyChange,
}) => {
  const handleChange = (_event: React.SyntheticEvent, newValue: CalculatorStrategy) => {
    onStrategyChange(newValue);
  };

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <StyledTabs value={activeStrategy} onChange={handleChange} aria-label="calculator strategy tabs">
        <StyledTab
          label="BRRRR Strategy"
          value="brrrr"
          id="calculator-tab-brrrr"
          aria-controls="calculator-panel-brrrr"
        />
        <StyledTab
          label="Buy & Hold"
          value="buy-hold"
          id="calculator-tab-buy-hold"
          aria-controls="calculator-panel-buy-hold"
        />
      </StyledTabs>

      {/* Strategy descriptions - helps first-time users */}
      <Box sx={{ mt: 2, px: 2 }}>
        {activeStrategy === 'brrrr' && (
          <Typography variant="body2" color="text.secondary">
            <strong>BRRRR Strategy:</strong> Buy, Rehab, Rent, Refinance, Repeat - for investors
            looking to recycle capital and build portfolios faster.
          </Typography>
        )}
        {activeStrategy === 'buy-hold' && (
          <Typography variant="body2" color="text.secondary">
            <strong>Buy & Hold Strategy:</strong> Traditional rental property investment - purchase,
            rent, and hold long-term for cash flow and appreciation.
          </Typography>
        )}
      </Box>
    </Box>
  );
};
