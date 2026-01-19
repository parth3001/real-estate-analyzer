import React from 'react';
import { Box, Typography } from '@mui/material';
import { appleColors } from '../../theme/appleDesignSystem';
import { parseAIContent } from '../../utils/verdictUtils';

interface KeyAnalysisInsightsProps {
  content: string; // AI-generated commentary (multi-paragraph)
}

/**
 * KeyAnalysisInsights Component
 *
 * Parses AI commentary and adds section headers for better readability.
 * Strategy: Simple paragraph split, first 3 paragraphs get specific headers.
 *
 * Sections:
 * 1. Cash Flow Analysis
 * 2. Market Position
 * 3. Potential Improvements
 * 4+ Any remaining content (no header)
 *
 * Fallback: If content is single paragraph, show under "Investment Analysis"
 */
const KeyAnalysisInsights: React.FC<KeyAnalysisInsightsProps> = ({ content }) => {
  if (!content || content.trim() === '') {
    return (
      <Typography variant="body2" sx={{ color: appleColors.gray[600], fontStyle: 'italic' }}>
        Analysis insights unavailable
      </Typography>
    );
  }

  const parsed = parseAIContent(content);

  // Check if we have multiple paragraphs
  const hasMultipleParagraphs = parsed.marketPosition || parsed.improvement || parsed.remaining;

  // If single paragraph, show without section headers
  if (!hasMultipleParagraphs) {
    return (
      <Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: '18px',
            color: appleColors.gray[900],
            mb: 2,
          }}
        >
          Investment Analysis
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: appleColors.gray[800],
            fontWeight: 400,
          }}
        >
          {parsed.cashFlow}
        </Typography>
      </Box>
    );
  }

  // Multi-paragraph: show with section headers
  return (
    <Box>
      {/* Section 1: Cash Flow Analysis */}
      {parsed.cashFlow && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '16px',
              color: appleColors.gray[800],
              mb: 1,
            }}
          >
            Cash Flow Analysis
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: appleColors.gray[700],
              fontWeight: 400,
            }}
          >
            {parsed.cashFlow}
          </Typography>
        </Box>
      )}

      {/* Section 2: Market Position */}
      {parsed.marketPosition && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '16px',
              color: appleColors.gray[800],
              mb: 1,
            }}
          >
            Market Position
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: appleColors.gray[700],
              fontWeight: 400,
            }}
          >
            {parsed.marketPosition}
          </Typography>
        </Box>
      )}

      {/* Section 3: Potential Improvements */}
      {parsed.improvement && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '16px',
              color: appleColors.gray[800],
              mb: 1,
            }}
          >
            Potential Improvements
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: appleColors.gray[700],
              fontWeight: 400,
            }}
          >
            {parsed.improvement}
          </Typography>
        </Box>
      )}

      {/* Remaining paragraphs (no header) */}
      {parsed.remaining && (
        <Box>
          <Typography
            variant="body1"
            sx={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: appleColors.gray[700],
              fontWeight: 400,
              whiteSpace: 'pre-line',
            }}
          >
            {parsed.remaining}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default KeyAnalysisInsights;
