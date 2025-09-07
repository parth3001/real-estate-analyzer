import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Add as AddIcon, 
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { PipelineKanban } from '../components/Pipeline/PipelineKanban';
import { AddDealModal } from '../components/Pipeline/AddDealModal';
import { PipelineFilters } from '../components/Pipeline/PipelineFilters';
import { PipelineSkinnyCalculator } from '../components/Pipeline/PipelineSkinnyCalculator';
import { EditDeal } from '../components/Pipeline/EditDeal';
import { pipelineApi } from '../services/pipelineApi';
import type { KanbanData, PipelineDeal } from '../types/pipeline';
import { DealStage } from '../types/pipeline';

export const PipelinePage: React.FC = () => {
  const [kanbanData, setKanbanData] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [showSkinnyCalculator, setShowSkinnyCalculator] = useState(false);
  const [showEditDeal, setShowEditDeal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [selectedDeal, setSelectedDeal] = useState<PipelineDeal | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load Kanban data
  const loadKanbanData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading Pipeline Kanban data...');
      const data = await pipelineApi.getKanbanData();
      console.log('✅ Pipeline data loaded:', data);
      setKanbanData(data);
    } catch (err: any) {
      console.error('❌ Error loading Kanban data:', err);
      setError(err.response?.data?.error || 'Failed to load pipeline data');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadKanbanData();
  }, [refreshKey]);

  // Listen for navigation back from SFR Analysis and refresh data
  useEffect(() => {
    const checkForRefresh = () => {
      // Check if we came back from SFR analysis
      const returnedFromAnalysis = sessionStorage.getItem('returnedFromSFRAnalysis');
      if (returnedFromAnalysis) {
        console.log('🔄 Refreshing Pipeline data after returning from SFR Analysis');
        setRefreshKey(prev => prev + 1);
        sessionStorage.removeItem('returnedFromSFRAnalysis');
      }
    };

    // Check immediately when component mounts/remounts
    checkForRefresh();

    // Listen for window focus (when user navigates back via browser)
    const handleFocus = () => {
      checkForRefresh();
    };
    
    // Listen for visibility change (when tab becomes active)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForRefresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle stage change
  const handleStageChange = async (dealId: string, newStage: DealStage) => {
    try {
      await pipelineApi.updateDealStage(dealId, newStage);
      // Reload data after stage change
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      console.error('Error updating deal stage:', err);
      setError(err.response?.data?.error || 'Failed to update deal stage');
    }
  };

  // Handle deal creation
  const handleDealCreated = (newDeal: PipelineDeal) => {
    // Add the new deal to the appropriate stage
    if (kanbanData) {
      const updatedData = { ...kanbanData };
      updatedData[newDeal.currentStage] = [...updatedData[newDeal.currentStage], newDeal];
      setKanbanData(updatedData);
    }
    setShowAddDeal(false);
  };

  // Handle deal deletion
  const handleDeleteDeal = async (dealId: string) => {
    try {
      await pipelineApi.deleteDeal(dealId);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      console.error('Error deleting deal:', err);
      setError(err.response?.data?.error || 'Failed to delete deal');
    }
  };

  // Handle deal analysis
  const handleAnalyzeDeal = (deal: PipelineDeal) => {
    setSelectedDeal(deal);
    setShowSkinnyCalculator(true);
  };

  // Handle analysis completion
  const handleAnalysisComplete = (results: any) => {
    console.log('Analysis completed for deal:', selectedDeal?._id, results);
    // Don't close the modal or refresh - let the user continue working
    // Just update the deal in the kanban data directly
    if (selectedDeal && kanbanData) {
      const updatedDeal = {
        ...selectedDeal,
        quickMetrics: {
          monthlyIncome: results.monthlyIncome,
          monthlyCashFlow: results.monthlyCashFlow,
          capRate: results.capRate,
          cashOnCashReturn: results.cashOnCashReturn
        },
        analysisStatus: 'COMPLETE' as const
      };
      
      // Update the deal in kanban data
      const newKanbanData = { ...kanbanData };
      Object.keys(newKanbanData).forEach(stage => {
        const stageKey = stage as keyof KanbanData;
        newKanbanData[stageKey] = newKanbanData[stageKey].map(deal => 
          deal._id === updatedDeal._id ? updatedDeal : deal
        );
      });
      setKanbanData(newKanbanData);
      setSelectedDeal(updatedDeal);
    }
  };

  // Handle edit deal
  const handleEditDeal = (deal: PipelineDeal) => {
    setSelectedDeal(deal);
    setShowEditDeal(true);
  };

  // Handle deal update
  const handleDealUpdated = (updatedDeal: PipelineDeal) => {
    // Update the deal in the kanban data
    if (kanbanData) {
      const newKanbanData = { ...kanbanData };
      Object.keys(newKanbanData).forEach(stage => {
        const stageKey = stage as keyof KanbanData;
        newKanbanData[stageKey] = newKanbanData[stageKey].map(deal => 
          deal._id === updatedDeal._id ? updatedDeal : deal
        );
      });
      setKanbanData(newKanbanData);
    }
    setShowEditDeal(false);
    setSelectedDeal(null);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handle analytics
  const handleAnalytics = async () => {
    try {
      const analytics = await pipelineApi.getAnalytics();
      setAnalyticsData(analytics);
      setShowAnalytics(true);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.response?.data?.error || 'Failed to load analytics');
    }
  };

  if (loading && !kanbanData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Deal Pipeline
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Analytics">
            <IconButton onClick={handleAnalytics}>
              <AnalyticsIcon />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddDeal(true)}
            sx={{ borderRadius: 2 }}
          >
            Add Deal
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <PipelineFilters onFiltersChange={() => setRefreshKey(prev => prev + 1)} />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Pipeline Stats Summary */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, overflowX: 'auto' }}>
        {kanbanData && Object.entries(kanbanData).map(([stage, deals]) => (
          <Paper 
            key={stage} 
            sx={{ 
              p: 2, 
              minWidth: 150,
              textAlign: 'center',
              backgroundColor: getStageColor(stage as DealStage).bg
            }}
          >
            <Typography variant="caption" color="textSecondary">
              {stage.replace('_', ' ')}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {deals.length}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              ${(deals.reduce((sum: number, d: PipelineDeal) => sum + d.askingPrice, 0) / 1000000).toFixed(1)}M
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Kanban Board */}
      {kanbanData && (
        <PipelineKanban
          data={kanbanData}
          onStageChange={handleStageChange}
          onDeleteDeal={handleDeleteDeal}
          onAnalyzeDeal={handleAnalyzeDeal}
          onEditDeal={handleEditDeal}
          loading={loading}
        />
      )}

      {/* Add Deal Modal */}
      <AddDealModal
        open={showAddDeal}
        onClose={() => setShowAddDeal(false)}
        onDealAdded={handleDealCreated}
      />

      {/* Skinny Calculator Modal */}
      {selectedDeal && showSkinnyCalculator && (
        <PipelineSkinnyCalculator
          open={showSkinnyCalculator}
          onClose={() => {
            setShowSkinnyCalculator(false);
            setSelectedDeal(null);
          }}
          deal={selectedDeal}
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}

      {/* Edit Deal Modal */}
      {selectedDeal && showEditDeal && (
        <EditDeal
          open={showEditDeal}
          onClose={() => {
            setShowEditDeal(false);
            setSelectedDeal(null);
          }}
          deal={selectedDeal}
          onDealUpdated={handleDealUpdated}
        />
      )}

      {/* Analytics Modal */}
      <Dialog 
        open={showAnalytics} 
        onClose={() => setShowAnalytics(false)}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AnalyticsIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Pipeline Analytics
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {analyticsData ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Stage Distribution */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Deals by Stage
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {analyticsData.stageDistribution?.map((stage: any) => (
                    <Paper 
                      key={stage._id} 
                      sx={{ 
                        p: 2, 
                        minWidth: 120, 
                        textAlign: 'center',
                        backgroundColor: getStageColor(stage._id as DealStage).bg
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {stage.count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {stage._id?.replace('_', ' ')}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Paper>

              {/* Property Types */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Property Types
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {analyticsData.propertyTypeDistribution?.map((type: any) => (
                    <Box key={type._id} sx={{ textAlign: 'center', minWidth: 80 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {type.count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {type._id}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>

              {/* Deal Sources */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Deal Sources
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {analyticsData.sourceAnalysis?.map((source: any) => (
                    <Box key={source._id} sx={{ textAlign: 'center', minWidth: 80 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: 'info.main' }}>
                        {source.count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {source._id}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>

              {/* Total Value */}
              <Paper sx={{ p: 3, backgroundColor: 'primary.50' }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  Total Pipeline Value
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  ${((analyticsData.totalPipelineValue || 0) / 1000000).toFixed(1)}M
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Across {(analyticsData.stageDistribution?.reduce((sum: number, stage: any) => sum + stage.count, 0)) || 0} deals
                </Typography>
              </Paper>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowAnalytics(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Helper function for stage colors
const getStageColor = (stage: DealStage) => {
  const colors = {
    [DealStage.WATCHING]: { bg: '#f3f4f6', color: '#6b7280' },
    [DealStage.ANALYZING]: { bg: '#dbeafe', color: '#2563eb' },
    [DealStage.NEGOTIATING]: { bg: '#fef3c7', color: '#d97706' },
    [DealStage.UNDER_CONTRACT]: { bg: '#d1fae5', color: '#059669' },
    [DealStage.CLOSED]: { bg: '#a7f3d0', color: '#047857' },
    [DealStage.LOST]: { bg: '#fee2e2', color: '#dc2626' }
  };
  return colors[stage] || { bg: '#f3f4f6', color: '#6b7280' };
};

export default PipelinePage;