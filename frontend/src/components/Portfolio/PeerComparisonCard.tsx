import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip
} from '@mui/material';
import {
  TrendingUp
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import type { PeerComparisonInsights } from '../../services/portfolioAIApi';

interface PeerComparisonCardProps {
  insights: PeerComparisonInsights;
}

const PeerComparisonCard: React.FC<PeerComparisonCardProps> = ({ insights }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrendingUp sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ ml: 1, fontWeight: 'medium' }}>
            Peer Comparison Analysis
          </Typography>
          <Chip
            label="AI Insights"
            color="primary"
            size="small"
            sx={{ ml: 'auto' }}
          />
        </Box>
        
        <Box sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, mt: 3, color: 'text.primary' }}>
                  {children}
                </Typography>
              ),
              h2: ({ children }) => (
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1.5, mt: 2, color: 'text.primary' }}>
                  {children}
                </Typography>
              ),
              h3: ({ children }) => (
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, mt: 1.5, color: 'primary.main' }}>
                  {children}
                </Typography>
              ),
              h4: ({ children }) => (
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, mt: 1, color: 'text.primary' }}>
                  {children}
                </Typography>
              ),
              p: ({ children }) => (
                <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>
                  {children}
                </Typography>
              ),
              strong: ({ children }) => (
                <Typography component="span" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  {children}
                </Typography>
              ),
              ul: ({ children }) => (
                <Box component="ul" sx={{ pl: 3, mb: 1.5 }}>
                  {children}
                </Box>
              ),
              li: ({ children }) => (
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                  {children}
                </Typography>
              )
            }}
          >
            {insights.content}
          </ReactMarkdown>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PeerComparisonCard;