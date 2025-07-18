// Persona-Based AI Control Center
// Created: July 15, 2025

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  Select,
  Tooltip,
  LinearProgress,
  Alert,
  GridLegacy as Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  ExpandMore,
  Settings,
  Info,
  School,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  LightbulbOutlined
} from '@mui/icons-material';
import { usePersona, usePersonaConfig, usePersonaFeature, usePersonaAnalytics } from '../../contexts/PersonaContext';
import { UserPersona } from '../../types/persona';
import type { PersonaSpecificData } from '../../types/persona';
import type { Analysis } from '../../types/analysis';
import type { SFRPropertyData } from '../../types/property';

interface PersonaAIControlCenterProps {
  analysisData: Analysis;
  propertyData: SFRPropertyData;
  onPersonaChange?: (persona: UserPersona) => void;
  onViewDetails?: () => void;
  onSaveAnalysis?: () => void;
}

const PersonaAIControlCenter: React.FC<PersonaAIControlCenterProps> = ({
  analysisData,
  propertyData,
  onPersonaChange,
  onViewDetails,
  onSaveAnalysis
}) => {
  const { 
    persona, 
    setPersona, 
    transformData, 
    isLoading, 
    error,
    availablePersonas 
  } = usePersona();
  
  const personaConfig = usePersonaConfig();
  const showEducationalTooltips = usePersonaFeature('showEducationalTooltips');
  const { trackMetricView, trackInsightExpand, trackActionClick } = usePersonaAnalytics();
  
  const [personaData, setPersonaData] = useState<PersonaSpecificData | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Transform data when persona or analysis changes
  useEffect(() => {
    if (analysisData && propertyData) {
      try {
        const transformed = transformData(analysisData, propertyData);
        setPersonaData(transformed);
      } catch (err) {
        console.error('Error transforming data:', err);
      }
    }
  }, [analysisData, propertyData, persona, transformData]);

  // Handle persona change
  const handlePersonaChange = (newPersona: UserPersona) => {
    setPersona(newPersona);
    onPersonaChange?.(newPersona);
    setAnchorEl(null);
  };

  // Handle menu
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Suppress unused variable warnings
  void onViewDetails;
  void onSaveAnalysis;

  // Get status color for metrics
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      case 'warning': return 'warning';
      default: return 'default';
    }
  };

  // Get verdict color and text
  const getVerdictDisplay = (verdict: string) => {
    switch (verdict) {
      case 'strong_buy': return { color: 'success', text: 'STRONG BUY', icon: <CheckCircle /> };
      case 'buy': return { color: 'success', text: 'BUY', icon: <CheckCircle /> };
      case 'hold': return { color: 'warning', text: 'HOLD', icon: <Warning /> };
      case 'pass': return { color: 'error', text: 'PASS', icon: <Error /> };
      case 'avoid': return { color: 'error', text: 'AVOID', icon: <Error /> };
      default: return { color: 'default', text: 'ANALYZING', icon: <Info /> };
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          🤖 AI Analysis in Progress...
        </Typography>
        <LinearProgress />
      </Paper>
    );
  }

  // Render error state
  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load AI analysis: {error}
        </Alert>
      </Paper>
    );
  }

  // Render empty state
  if (!personaData) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6">
          🤖 No analysis data available
        </Typography>
      </Paper>
    );
  }

  const verdictDisplay = getVerdictDisplay(personaData.summary.verdict);

  // Render based on persona
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        mb: 2,
        maxHeight: '600px',
        overflowY: 'auto',
        background: persona === UserPersona.LEARNING ? 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' : 'default'
      }}
    >
      {/* Header with persona selector */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6" component="div">
            {personaConfig.icon} AI {personaConfig.name}
          </Typography>
          <Chip 
            label={personaConfig.timeToAnalyze} 
            size="small" 
            variant="outlined"
          />
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={persona}
              onChange={(e: SelectChangeEvent) => handlePersonaChange(e.target.value as UserPersona)}
              displayEmpty
            >
              {Object.values(UserPersona).map((p) => (
                <MenuItem key={p} value={p}>
                  {availablePersonas[p].icon} {availablePersonas[p].name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <IconButton onClick={handleMenuClick}>
            <Settings />
          </IconButton>
        </Box>
      </Box>

      {/* Main AI Summary */}
      <Box mb={3}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Chip 
            icon={verdictDisplay.icon}
            label={verdictDisplay.text}
            color={verdictDisplay.color as any}
            size="medium"
            sx={{ fontWeight: 'bold' }}
          />
          <Typography variant="h6">
            {personaData.summary.score}/100
          </Typography>
          {personaData.summary.confidence && (
            <Chip 
              label={`${personaData.summary.confidence}% confidence`} 
              size="small" 
              variant="outlined"
            />
          )}
        </Box>

        {/* Persona-specific intro message */}
        {persona === UserPersona.LEARNING && (
          <Typography variant="body1" color="text.secondary" mb={2}>
            💡 Let me walk you through this ${propertyData.propertyAddress?.city || 'property'} analysis step by step...
          </Typography>
        )}
        
        {persona === UserPersona.SPEED_SCANNER && (
          <Typography variant="body1" color="text.secondary" mb={2}>
            ⚡ Deal scan completed in 0.3 seconds
          </Typography>
        )}
      </Box>

      {/* Core Metrics */}
      <Box mb={2}>
        <Typography variant="subtitle1" gutterBottom>
          {persona === UserPersona.LEARNING ? '📊 Key Numbers You Should Know' : '📊 Key Metrics'}
        </Typography>
        
        <Grid container spacing={1}>
          {personaData.coreMetrics.slice(0, 4).map((metric) => (
            <Grid item xs={6} sm={3} key={metric.id}>
              <Card 
                variant="outlined" 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 2 }
                }}
                onClick={() => trackMetricView(metric.id)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {metric.name}
                    </Typography>
                    <Chip 
                      size="small" 
                      color={getStatusColor(metric.status) as any}
                      label={metric.status}
                    />
                  </Box>
                  
                  <Typography variant="h6" component="div" mt={1}>
                    {metric.value}
                  </Typography>
                  
                  {showEducationalTooltips && metric.educationalContent && (
                    <Tooltip title={metric.educationalContent.tooltip}>
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        💡 {metric.educationalContent.whyItMatters}
                      </Typography>
                    </Tooltip>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Key Insights */}
      <Box mb={2}>
        <Typography variant="subtitle1" gutterBottom>
          {persona === UserPersona.LEARNING ? '🎯 What This Means For You' : '🎯 Key Insights'}
        </Typography>
        
        <List dense>
          {personaData.insights.slice(0, persona === UserPersona.SPEED_SCANNER ? 2 : 3).map((insight) => (
            <ListItem key={insight.id}>
              <ListItemIcon>
                {insight.type === 'strength' && <TrendingUp color="success" />}
                {insight.type === 'weakness' && <Warning color="warning" />}
                {insight.type === 'risk' && <Error color="error" />}
                {insight.type === 'opportunity' && <LightbulbOutlined color="info" />}
              </ListItemIcon>
              <ListItemText
                primary={insight.title}
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {insight.description}
                    </Typography>
                    {showEducationalTooltips && insight.educationalContent && (
                      <Button
                        size="small"
                        startIcon={<School />}
                        onClick={() => trackInsightExpand(insight.id)}
                        sx={{ mt: 1 }}
                      >
                        Learn More
                      </Button>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Risk Alerts */}
      {personaData.summary.riskAlerts.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle1" gutterBottom color="warning.main">
            ⚠️ Things to Watch
          </Typography>
          <List dense>
            {personaData.summary.riskAlerts.slice(0, 2).map((alert, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <Warning color="warning" />
                </ListItemIcon>
                <ListItemText primary={alert} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Next Steps */}
      <Box mb={2}>
        <Typography variant="subtitle1" gutterBottom>
          {persona === UserPersona.LEARNING ? '🎯 Your Next Steps' : '🎯 Next Steps'}
        </Typography>
        <List dense>
          {personaData.summary.nextSteps.slice(0, 3).map((step, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Typography variant="body2" color="primary">
                  {index + 1}.
                </Typography>
              </ListItemIcon>
              <ListItemText primary={step} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Action Buttons */}
      <Box display="flex" gap={2} flexWrap="wrap">
        {personaData.actions.map((action) => (
          <Button
            key={action.id}
            variant={action.type === 'primary' ? 'contained' : 'outlined'}
            color={action.type === 'warning' ? 'warning' : 'primary'}
            startIcon={action.icon}
            onClick={() => {
              action.onClick();
              trackActionClick(action.id);
            }}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        ))}
      </Box>

      {/* Educational Progress (Learning Persona Only) */}
      {persona === UserPersona.LEARNING && personaData.educational && (
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">📚 Learning Progress</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Concepts introduced in this analysis:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {personaData.educational.conceptsIntroduced.map((concept) => (
                <Chip key={concept} label={concept} size="small" variant="outlined" />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Settings Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <Settings sx={{ mr: 2 }} />
          Preferences
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Info sx={{ mr: 2 }} />
          About This Persona
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default PersonaAIControlCenter;