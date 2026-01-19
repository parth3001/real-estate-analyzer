/**
 * Utility functions for Investment Decision display
 * Used by redesigned UI components (non-directive analytical presentation)
 */

/**
 * Get contextual description for Deal Quality score
 * @param score Deal Quality score (0-100)
 * @returns Context text describing score range
 */
export function getScoreContext(score: number): string {
  if (score >= 80) {
    return "Above professional standards";
  }
  if (score >= 65) {
    return "Meets professional standards";
  }
  if (score >= 50) {
    return "Requires optimization to meet professional standards";
  }
  return "Below professional standards";
}

/**
 * Parse AI-generated commentary into structured sections
 * Strategy: Simple paragraph split by double newlines
 * @param content AI commentary text (multi-paragraph string)
 * @returns Object with categorized content sections
 */
export function parseAIContent(content: string): {
  cashFlow: string;
  marketPosition: string;
  improvement: string;
  remaining: string;
} {
  if (!content || content.trim() === '') {
    return {
      cashFlow: '',
      marketPosition: '',
      improvement: '',
      remaining: '',
    };
  }

  // Split by double newlines, filter empty paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  // Assign first 3 paragraphs to specific sections
  return {
    cashFlow: paragraphs[0] || '',
    marketPosition: paragraphs[1] || '',
    improvement: paragraphs[2] || '',
    remaining: paragraphs.slice(3).join('\n\n'), // Everything else
  };
}
