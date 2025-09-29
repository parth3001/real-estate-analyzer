/**
 * TaxStrategies - Advanced Tax Strategy Cards
 *
 * Shows actionable tax strategies including 1031 Exchange and State Tax Arbitrage
 * Progressive disclosure with clear value propositions
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  SwapHoriz as ExchangeIcon,
  LocationOn as StateIcon,
  CheckCircle as CheckIcon,
  Schedule as TimelineIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as OptimizeIcon
} from '@mui/icons-material';

interface Exchange1031Eligibility {
  eligible: boolean;
  deferralAmount: number;
  timelineRequirements: string[];
  minimumExchangeValue: number;
}

interface TaxStrategiesProps {
  exchange1031Eligibility?: Exchange1031Eligibility;
  stateArbitrageOpportunities: string[];
  taxOptimizationRecommendations: string[];
  userState: string;
  isStateTaxAdvantage: boolean;
}

const TaxStrategies: React.FC<TaxStrategiesProps> = ({
  exchange1031Eligibility,
  stateArbitrageOpportunities,
  taxOptimizationRecommendations,
  userState,
  isStateTaxAdvantage
}) => {
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${Math.round(amount).toLocaleString()}`;
  };

  const handleAccordionChange = (strategy: string) => {
    setExpandedStrategy(expandedStrategy === strategy ? null : strategy);
  };

  const getStateDisplayName = (stateCode: string): string => {
    const stateNames: { [key: string]: string } = {
      'FL': 'Florida', 'TX': 'Texas', 'NV': 'Nevada', 'WA': 'Washington',
      'CA': 'California', 'NY': 'New York', 'NJ': 'New Jersey',
      // Add more as needed
    };
    return stateNames[stateCode] || stateCode;
  };

  // Check if there are any strategies to show
  const hasStrategies = exchange1031Eligibility?.eligible ||
                       stateArbitrageOpportunities.length > 0 ||
                       taxOptimizationRecommendations.length > 0;

  if (!hasStrategies) {
    return null;
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: 'warning.50',
            border: '1px solid',
            borderColor: 'warning.200'
          }}>
            <OptimizeIcon sx={{ color: 'warning.main', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Advanced Tax Strategies
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Opportunities to optimize your tax position
            </Typography>
          </Box>
        </Box>

        {/* 1031 Exchange Strategy */}
        {exchange1031Eligibility?.eligible && (
          <Accordion
            expanded={expandedStrategy === '1031'}
            onChange={() => handleAccordionChange('1031')}
            sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                <ExchangeIcon sx={{ color: 'primary.main' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    1031 Like-Kind Exchange Eligible
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Defer {formatCurrency(exchange1031Eligibility.deferralAmount)} in taxes
                  </Typography>
                </Box>
                <Chip
                  label="High Impact"
                  color="primary"
                  size="small"
                  sx={{ mr: 2 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ pt: 1 }}>
                {/* Value Proposition */}
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight={600}>
                    🎯 Strategy Value: Defer {formatCurrency(exchange1031Eligibility.deferralAmount)} in capital gains taxes
                    by exchanging into a replacement property of equal or greater value.
                  </Typography>
                </Alert>

                {/* Requirements */}
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Key Requirements & Timeline
                </Typography>
                <List dense>
                  {exchange1031Eligibility.timelineRequirements.map((requirement, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <TimelineIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={requirement}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                  <ListItem>
                    <ListItemIcon>
                      <MoneyIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Minimum replacement property value: ${formatCurrency(exchange1031Eligibility.minimumExchangeValue)}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                </List>

                {/* Action Steps */}
                <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                    Next Steps
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Consult with a qualified intermediary (QI) to structure the exchange properly.
                    The QI will hold the sale proceeds and facilitate the exchange.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<InfoIcon />}
                  >
                    Learn More About 1031 Exchanges
                  </Button>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* State Tax Arbitrage Strategy */}
        {stateArbitrageOpportunities.length > 0 && (
          <Accordion
            expanded={expandedStrategy === 'state'}
            onChange={() => handleAccordionChange('state')}
            sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                <StateIcon sx={{ color: 'warning.main' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    State Tax Optimization
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Opportunities to reduce state capital gains taxes
                  </Typography>
                </Box>
                {isStateTaxAdvantage ? (
                  <Chip label="Advantaged" color="success" size="small" sx={{ mr: 2 }} />
                ) : (
                  <Chip label="Opportunity" color="warning" size="small" sx={{ mr: 2 }} />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ pt: 1 }}>
                {/* Current State Status */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                    Your Current State: {getStateDisplayName(userState)}
                  </Typography>
                  {isStateTaxAdvantage ? (
                    <Alert severity="success">
                      <Typography variant="body2">
                        ✅ You're already in a tax-advantaged state with no state capital gains tax!
                      </Typography>
                    </Alert>
                  ) : (
                    <Alert severity="info">
                      <Typography variant="body2">
                        Your state imposes capital gains taxes. Consider these optimization strategies:
                      </Typography>
                    </Alert>
                  )}
                </Box>

                {/* Opportunities */}
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Tax Optimization Opportunities
                </Typography>
                <List dense>
                  {stateArbitrageOpportunities.map((opportunity, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <OptimizeIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={opportunity}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>

                {/* Disclaimer */}
                <Box sx={{ mt: 3, p: 2, backgroundColor: 'warning.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="warning.dark">
                    <WarningIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    <strong>Important:</strong> State tax planning requires careful consideration of residency
                    requirements, timing, and other factors. Consult with a tax professional for personalized advice.
                  </Typography>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* General Tax Optimization Recommendations */}
        {taxOptimizationRecommendations.length > 0 && (
          <Accordion
            expanded={expandedStrategy === 'general'}
            onChange={() => handleAccordionChange('general')}
            sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                <CheckIcon sx={{ color: 'success.main' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Additional Tax Strategies
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Other optimization opportunities for this investment
                  </Typography>
                </Box>
                <Chip
                  label={`${taxOptimizationRecommendations.length} strategies`}
                  color="success"
                  size="small"
                  variant="outlined"
                  sx={{ mr: 2 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ pt: 1 }}>
                <List dense>
                  {taxOptimizationRecommendations.map((recommendation, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={recommendation}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>

                {/* Professional Consultation CTA */}
                <Divider sx={{ my: 2 }} />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Tax planning strategies can save thousands of dollars when implemented correctly.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<InfoIcon />}
                  >
                    Consult Tax Professional
                  </Button>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Disclaimer Footer */}
        <Box sx={{
          mt: 3,
          p: 2,
          backgroundColor: 'grey.50',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          <Typography variant="caption" color="text.secondary">
            <InfoIcon sx={{ fontSize: 14, mr: 1, verticalAlign: 'middle' }} />
            <strong>Disclaimer:</strong> Tax analysis provided for educational purposes only.
            Tax laws are complex and subject to change. Always consult with a qualified tax
            professional before implementing any tax strategies.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TaxStrategies;