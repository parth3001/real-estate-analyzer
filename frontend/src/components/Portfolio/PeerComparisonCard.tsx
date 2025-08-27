import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Insights,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import type { PeerComparisonInsights } from '../../services/portfolioAIApi';

interface PeerComparisonCardProps {
  insights: PeerComparisonInsights;
}

const PeerComparisonCard: React.FC<PeerComparisonCardProps> = ({ insights }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Outperforming Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TrendingUp sx={{ color: 'success.main' }} />
            <Typography variant="h6" sx={{ ml: 1, fontWeight: 'medium' }}>
              You're Outperforming
            </Typography>
            <Chip
              label="Advantage"
              color="success"
              size="small"
              sx={{ ml: 'auto' }}
            />
          </Box>
          
          <List dense sx={{ mb: 1 }}>
            {insights.outperforming.metrics.map((metric, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary={metric}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
          
          <Alert severity="success" variant="outlined" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Your Advantage:</strong> {insights.outperforming.advantage}
            </Typography>
          </Alert>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Lagging Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TrendingDown sx={{ color: 'warning.main' }} />
            <Typography variant="h6" sx={{ ml: 1, fontWeight: 'medium' }}>
              Areas to Improve
            </Typography>
            <Chip
              label="Gap"
              color="warning"
              size="small"
              sx={{ ml: 'auto' }}
            />
          </Box>
          
          <List dense sx={{ mb: 1 }}>
            {insights.lagging.metrics.map((metric, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Warning sx={{ color: 'warning.main', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary={metric}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
          
          <Alert severity="warning" variant="outlined" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>The Gap:</strong> {insights.lagging.gap}
            </Typography>
          </Alert>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Why It Matters Section */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Insights sx={{ color: 'info.main' }} />
            <Typography variant="h6" sx={{ ml: 1, fontWeight: 'medium' }}>
              Why This Matters
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight="medium">
              Your Strengths
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {insights.whyItMatters.strengths}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight="medium">
              Key Concerns
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {insights.whyItMatters.concerns}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight="medium">
              Long-term Impact
            </Typography>
            <Typography variant="body2" color="info.main" fontWeight="medium">
              {insights.whyItMatters.longTermImpact}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PeerComparisonCard;