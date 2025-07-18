import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Tooltip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  useTheme,
  alpha,
} from '@mui/material';
import {
  AutoAwesome,
  TrendingUp,
  Warning,
  QuestionAnswer,
} from '@mui/icons-material';

// Import the existing types from analysis.ts
import type { ScoreBreakdown } from '../../types/analysis';

export interface AIControlCenterProps {
  investmentScore: number | null;
  scoreBreakdown?: ScoreBreakdown;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  summary?: string;
  onAskAI?: (question: string) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * AI Control Center Component
 * 
 * Intelligently organizes and prioritizes metrics based on AI analysis
 * Solves metric overload by showing what matters most for each deal
 */
const AIControlCenter: React.FC<AIControlCenterProps> = ({
  investmentScore,
  scoreBreakdown,
  strengths = [],
  weaknesses = [],
  recommendations = [],
  summary,
  onAskAI,
  isLoading = false,
  className,
}) => {
  const theme = useTheme();
  const [askAIOpen, setAskAIOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');

  // Get recommendation based on score
  const getRecommendation = (score: number | null): string => {
    if (!score) return 'Analyzing...';
    if (score >= 80) return 'Strong Buy';
    if (score >= 65) return 'Buy';
    if (score >= 50) return 'Hold';
    if (score >= 35) return 'Pass';
    return 'Strong Pass';
  };

  // Recommendation color mapping
  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Strong Buy':
        return theme.palette.success.main;
      case 'Buy':
        return theme.palette.success.light;
      case 'Hold':
        return theme.palette.warning.main;
      case 'Pass':
        return theme.palette.error.light;
      case 'Strong Pass':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Score color mapping
  const getScoreColor = (score: number) => {
    if (score >= 70) return theme.palette.success.main;
    if (score >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const handleAskAI = () => {
    if (onAskAI && aiQuestion.trim()) {
      onAskAI(aiQuestion);
      setAiQuestion('');
      setAskAIOpen(false);
    }
  };

  const recommendation = getRecommendation(investmentScore);
  const displayScore = investmentScore || 0;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <AutoAwesome sx={{ color: 'primary.main' }} />
            <Typography variant="h6">AI Analysis Loading...</Typography>
          </Box>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  // Category scores for display
  const categoryScores: Array<{
    category: string;
    score: number;
    maxScore: number;
    insight: string;
  }> = [];

  if (scoreBreakdown) {
    if (scoreBreakdown.cashFlow) {
      categoryScores.push({
        category: 'Cash Flow',
        score: scoreBreakdown.cashFlow.score,
        maxScore: scoreBreakdown.cashFlow.max,
        insight: scoreBreakdown.cashFlow.reason,
      });
    }
    if (scoreBreakdown.marketPosition) {
      categoryScores.push({
        category: 'Market Position',
        score: scoreBreakdown.marketPosition.score,
        maxScore: scoreBreakdown.marketPosition.max,
        insight: scoreBreakdown.marketPosition.reason,
      });
    }
    if (scoreBreakdown.financialMetrics) {
      categoryScores.push({
        category: 'Financial Metrics',
        score: scoreBreakdown.financialMetrics.score,
        maxScore: scoreBreakdown.financialMetrics.max,
        insight: scoreBreakdown.financialMetrics.reason,
      });
    }
    if (scoreBreakdown.riskAssessment) {
      categoryScores.push({
        category: 'Risk Assessment',
        score: scoreBreakdown.riskAssessment.score,
        maxScore: scoreBreakdown.riskAssessment.max,
        insight: scoreBreakdown.riskAssessment.reason,
      });
    }
  }

  return (
    <>
      <Card 
        className={className}
        sx={{ 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme.shadows[4],
          }
        }}
      >
        <CardContent>
          {/* Header Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  color: 'white',
                }}
              >
                <AutoAwesome sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  AI Deal Intelligence
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Powered by advanced market analysis
                </Typography>
              </Box>
            </Box>
            
            {onAskAI && (
              <Button
                variant="outlined"
                startIcon={<QuestionAnswer />}
                onClick={() => setAskAIOpen(true)}
                sx={{ borderRadius: 2 }}
              >
                Ask AI
              </Button>
            )}
          </Box>

          {/* AI Decision Summary */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <Typography variant="h2" fontWeight={700} color={getScoreColor(displayScore)}>
                  {displayScore.toFixed(0)}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  / 100
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Chip
                  label={recommendation}
                  size="medium"
                  sx={{
                    px: 3,
                    height: 40,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    bgcolor: alpha(getRecommendationColor(recommendation), 0.15),
                    color: getRecommendationColor(recommendation),
                    border: `2px solid ${getRecommendationColor(recommendation)}`,
                  }}
                />
                {summary && (
                  <Typography variant="body1" sx={{ mt: 1, fontStyle: 'italic' }}>
                    "{summary}"
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Category Scores */}
          {categoryScores.length > 0 && (
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              {categoryScores.map((category, index) => (
                <Tooltip key={index} title={category.insight} arrow>
                  <Card
                    sx={{
                      flex: 1,
                      bgcolor: alpha(getScoreColor(category.score), 0.05),
                      border: `1px solid ${alpha(getScoreColor(category.score), 0.2)}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[2],
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {category.category}
                      </Typography>
                      <Typography variant="h5" fontWeight={600} color={getScoreColor(category.score)}>
                        {category.score}/{category.maxScore}
                      </Typography>
                    </CardContent>
                  </Card>
                </Tooltip>
              ))}
            </Stack>
          )}

          {/* AI Guidance - What You Need to Know */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              🎯 What AI Found - Focus Here
            </Typography>
            
            {/* Why This Score */}
            <Stack spacing={2}>
              {strengths.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="success.main" fontWeight={600} sx={{ mb: 1 }}>
                    ✅ Why This Scores Well:
                  </Typography>
                  {strengths.slice(0, 2).map((strength, index) => (
                    <Typography key={index} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                      • {strength}
                    </Typography>
                  ))}
                </Box>
              )}

              {weaknesses.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="error.main" fontWeight={600} sx={{ mb: 1 }}>
                    ⚠️ Key Concerns to Verify:
                  </Typography>
                  {weaknesses.slice(0, 2).map((weakness, index) => (
                    <Typography key={index} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                      • {weakness}
                    </Typography>
                  ))}
                </Box>
              )}

              {recommendations.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="primary.main" fontWeight={600} sx={{ mb: 1 }}>
                    💡 AI Recommendations:
                  </Typography>
                  {recommendations.slice(0, 2).map((rec, index) => (
                    <Typography key={index} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                      • {rec}
                    </Typography>
                  ))}
                </Box>
              )}
            </Stack>

            {/* Action Buttons */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<TrendingUp />}
                onClick={() => {
                  // Future: Scroll to key metrics
                  document.getElementById('key-metrics')?.scrollIntoView({ behavior: 'smooth' });
                }}
                sx={{ borderRadius: 2 }}
              >
                View Key Metrics
              </Button>
              {displayScore < 70 && (
                <Button
                  variant="outlined"
                  startIcon={<Warning />}
                  onClick={() => {
                    // Future: Scroll to risk analysis
                    document.getElementById('advanced-metrics')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  color="warning"
                  sx={{ borderRadius: 2 }}
                >
                  Check Risks
                </Button>
              )}
              {onAskAI && (
                <Button
                  variant="outlined"
                  startIcon={<QuestionAnswer />}
                  onClick={() => setAskAIOpen(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Ask AI
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Ask AI Dialog */}
      <Dialog
        open={askAIOpen}
        onClose={() => setAskAIOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome sx={{ color: 'primary.main' }} />
            Ask AI About This Property
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={3}
            fullWidth
            placeholder="What would you like to know about this investment opportunity?"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAskAIOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAskAI}
            variant="contained"
            disabled={!aiQuestion.trim()}
          >
            Ask AI
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AIControlCenter;