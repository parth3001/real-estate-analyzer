import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Stack,
  Fade,
  Grow
} from '@mui/material';
import {
  LocationOn,
  CompareArrows,
  Psychology,
  AccessTime,
  ChevronRight
} from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';

interface SmartInvestmentStackProps {
  investmentDecision: any;
  analysisData: any;
}

interface SmartCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  preview: string;
  confidence: 'high' | 'medium' | 'low';
  priority: 1 | 2 | 3 | 4 | 5; // Phase priority
  data: any;
}

const SmartInvestmentStack: React.FC<SmartInvestmentStackProps> = ({
  investmentDecision
}) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [unlockedPhases, setUnlockedPhases] = useState<Set<number>>(new Set([1])); // Phase 1 always unlocked

  // Generate smart cards based on available data and user interaction
  const generateSmartCards = (): SmartCard[] => {
    const cards: SmartCard[] = [];

    // Phase 1: Strategic Timeline (Always available)
    cards.push({
      id: 'timeline',
      title: 'Strategic Timeline',
      subtitle: investmentDecision.verdict,
      icon: AccessTime,
      preview: 'Based on your 4-5 year strategy',
      confidence: 'high',
      priority: 1,
      data: {
        timeline: '4-5 years',
        strategy: 'Appreciation focus',
        reasoning: investmentDecision.goalBasedReasoning
      }
    });

    // Phase 2A: Market Intelligence (Unlocked after timeline interaction)
    if (unlockedPhases.has(2) || expandedCard === 'timeline') {
      cards.push({
        id: 'market',
        title: 'Market Intelligence',
        subtitle: 'Anna, TX - Tier 3 Market',
        icon: LocationOn,
        preview: '1.5% vs 3.2% market median',
        confidence: 'high',
        priority: 2,
        data: {
          marketTier: 3,
          yourCapRate: 1.5,
          marketMedian: 3.2,
          fairValue: 280000,
          currentPrice: 415000,
          overpriced: 40
        }
      });
    }

    // Phase 2B: Property Class (Unlocked after market analysis)
    if (unlockedPhases.has(3) || expandedCard === 'market') {
      cards.push({
        id: 'property-class',
        title: 'Property Assessment',
        subtitle: 'Class C Property (1970)',
        icon: CompareArrows,
        preview: 'Higher maintenance, active management needed',
        confidence: 'medium',
        priority: 3,
        data: {
          propertyClass: 'C',
          yearBuilt: 1970,
          maintenanceReserve: 500,
          managementIntensity: 'high'
        }
      });
    }

    // Phase 3: Strategy Alignment (Unlocked after property assessment)
    if (unlockedPhases.has(4) || expandedCard === 'property-class') {
      cards.push({
        id: 'strategy',
        title: 'Strategy Mismatch Alert',
        subtitle: 'Appreciation focus in cash flow market',
        icon: Psychology,
        preview: 'Consider Dallas core for appreciation',
        confidence: 'high',
        priority: 4,
        data: {
          mismatch: true,
          recommendation: 'Dallas core markets',
          opportunityCost: 137000
        }
      });
    }

    return cards;
  };

  const smartCards = generateSmartCards();

  const handleCardClick = (cardId: string) => {
    // Progressive disclosure: clicking a card unlocks the next phase
    const card = smartCards.find(c => c.id === cardId);
    if (card) {
      setExpandedCard(expandedCard === cardId ? null : cardId);
      
      // Unlock next phase
      if (card.priority < 5) {
        setUnlockedPhases(prev => new Set([...prev, card.priority + 1]));
      }
    }
  };

  const getCardColor = (confidence: 'high' | 'medium' | 'low', verdict: string) => {
    if (verdict === 'PASS') {
      return confidence === 'high' ? appleColors.red[500] : appleColors.orange[500];
    }
    if (verdict === 'BUY') {
      return confidence === 'high' ? appleColors.green[500] : appleColors.blue[500];
    }
    return appleColors.orange[500]; // NEGOTIATE
  };

  return (
    <Box sx={{ mb: 4 }}>
      {/* Primary Hero Card - Always Visible */}
      <Card
        sx={{
          borderRadius: '24px',
          mb: 3,
          background: `linear-gradient(135deg, ${getCardColor('high', investmentDecision.verdict)}15, ${getCardColor('high', investmentDecision.verdict)}05)`,
          border: `2px solid ${getCardColor('high', investmentDecision.verdict)}30`,
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h3" fontWeight={800} color={getCardColor('high', investmentDecision.verdict)}>
                {investmentDecision.verdict}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                {investmentDecision.confidence}% Confidence • Market Intelligence Available
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, maxWidth: 600 }}>
                {investmentDecision.goalBasedReasoning || investmentDecision.primaryReason}
              </Typography>
            </Box>
            <Chip
              label={`Score: ${investmentDecision.score || 'N/A'}/100`}
              sx={{
                backgroundColor: getCardColor('high', investmentDecision.verdict),
                color: 'white',
                fontSize: '16px',
                height: 40,
                fontWeight: 600
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Smart Card Stack - Progressive Disclosure */}
      <Stack spacing={2}>
        {smartCards.map((card, index) => (
          <Grow
            key={card.id}
            in={unlockedPhases.has(card.priority)}
            timeout={500 + index * 200}
          >
            <Card
              sx={{
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: expandedCard === card.id ? 'scale(1.02)' : 'scale(1)',
                boxShadow: expandedCard === card.id ? '0 8px 32px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
                border: expandedCard === card.id ? `2px solid ${appleColors.blue[500]}` : '1px solid rgba(0,0,0,0.08)',
                '&:hover': {
                  transform: 'scale(1.01)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                }
              }}
            >
              <CardActionArea onClick={() => handleCardClick(card.id)}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: '12px',
                          backgroundColor: `${appleColors.blue[500]}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {React.createElement(card.icon, { sx: { fontSize: 24, color: appleColors.blue[500] } })}
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {card.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {card.subtitle}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {card.preview}
                      </Typography>
                      <ChevronRight 
                        sx={{ 
                          fontSize: 20,
                          transform: expandedCard === card.id ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s'
                        }} 
                      />
                    </Box>
                  </Box>

                  {/* Expanded Content */}
                  <Fade in={expandedCard === card.id}>
                    <Box sx={{ mt: expandedCard === card.id ? 3 : 0 }}>
                      {expandedCard === card.id && (
                        <Card sx={{ backgroundColor: appleColors.gray[50], border: 'none' }}>
                          <CardContent sx={{ p: 3 }}>
                            {card.id === 'timeline' && (
                              <Box>
                                <Typography variant="h6" gutterBottom>Your Investment Strategy</Typography>
                                <Typography variant="body1" paragraph>
                                  Timeline: {card.data.timeline}
                                </Typography>
                                <Typography variant="body1" paragraph>
                                  Strategy: {card.data.strategy}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {card.data.reasoning}
                                </Typography>
                              </Box>
                            )}

                            {card.id === 'market' && (
                              <Box>
                                <Typography variant="h6" gutterBottom>Market Analysis</Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">Your Cap Rate</Typography>
                                    <Typography variant="h5" color="error">{card.data.yourCapRate}%</Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">Market Median</Typography>
                                    <Typography variant="h5" color="success.main">{card.data.marketMedian}%</Typography>
                                  </Box>
                                </Box>
                                <Typography variant="body2" color="error">
                                  Overpriced by {card.data.overpriced}% - Fair value: ${card.data.fairValue.toLocaleString()}
                                </Typography>
                              </Box>
                            )}

                            {card.id === 'property-class' && (
                              <Box>
                                <Typography variant="h6" gutterBottom>Property Risk Assessment</Typography>
                                <Chip 
                                  label={`Class ${card.data.propertyClass} Property`}
                                  color="warning"
                                  sx={{ mb: 2 }}
                                />
                                <Typography variant="body2">
                                  Built in {card.data.yearBuilt} - Requires ${card.data.maintenanceReserve}/month maintenance reserve
                                </Typography>
                              </Box>
                            )}

                            {card.id === 'strategy' && (
                              <Box>
                                <Typography variant="h6" gutterBottom>Strategy Alignment</Typography>
                                <Typography variant="body1" color="warning.main" paragraph>
                                  ⚠️ Strategy Mismatch Detected
                                </Typography>
                                <Typography variant="body2">
                                  For appreciation focus, consider {card.data.recommendation} instead.
                                  Current approach has ${card.data.opportunityCost.toLocaleString()} opportunity cost.
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </Box>
                  </Fade>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grow>
        ))}
      </Stack>

      {/* Next Phase Teaser */}
      {unlockedPhases.size < 5 && (
        <Card
          sx={{
            mt: 2,
            borderRadius: '16px',
            border: `2px dashed ${appleColors.gray[300]}`,
            backgroundColor: appleColors.gray[50]
          }}
        >
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              💡 More insights available as you explore • Tap cards above to unlock advanced analysis
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SmartInvestmentStack;