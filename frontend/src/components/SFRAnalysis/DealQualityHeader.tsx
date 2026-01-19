import React from 'react';
import { Typography, Card } from '@mui/material';
import { appleColors } from '../../theme/appleDesignSystem';
import { getScoreContext } from '../../utils/verdictUtils';

interface DealQualityHeaderProps {
  score: number; // 0-100 from professionalAssessment.dealQuality
}

/**
 * DealQualityHeader Component
 *
 * Displays Deal Quality score (0-100) with contextual description.
 * Replaces directive verdict badges with neutral analytical presentation.
 *
 * Design: Apple-inspired neutral gray theme, no color-coded judgments
 */
const DealQualityHeader: React.FC<DealQualityHeaderProps> = ({ score }) => {
  const context = getScoreContext(score);

  return (
    <Card
      sx={{
        p: 4, // UX Enhancement: More padding for visual weight
        backgroundColor: 'white', // UX Enhancement: White background (not gray) for prominence
        borderRadius: '16px', // UX Enhancement: Larger radius
        border: `2px solid ${appleColors.gray[200]}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)', // UX Enhancement: Subtle shadow for elevation
        textAlign: 'center',
      }}
    >
      {/* Label */}
      <Typography
        variant="caption"
        sx={{
          color: appleColors.gray[600],
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontSize: '12px',
          display: 'block',
          mb: 2, // Increased spacing
        }}
      >
        Deal Quality Score
      </Typography>

      {/* Score - UX Enhancement: Much larger for visual dominance */}
      <Typography
        variant="h1"
        sx={{
          fontWeight: 800, // UX Enhancement: Heavier weight
          color: appleColors.gray[900],
          fontSize: '96px', // UX Enhancement: 48px → 96px (2x larger)
          lineHeight: 1,
          mb: 1.5,
          letterSpacing: '-0.02em', // UX Enhancement: Tighter spacing for large numbers
        }}
      >
        {Math.round(score)}
        <Typography
          component="span"
          sx={{
            fontSize: '56px', // UX Enhancement: Proportionally larger
            color: appleColors.gray[500],
            fontWeight: 700,
            ml: 0.5,
          }}
        >
          /100
        </Typography>
      </Typography>

      {/* Context */}
      <Typography
        variant="body2"
        sx={{
          color: appleColors.gray[700],
          fontSize: '16px',
          fontWeight: 500,
          mt: 1,
        }}
      >
        {context}
      </Typography>
    </Card>
  );
};

export default DealQualityHeader;
