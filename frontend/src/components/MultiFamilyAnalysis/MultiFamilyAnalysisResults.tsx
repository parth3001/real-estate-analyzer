import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid as MuiGrid
} from '@mui/material';
import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';
import {
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import type { Analysis } from '../../types/analysis';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AssessmentIcon from '@mui/icons-material/Assessment';

const Grid = MuiGrid as React.ComponentType<{
  container?: boolean;
  item?: boolean;
  xs?: number;
  md?: number;
  sm?: number;
  spacing?: number;
  sx?: SxProps<Theme>;
  children?: React.ReactNode;
  key?: React.Key;
}>;

interface MultiFamilyAnalysisResultsProps {
  results: Analysis;
}

const MultiFamilyAnalysisResults: React.FC<MultiFamilyAnalysisResultsProps> = ({ results }) => {
  if (!results) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" align="center">
            No analysis results available. Please analyze a deal first.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const renderMainMetrics = () => {
    const metrics = [
      {
        label: 'Cap Rate',
        value: results.annualAnalysis?.capRate || 0,
        format: 'percent',
        icon: <AssessmentIcon />
      },
      {
        label: 'Cash on Cash Return',
        value: results.annualAnalysis?.cashOnCashReturn || 0,
        format: 'percent',
        icon: <TrendingUpIcon />
      },
      {
        label: 'DSCR',
        value: results.annualAnalysis?.dscr || 0,
        format: 'number',
        icon: <TrendingUpIcon />
      }
    ];

    return (
      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  {metric.icon}
                  <Typography variant="h6" component="div" ml={1}>
                    {metric.label}
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {metric.format === 'percent' 
                    ? `${(metric.value * 100).toFixed(2)}%`
                    : metric.value.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderAIAnalysis = () => {
    if (!results.aiInsights) return null;

    return (
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          AI Analysis
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Strengths
              </Typography>
              <List>
                {results.aiInsights.strengths?.map((strength, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary={strength} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Areas for Improvement
              </Typography>
              <List>
                {results.aiInsights.weaknesses?.map((weakness, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={weakness} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recommendations
              </Typography>
              <List>
                {results.aiInsights.recommendations?.map((recommendation, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <LightbulbIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={recommendation} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box mt={4}>
      {renderMainMetrics()}
      {renderAIAnalysis()}
    </Box>
  );
};

export default MultiFamilyAnalysisResults; 