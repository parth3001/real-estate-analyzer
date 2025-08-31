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
  MenuItem,
  CircularProgress
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
import { scenarioApi, type SavedScenario } from '../../services/api';

interface ScenarioManagerProps {
  currentPropertyData: SFRPropertyData;
  currentAnalysis: Analysis;
  dealId: string; // Required for MongoDB persistence
  onLoadScenario: (data: SFRPropertyData, analysis?: Analysis) => Promise<void>;
}

// SavedScenario interface now imported from API services

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
  dealId,
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load scenarios from MongoDB on mount (following Complete Storage Architecture)
  useEffect(() => {
    const loadScenarios = async () => {
      if (!dealId) {
        console.warn('ScenarioManager: No dealId provided, cannot load scenarios');
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        console.log('🎯 SCENARIO MANAGER: Loading scenarios for deal:', dealId);
        const response = await scenarioApi.getScenarios(dealId);
        
        if (response.status === 200) {
          setScenarios(response.data.scenarios);
          console.log('🎯 SCENARIO MANAGER: Loaded', response.data.scenarios.length, 'scenarios');
        } else {
          console.error('Failed to load scenarios:', response.message);
          setError(response.message || 'Failed to load scenarios');
        }
      } catch (error) {
        console.error('Error loading scenarios:', error);
        setError('Error loading scenarios');
      } finally {
        setIsLoading(false);
      }
    };

    loadScenarios();
  }, [dealId]);

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
      label: 'Deal Quality Score',
      getValue: (analysis) => analysis.investmentDecision?.professionalAssessment?.dealQuality || 0,
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

  // Save current scenario to MongoDB (following Complete Storage Architecture)
  const handleSaveScenario = useCallback(async () => {
    if (!scenarioName.trim()) return;

    // Validate that we have current data (not stale)
    if (!currentPropertyData || !currentAnalysis) {
      console.error('Cannot save scenario: missing property data or analysis');
      setError('Cannot save scenario: missing property data or analysis');
      return;
    }

    if (!dealId) {
      console.error('Cannot save scenario: no dealId provided');
      setError('Cannot save scenario: no deal ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🎯 SCENARIO MANAGER: Saving scenario with current state:', {
        dealId,
        cashFlow: currentAnalysis.monthlyAnalysis?.cashFlow,
        capRate: currentAnalysis.keyMetrics?.capRate,
        purchasePrice: currentPropertyData.purchasePrice,
        monthlyRent: currentPropertyData.monthlyRent,
        scenarioName: scenarioName.trim(),
        fullDataCaptured: {
          propertyDataFields: Object.keys(currentPropertyData).length,
          analysisDataFields: Object.keys(currentAnalysis).length
        }
      });

      const scenarioData = {
        name: scenarioName.trim(),
        description: scenarioDescription.trim() || undefined,
        // Complete Storage Architecture: Store complete snapshots
        propertyData: { ...currentPropertyData },
        analysis: { ...currentAnalysis },
        isFavorite: false,
        tags: []
      };

      const response = await scenarioApi.createScenario(dealId, scenarioData);

      if (response.status === 201) {
        // Add the new scenario to the list
        setScenarios(prev => [response.data.scenario, ...prev]);
        setScenarioName('');
        setScenarioDescription('');
        setShowSaveDialog(false);
        console.log('🎯 SCENARIO MANAGER: Scenario saved successfully:', response.data.scenario._id);
      } else {
        console.error('Failed to save scenario:', response.message);
        setError(response.message || 'Failed to save scenario');
      }
    } catch (error) {
      console.error('Error saving scenario:', error);
      setError('Error saving scenario');
    } finally {
      setIsLoading(false);
    }
  }, [scenarioName, scenarioDescription, currentPropertyData, currentAnalysis, dealId]);

  // Load scenario with preserved analysis data (follows Complete Storage Architecture)
  const handleLoadScenario = useCallback(async (scenario: SavedScenario) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🎯 SCENARIO MANAGER: Loading scenario:', {
        scenarioId: scenario._id,
        scenarioName: scenario.name,
        savedCashFlow: scenario.analysis.monthlyAnalysis?.cashFlow,
        savedCapRate: scenario.analysis.keyMetrics?.capRate,
        savedPurchasePrice: scenario.propertyData.purchasePrice,
        savedMonthlyRent: scenario.propertyData.monthlyRent,
        savedTimestamp: scenario.lastModified,
        fullDataRestored: {
          propertyDataFields: Object.keys(scenario.propertyData).length,
          analysisDataFields: Object.keys(scenario.analysis).length
        }
      });

      // Complete Storage Architecture: Load with saved analysis data (no recalculation)
      await onLoadScenario(scenario.propertyData, scenario.analysis);
      
      console.log('🎯 SCENARIO MANAGER: Scenario loaded successfully:', scenario.name);
    } catch (error) {
      console.error('Error loading scenario:', error);
      setError('Error loading scenario');
    } finally {
      setIsLoading(false);
    }
  }, [onLoadScenario]);

  // Delete scenario from MongoDB
  const handleDeleteScenario = useCallback(async (scenarioId: string) => {
    if (!dealId) {
      console.error('Cannot delete scenario: no dealId provided');
      setError('Cannot delete scenario: no deal ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🎯 SCENARIO MANAGER: Deleting scenario:', scenarioId);
      
      const response = await scenarioApi.deleteScenario(dealId, scenarioId);

      if (response.status === 200) {
        // Remove from local state
        setScenarios(prev => prev.filter(s => s._id !== scenarioId));
        setSelectedScenarios(prev => {
          const newSet = new Set(prev);
          newSet.delete(scenarioId);
          return newSet;
        });
        console.log('🎯 SCENARIO MANAGER: Scenario deleted successfully');
      } else {
        console.error('Failed to delete scenario:', response.message);
        setError(response.message || 'Failed to delete scenario');
      }
    } catch (error) {
      console.error('Error deleting scenario:', error);
      setError('Error deleting scenario');
    } finally {
      setIsLoading(false);
    }
  }, [dealId]);

  // Toggle scenario selection for comparison
  const toggleScenarioSelection = useCallback((scenarioId: string) => {
    setSelectedScenarios(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scenarioId)) {
        newSet.delete(scenarioId);
      } else if (newSet.size < 3) { // Limit to 3 scenarios
        newSet.add(scenarioId);
      }
      return newSet;
    });
  }, []);

  // Toggle favorite status in MongoDB
  const toggleFavorite = useCallback(async (scenarioId: string) => {
    if (!dealId) {
      console.error('Cannot toggle favorite: no dealId provided');
      setError('Cannot toggle favorite: no deal ID');
      return;
    }

    try {
      console.log('🎯 SCENARIO MANAGER: Toggling favorite for scenario:', scenarioId);
      
      const response = await scenarioApi.toggleFavorite(dealId, scenarioId);

      if (response.status === 200) {
        // Update local state
        setScenarios(prev => prev.map(s => 
          s._id === scenarioId ? { ...s, isFavorite: response.data.scenario.isFavorite } : s
        ));
        console.log('🎯 SCENARIO MANAGER: Favorite toggled successfully');
      } else {
        console.error('Failed to toggle favorite:', response.message);
        setError(response.message || 'Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setError('Error toggling favorite');
    }
  }, [dealId]);

  // Export scenarios
  const handleExportScenarios = useCallback(() => {
    const selectedScenariosData = scenarios.filter(s => selectedScenarios.has(s._id));
    
    if (selectedScenariosData.length === 0) return;

    const exportData = {
      scenarios: selectedScenariosData,
      exportDate: new Date().toISOString(),
      comparisonMetrics,
      dealId
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `property-scenarios-${dealId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [scenarios, selectedScenarios, comparisonMetrics, dealId]);

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
      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: '16px' }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

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
                disabled={isLoading}
                sx={{ textTransform: 'none' }}
              >
                {isLoading ? <CircularProgress size={16} /> : 'Save Current'}
              </Button>
              {selectedScenarios.size > 1 && (
                <Button
                  variant="contained"
                  onClick={() => setShowCompareView(true)}
                  startIcon={<CompareIcon />}
                  disabled={isLoading}
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
                const isSelected = selectedScenarios.has(scenario._id);
                const cashFlow = scenario.analysis.monthlyAnalysis?.cashFlow || 0;
                const cocReturn = scenario.analysis.keyMetrics?.cashOnCashReturn || 0;
                const dealQuality = scenario.analysis.investmentDecision?.professionalAssessment?.dealQuality || 0;
                
                return (
                  <Box key={scenario._id}>
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
                      onClick={() => toggleScenarioSelection(scenario._id)}
                    >
                      <ListItemIcon>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(scenario._id);
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
                                label={`Score: ${dealQuality}/100`}
                                sx={{ 
                                  bgcolor: appleColors.purple[100],
                                  color: appleColors.purple[600]
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
                            onClick={(e) => handleMenuOpen(e, scenario._id)}
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
                      const scenario = scenarios.find(s => s._id === id);
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
                      const scenario = scenarios.find(s => s._id === id);
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
              const scenario = scenarios.find(s => s._id === activeScenarioId);
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