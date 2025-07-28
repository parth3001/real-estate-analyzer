import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Save as SaveIcon,
  Compare as CompareIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileDownload as ExportIcon,
  MoreVert as MoreIcon,
  TrendingUp as GainIcon,
  TrendingDown as LossIcon,
  Assessment as TimelineIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';
import type { SFRPropertyData } from '../../types/property';
import type { Analysis } from '../../types/analysis';

interface ScenarioManagerProps {
  currentPropertyData: SFRPropertyData;
  currentAnalysis: Analysis;
  onLoadScenario: (data: SFRPropertyData) => Promise<void>;
}

interface SavedScenario {
  id: string;
  name: string;
  description?: string;
  propertyData: SFRPropertyData;
  analysis: Analysis;
  createdAt: Date;
  lastModified: Date;
  isFavorite?: boolean;
  tags?: string[];
}

interface ComparisonMetric {
  label: string;
  getValue: (analysis: Analysis) => number;
  format: (value: number) => string;
  type: 'currency' | 'percentage' | 'number' | 'ratio';
  category: 'cash-flow' | 'returns' | 'risk' | 'value';
}

const ScenarioManager: React.FC<ScenarioManagerProps> = ({
  currentPropertyData,
  currentAnalysis,
  onLoadScenario
}) => {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<Set<string>>(new Set());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showCompareView, setShowCompareView] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  // Load scenarios from localStorage on mount
  useEffect(() => {
    const savedScenarios = localStorage.getItem('propertyScenarios');
    if (savedScenarios) {
      try {
        const parsed = JSON.parse(savedScenarios);
        setScenarios(parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          lastModified: new Date(s.lastModified)
        })));
      } catch (error) {
        console.error('Error loading scenarios:', error);
      }
    }
  }, []);

  // Save scenarios to localStorage whenever scenarios change
  useEffect(() => {
    localStorage.setItem('propertyScenarios', JSON.stringify(scenarios));
  }, [scenarios]);

  // Comparison metrics configuration
  const comparisonMetrics: ComparisonMetric[] = [
    {
      label: 'Monthly Cash Flow',
      getValue: (analysis) => analysis.monthlyAnalysis?.cashFlow || 0,
      format: (value) => `$${value.toFixed(0)}`,
      type: 'currency',
      category: 'cash-flow'
    },
    {
      label: 'Cash-on-Cash Return',
      getValue: (analysis) => analysis.keyMetrics?.cashOnCashReturn || 0,
      format: (value) => `${value.toFixed(1)}%`,
      type: 'percentage',
      category: 'returns'
    },
    {
      label: 'Cap Rate',
      getValue: (analysis) => analysis.keyMetrics?.capRate || 0,
      format: (value) => `${value.toFixed(2)}%`,
      type: 'percentage',
      category: 'returns'
    },
    {
      label: 'DSCR',
      getValue: (analysis) => analysis.keyMetrics?.dscr || 0,
      format: (value) => value.toFixed(2),
      type: 'ratio',
      category: 'risk'
    },
    {
      label: 'AI Investment Score',
      getValue: (analysis) => analysis.aiInsights?.investmentScore || 0,
      format: (value) => `${value}/100`,
      type: 'number',
      category: 'value'
    },
    {
      label: 'Annual NOI',
      getValue: (analysis) => analysis.annualAnalysis?.noi || 0,
      format: (value) => `$${value.toLocaleString()}`,
      type: 'currency',
      category: 'cash-flow'
    }
  ];

  // Save current scenario
  const handleSaveScenario = useCallback(() => {
    if (!scenarioName.trim()) return;

    const newScenario: SavedScenario = {
      id: Date.now().toString(),
      name: scenarioName.trim(),
      description: scenarioDescription.trim() || undefined,
      propertyData: currentPropertyData,
      analysis: currentAnalysis,
      createdAt: new Date(),
      lastModified: new Date(),
      isFavorite: false
    };

    setScenarios(prev => [newScenario, ...prev]);
    setScenarioName('');
    setScenarioDescription('');
    setShowSaveDialog(false);
  }, [scenarioName, scenarioDescription, currentPropertyData, currentAnalysis]);

  // Load scenario
  const handleLoadScenario = useCallback(async (scenario: SavedScenario) => {
    try {
      await onLoadScenario(scenario.propertyData);
    } catch (error) {
      console.error('Error loading scenario:', error);
    }
  }, [onLoadScenario]);

  // Delete scenario
  const handleDeleteScenario = useCallback((id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
    setSelectedScenarios(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  // Toggle scenario selection for comparison
  const toggleScenarioSelection = useCallback((id: string) => {
    setSelectedScenarios(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else if (newSet.size < 3) { // Limit to 3 scenarios
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback((id: string) => {
    setScenarios(prev => prev.map(s => 
      s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
    ));
  }, []);

  // Export scenarios
  const handleExportScenarios = useCallback(() => {
    const selectedScenariosData = scenarios.filter(s => selectedScenarios.has(s.id));
    
    if (selectedScenariosData.length === 0) return;

    const exportData = {
      scenarios: selectedScenariosData,
      exportDate: new Date().toISOString(),
      comparisonMetrics
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `property-scenarios-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [scenarios, selectedScenarios, comparisonMetrics]);

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, scenarioId: string) => {
    setAnchorEl(event.currentTarget);
    setActiveScenarioId(scenarioId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveScenarioId(null);
  };

  // Get comparison difference
  const getComparisonDifference = (baseValue: number, compareValue: number, type: string) => {
    const diff = compareValue - baseValue;
    const percentDiff = baseValue !== 0 ? (diff / Math.abs(baseValue)) * 100 : 0;
    
    let displayDiff = '';
    if (type === 'currency') {
      displayDiff = `${diff >= 0 ? '+' : ''}$${diff.toFixed(0)}`;
    } else if (type === 'percentage') {
      displayDiff = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
    } else {
      displayDiff = `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`;
    }
    
    return {
      value: diff,
      display: displayDiff,
      percent: percentDiff,
      isPositive: diff > 0,
      isNeutral: Math.abs(diff) < 0.01
    };
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cash-flow': return appleColors.success[500];
      case 'returns': return appleColors.primary[500];
      case 'risk': return appleColors.warning[500];
      case 'value': return appleColors.purple[500];
      default: return appleColors.gray[500];
    }
  };

  return (
    <Box>
      {/* Header */}
      <Card sx={{ borderRadius: '16px', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: appleColors.gray[900] }}>
                Scenario Management
              </Typography>
              <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                Save, compare, and analyze different property scenarios
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => setShowSaveDialog(true)}
                startIcon={<SaveIcon />}
                sx={{ textTransform: 'none' }}
              >
                Save Current
              </Button>
              {selectedScenarios.size > 1 && (
                <Button
                  variant="contained"
                  onClick={() => setShowCompareView(true)}
                  startIcon={<CompareIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  Compare ({selectedScenarios.size})
                </Button>
              )}
            </Stack>
          </Stack>

          {/* Quick Stats */}
          {scenarios.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Stack direction="row" spacing={2}>
                <Chip 
                  size="small" 
                  label={`${scenarios.length} Saved Scenarios`}
                  icon={<TimelineIcon />}
                />
                <Chip 
                  size="small" 
                  label={`${scenarios.filter(s => s.isFavorite).length} Favorites`}
                  icon={<StarIcon />}
                />
                <Chip 
                  size="small" 
                  label={`${selectedScenarios.size} Selected`}
                  icon={<CompareIcon />}
                />
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Scenarios List */}
      {scenarios.length > 0 ? (
        <Card sx={{ borderRadius: '16px' }}>
          <CardContent sx={{ p: 0 }}>
            <List>
              {scenarios.map((scenario, index) => {
                const isSelected = selectedScenarios.has(scenario.id);
                const cashFlow = scenario.analysis.monthlyAnalysis?.cashFlow || 0;
                const cocReturn = scenario.analysis.keyMetrics?.cashOnCashReturn || 0;
                const aiScore = scenario.analysis.aiInsights?.investmentScore || 0;
                
                return (
                  <Box key={scenario.id}>
                    <ListItem
                      sx={{
                        px: 3,
                        py: 2,
                        bgcolor: isSelected ? appleColors.primary[50] : 'transparent',
                        border: isSelected ? `1px solid ${appleColors.primary[200]}` : 'none',
                        borderRadius: isSelected ? '8px' : 'none',
                        mx: isSelected ? 1 : 0,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: appleColors.gray[50]
                        }
                      }}
                      onClick={() => toggleScenarioSelection(scenario.id)}
                    >
                      <ListItemIcon>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(scenario.id);
                          }}
                        >
                          {scenario.isFavorite ? 
                            <StarIcon sx={{ color: appleColors.warning[500] }} /> : 
                            <StarBorderIcon sx={{ color: appleColors.gray[400] }} />
                          }
                        </IconButton>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {scenario.name}
                            </Typography>
                            {scenario.tags?.map(tag => (
                              <Chip key={tag} size="small" label={tag} variant="outlined" />
                            ))}
                          </Stack>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            {scenario.description && (
                              <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 1 }}>
                                {scenario.description}
                              </Typography>
                            )}
                            <Stack direction="row" spacing={2}>
                              <Chip 
                                size="small" 
                                label={`Cash Flow: $${cashFlow.toFixed(0)}/mo`}
                                sx={{ 
                                  bgcolor: cashFlow >= 0 ? appleColors.success[100] : appleColors.error[100],
                                  color: cashFlow >= 0 ? appleColors.success[700] : appleColors.error[700]
                                }}
                              />
                              <Chip 
                                size="small" 
                                label={`CoC: ${cocReturn.toFixed(1)}%`}
                                sx={{ 
                                  bgcolor: appleColors.primary[100],
                                  color: appleColors.primary[700]
                                }}
                              />
                              <Chip 
                                size="small" 
                                label={`Score: ${aiScore}/100`}
                                sx={{ 
                                  bgcolor: appleColors.purple[100],
                                  color: appleColors.purple[700]
                                }}
                              />
                            </Stack>
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Load Scenario">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLoadScenario(scenario);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, scenario.id)}
                          >
                            <MoreIcon />
                          </IconButton>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < scenarios.length - 1 && <Divider />}
                  </Box>
                );
              })}
            </List>
          </CardContent>
        </Card>
      ) : (
        <Alert 
          severity="info" 
          sx={{ borderRadius: '16px' }}
          icon={<TimelineIcon />}
        >
          <Typography variant="body2">
            No saved scenarios yet. Save your current analysis to start building your scenario library.
          </Typography>
        </Alert>
      )}

      {/* Export Button */}
      {selectedScenarios.size > 0 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={handleExportScenarios}
            startIcon={<ExportIcon />}
            sx={{ textTransform: 'none' }}
          >
            Export Selected Scenarios
          </Button>
        </Box>
      )}

      {/* Save Dialog */}
      <Dialog 
        open={showSaveDialog} 
        onClose={() => setShowSaveDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Save Current Scenario</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Scenario Name"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              fullWidth
              required
              placeholder="e.g., Conservative Estimate, Optimistic Case"
            />
            <TextField
              label="Description (Optional)"
              value={scenarioDescription}
              onChange={(e) => setScenarioDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Brief description of this scenario's assumptions..."
            />
            <Alert severity="info">
              <Typography variant="body2">
                This will save the current property data and analysis results for future comparison.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveScenario}
            variant="contained"
            disabled={!scenarioName.trim()}
          >
            Save Scenario
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comparison View Dialog */}
      <Dialog 
        open={showCompareView} 
        onClose={() => setShowCompareView(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Scenario Comparison</Typography>
            <Button
              onClick={handleExportScenarios}
              startIcon={<ExportIcon />}
              size="small"
            >
              Export
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedScenarios.size > 1 && (
            <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: appleColors.gray[50] }}>
                    <TableCell sx={{ fontWeight: 600 }}>Metric</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    {Array.from(selectedScenarios).map(id => {
                      const scenario = scenarios.find(s => s.id === id);
                      return (
                        <TableCell key={id} sx={{ fontWeight: 600, textAlign: 'center' }}>
                          {scenario?.name}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comparisonMetrics.map(metric => {
                    const selectedScenariosArray = Array.from(selectedScenarios);
                    const values = selectedScenariosArray.map(id => {
                      const scenario = scenarios.find(s => s.id === id);
                      return scenario ? metric.getValue(scenario.analysis) : 0;
                    });
                    const baseValue = values[0];
                    
                    return (
                      <TableRow key={metric.label}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {metric.label}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={metric.category}
                            sx={{ 
                              bgcolor: `${getCategoryColor(metric.category)}20`,
                              color: getCategoryColor(metric.category)
                            }}
                          />
                        </TableCell>
                        {values.map((value, index) => {
                          const diff = index === 0 ? null : getComparisonDifference(baseValue, value, metric.type);
                          
                          return (
                            <TableCell key={index} sx={{ textAlign: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {metric.format(value)}
                              </Typography>
                              {diff && !diff.isNeutral && (
                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                                  {diff.isPositive ? (
                                    <GainIcon sx={{ fontSize: 14, color: appleColors.success[500] }} />
                                  ) : (
                                    <LossIcon sx={{ fontSize: 14, color: appleColors.error[500] }} />
                                  )}
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: diff.isPositive ? appleColors.success[600] : appleColors.error[600],
                                      fontWeight: 500
                                    }}
                                  >
                                    {diff.display}
                                  </Typography>
                                </Stack>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompareView(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Scenario Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          onClick={() => {
            if (activeScenarioId) {
              const scenario = scenarios.find(s => s.id === activeScenarioId);
              if (scenario) handleLoadScenario(scenario);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Load Scenario
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (activeScenarioId) {
              toggleFavorite(activeScenarioId);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <StarIcon fontSize="small" />
          </ListItemIcon>
          Toggle Favorite
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (activeScenarioId) {
              handleDeleteScenario(activeScenarioId);
            }
            handleMenuClose();
          }}
          sx={{ color: appleColors.error[600] }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: appleColors.error[600] }} />
          </ListItemIcon>
          Delete Scenario
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ScenarioManager;