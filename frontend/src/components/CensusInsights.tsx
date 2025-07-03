import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CompareIcon from '@mui/icons-material/Compare';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';

// Define the interface directly in the component
interface CensusInsight {
  type: 'positive' | 'negative' | 'neutral';
  text: string;
  category: 'value' | 'rent' | 'demographic' | 'market' | 'general';
  confidence?: number;
  source?: string;
}

interface CensusInsightsProps {
  insights: CensusInsight[];
  title?: string;
}

/**
 * Census Insights Component
 * 
 * Displays census-based insights with visual indicators for positive/negative insights.
 */
const CensusInsights: React.FC<CensusInsightsProps> = ({
  insights = [],
  title = 'Census Data Insights',
}) => {
  const theme = useTheme();

  // Get appropriate icon for insight category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'value':
        return <PriceCheckIcon />;
      case 'rent':
        return <AssessmentIcon />;
      case 'demographic':
        return <CompareIcon />;
      case 'market':
        return <TrendingUpIcon />;
      default:
        return <AssessmentIcon />;
    }
  };

  // Get appropriate color for insight type
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive':
        return theme.palette.success.main;
      case 'negative':
        return theme.palette.error.main;
      default:
        return theme.palette.info.main;
    }
  };

  // Group insights by category
  const groupedInsights = insights.reduce((acc, insight) => {
    if (!acc[insight.category]) {
      acc[insight.category] = [];
    }
    acc[insight.category].push(insight);
    return acc;
  }, {} as Record<string, CensusInsight[]>);

  // Category display names
  const categoryNames: Record<string, string> = {
    value: 'Property Value',
    rent: 'Rental Market',
    demographic: 'Demographics',
    market: 'Market Trends',
    general: 'General Insights',
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AssessmentIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6">{title}</Typography>
        </Box>
        
        {Object.keys(groupedInsights).length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No census insights available for this property.
          </Typography>
        ) : (
          Object.entries(groupedInsights).map(([category, categoryInsights], index) => (
            <Box key={category} sx={{ mb: 2 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  pb: 0.5,
                  mb: 1
                }}
              >
                {categoryNames[category] || category}
              </Typography>
              
              <List dense disablePadding>
                {categoryInsights.map((insight, i) => (
                  <ListItem key={i} alignItems="flex-start" sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {insight.type === 'positive' ? (
                        <TrendingUpIcon sx={{ color: getInsightColor(insight.type) }} />
                      ) : insight.type === 'negative' ? (
                        <TrendingDownIcon sx={{ color: getInsightColor(insight.type) }} />
                      ) : (
                        getCategoryIcon(category)
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: getInsightColor(insight.type),
                            fontWeight: 500
                          }}
                        >
                          Census Data: {insight.text}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default CensusInsights;
