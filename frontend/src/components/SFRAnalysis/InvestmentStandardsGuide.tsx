import React from 'react';
import { Box, Typography } from '@mui/material';
import { appleColors } from '../../theme/appleDesignSystem';

interface InvestmentStandardsGuideProps {
  currentScore: number;
}

const InvestmentStandardsGuide: React.FC<InvestmentStandardsGuideProps> = ({ currentScore }) => {
  const scoreRanges = [
    {
      range: '80-100',
      label: 'Strong Fundamentals',
      icon: '✅',
      color: appleColors.green[600],
      description: 'Professional investors typically target this range',
      benchmarks: [
        'Positive cash flow: $200+/month',
        'Strong returns: IRR 10%+',
        'Solid financing: DSCR 1.4x+',
      ],
    },
    {
      range: '60-79',
      label: 'Acceptable',
      icon: '✅',
      color: appleColors.blue[600],
      description: 'May work with specific strategies or optimization',
      benchmarks: [
        'Modest cash flow: $50-200/month',
        'Moderate returns: IRR 8-10%',
        'Adequate financing: DSCR 1.25-1.4x',
      ],
    },
    {
      range: '40-59',
      label: 'Below Target',
      icon: '⚠️',
      color: appleColors.orange[600],
      description: 'Significant improvements needed',
      benchmarks: [
        'Breakeven or slight negative cash flow',
        'Weak returns: IRR 5-8%',
        'Challenging financing: DSCR 1.0-1.25x',
      ],
      recommendation: 'Consider negotiating 10-15% lower price',
    },
    {
      range: '20-39',
      label: 'Weak Fundamentals',
      icon: '⚠️',
      color: '#FF6B35',
      description: 'Professional investors typically pass',
      benchmarks: [
        'Negative cash flow: -$200 to $0/month',
        'Poor returns: IRR 3-5%',
        'Difficult financing: DSCR <1.0x',
      ],
      recommendation: 'Requires 20%+ price reduction or major improvements',
      highlight: currentScore >= 20 && currentScore < 40,
    },
    {
      range: '0-19',
      label: 'Critical Issues',
      icon: '🛑',
      color: appleColors.red[600],
      description: 'Fundamental issues make this unsuitable for most investors',
      benchmarks: [
        'Severely negative cash flow: $-200+/month',
        'Very poor returns: IRR <3%',
        'Unlikely to qualify for financing',
      ],
    },
  ];

  return (
    <Box sx={{ py: 2 }}>
      <Typography
        variant="body2"
        sx={{
          fontSize: '14px',
          color: appleColors.gray[700],
          mb: 3,
        }}
      >
        Understanding Your Deal Quality Score:
      </Typography>

      {scoreRanges.map((range, index) => (
        <Box
          key={index}
          sx={{
            mb: 3,
            p: 2,
            backgroundColor: range.highlight ? appleColors.orange[50] : 'transparent',
            borderRadius: '8px',
            borderLeft: range.highlight ? `4px solid ${range.color}` : 'none',
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ fontSize: '18px', mr: 1 }}>
              {range.icon}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontSize: '16px',
                fontWeight: 700,
                color: range.color,
              }}
            >
              {range.range}: {range.label}
            </Typography>
            {range.highlight && (
              <Typography
                sx={{
                  ml: 'auto',
                  fontSize: '12px',
                  color: range.color,
                  fontWeight: 600,
                }}
              >
                ← Your property is here
              </Typography>
            )}
          </Box>

          {/* Description */}
          <Typography
            variant="body2"
            sx={{
              fontSize: '13px',
              color: appleColors.gray[600],
              mb: 1.5,
              fontStyle: 'italic',
            }}
          >
            {range.description}
          </Typography>

          {/* Benchmarks */}
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {range.benchmarks.map((benchmark, i) => (
              <Typography
                key={i}
                component="li"
                variant="body2"
                sx={{
                  fontSize: '12px',
                  color: appleColors.gray[700],
                  lineHeight: 1.6,
                }}
              >
                {benchmark}
              </Typography>
            ))}
          </Box>

          {/* Recommendation */}
          {range.recommendation && (
            <Typography
              variant="body2"
              sx={{
                fontSize: '12px',
                color: range.color,
                fontWeight: 600,
                mt: 1,
              }}
            >
              💡 {range.recommendation}
            </Typography>
          )}
        </Box>
      ))}

      {/* Factor Weights Reference */}
      <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${appleColors.gray[200]}` }}>
        <Typography
          variant="caption"
          sx={{
            fontSize: '12px',
            color: appleColors.gray[600],
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.3,
            display: 'block',
            mb: 1.5,
          }}
        >
          📖 Professional Factor Weights
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          {[
            'Cash Flow (35% weight): Monthly rental income minus all expenses',
            'IRR (25% weight): Total return over your investment period',
            'Market Strength (15% weight): Local market fundamentals',
            'Debt Structure (10% weight): Quality of financing terms',
            'Exit Strategy (10% weight): Liquidity and exit options',
            'Cap Rate (3% weight): Current yield vs market',
            'Property Risk (2% weight): Property quality and age',
          ].map((factor, i) => (
            <Typography
              key={i}
              component="li"
              variant="body2"
              sx={{
                fontSize: '11px',
                color: appleColors.gray[600],
                lineHeight: 1.6,
              }}
            >
              {factor}
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default InvestmentStandardsGuide;
