import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Container, Typography, Button, CircularProgress, IconButton, Tabs, Tab } from '@mui/material';
import { ArrowBack, Add, TrendingUp, AttachMoney, Home, Percent, Refresh, Delete, AutoAwesome, Edit } from '@mui/icons-material';
import PortfolioList from '../components/Portfolio/PortfolioList';
import CreatePortfolioModal from '../components/Portfolio/CreatePortfolioModal';
import AddPropertyModal from '../components/Portfolio/AddPropertyModal';
import PortfolioAIInsights from '../components/Portfolio/PortfolioAIInsights';
import EditPortfolioTargets from '../components/Portfolio/EditPortfolioTargets';
import { portfolioApi } from '../services/api';
import { appleColors } from '../theme/appleDesignSystem';
import { AppleCard } from '../components/ui/AppleComponents';

const PortfolioDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [portfolioDetails, setPortfolioDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showEditTargetsModal, setShowEditTargetsModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadPortfolioDetails(id);
    }
  }, [id]);

  const loadPortfolioDetails = async (portfolioId: string) => {
    try {
      setLoading(true);
      const response = await portfolioApi.getPortfolioDetails(portfolioId);
      if (response.data.success) {
        setPortfolioDetails(response.data);
      }
    } catch (error) {
      console.error('Error loading portfolio details:', error);
      navigate('/portfolio');
    } finally {
      setLoading(false);
    }
  };

  const recalculateAnalytics = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await portfolioApi.recalculateAnalytics(id);
      if (response.data.success) {
        console.log('Analytics recalculated:', response.data.analytics);
        // Reload portfolio details to get fresh data
        await loadPortfolioDetails(id);
      }
    } catch (error) {
      console.error('Error recalculating analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const removePropertyFromPortfolio = async (propertyId: string) => {
    if (!id) return;
    
    if (!window.confirm('Are you sure you want to remove this property from the portfolio?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await portfolioApi.removePropertyFromPortfolio(id, propertyId);
      if (response.data.success) {
        // Reload portfolio details to get fresh data
        await loadPortfolioDetails(id);
        // Recalculate analytics after removing property
        await recalculateAnalytics();
      }
    } catch (error) {
      console.error('Error removing property from portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = () => {
    setShowCreateModal(true);
  };

  const handleViewPortfolio = (portfolioId: string) => {
    navigate(`/portfolio/${portfolioId}`);
  };

  const handleCreateSuccess = () => {
    window.location.reload();
  };

  // If we have an ID, show portfolio details
  if (id) {
    if (loading) {
      return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress size={60} sx={{ color: appleColors.blue[600] }} />
          </Box>
        </Container>
      );
    }

    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/portfolio')}
          sx={{ mb: 3, color: appleColors.blue[600] }}
        >
          Back to Portfolios
        </Button>
        
        <AppleCard padding="large">
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            {portfolioDetails?.portfolio?.name || 'Portfolio Details'}
          </Typography>
          
          <Typography variant="body1" sx={{ color: appleColors.gray[600], mb: 3 }}>
            {portfolioDetails?.portfolio?.description}
          </Typography>

          {/* Portfolio Metrics */}
          <Box sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Portfolio Metrics
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={recalculateAnalytics}
                disabled={loading}
                sx={{ 
                  borderColor: appleColors.blue[600],
                  color: appleColors.blue[600],
                  '&:hover': { 
                    borderColor: appleColors.blue[700],
                    backgroundColor: appleColors.blue[50]
                  }
                }}
              >
                Recalculate
              </Button>
            </Box>
            
            {portfolioDetails?.analytics ? (
              <>
              
              {/* Primary Metrics Row */}
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: 250 }}>
                  <AppleCard>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AttachMoney sx={{ color: appleColors.green[600], mr: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Total Value
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: appleColors.green[600] }}>
                      ${portfolioDetails.analytics.summary?.totalValue?.toLocaleString() || '0'}
                    </Typography>
                  </AppleCard>
                </Box>
                
                <Box sx={{ flex: '1 1 300px', minWidth: 250 }}>
                  <AppleCard>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TrendingUp sx={{ color: appleColors.blue[600], mr: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Monthly Cash Flow
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      color: (portfolioDetails.analytics.summary?.monthlyNetCashFlow || 0) >= 0 
                        ? appleColors.green[600] 
                        : appleColors.red[600] 
                    }}>
                      ${portfolioDetails.analytics.summary?.monthlyNetCashFlow?.toLocaleString() || '0'}
                    </Typography>
                  </AppleCard>
                </Box>
                
                <Box sx={{ flex: '1 1 300px', minWidth: 250 }}>
                  <AppleCard>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Home sx={{ color: appleColors.orange[600], mr: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Properties
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: appleColors.orange[600] }}>
                      {portfolioDetails.analytics.summary?.totalProperties || 0}
                    </Typography>
                  </AppleCard>
                </Box>
                
                <Box sx={{ flex: '1 1 300px', minWidth: 250 }}>
                  <AppleCard>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Percent sx={{ color: appleColors.purple[600], mr: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Avg Cap Rate
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: appleColors.purple[600] }}>
                      {portfolioDetails.analytics.summary?.averageCapRate?.toFixed(1) || '0.0'}%
                    </Typography>
                  </AppleCard>
                </Box>
              </Box>

              {/* Secondary Metrics Row */}
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 300px', minWidth: 250 }}>
                  <AppleCard>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Total Equity
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: appleColors.blue[600] }}>
                      ${portfolioDetails.analytics.summary?.totalEquity?.toLocaleString() || '0'}
                    </Typography>
                  </AppleCard>
                </Box>
                
                <Box sx={{ flex: '1 1 300px', minWidth: 250 }}>
                  <AppleCard>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Monthly Rental Income
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: appleColors.green[600] }}>
                      ${portfolioDetails.analytics.summary?.monthlyRentalIncome?.toLocaleString() || '0'}
                    </Typography>
                  </AppleCard>
                </Box>
                
                <Box sx={{ flex: '1 1 300px', minWidth: 250 }}>
                  <AppleCard>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Cash-on-Cash Return
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: appleColors.purple[600] }}>
                      {portfolioDetails.analytics.summary?.averageCashOnCash?.toFixed(1) || '0.0'}%
                    </Typography>
                  </AppleCard>
                </Box>
              </Box>
            </>
            ) : (
              <Typography variant="body2" sx={{ color: appleColors.gray[600], textAlign: 'center', py: 4 }}>
                No analytics available. Click "Recalculate" to generate metrics.
              </Typography>
            )}
          </Box>
          
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Portfolio Goals
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Edit />}
                onClick={() => setShowEditTargetsModal(true)}
                sx={{
                  borderColor: appleColors.blue[600],
                  color: appleColors.blue[600],
                  '&:hover': { 
                    borderColor: appleColors.blue[700],
                    backgroundColor: appleColors.blue[50]
                  }
                }}
              >
                Edit Targets
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight="medium">
                  Primary Goal
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {portfolioDetails?.portfolio?.goals?.primaryGoal?.replace('_', ' ')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight="medium">
                  Risk Tolerance
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {portfolioDetails?.portfolio?.goals?.riskTolerance}
                </Typography>
              </Box>
              {portfolioDetails?.portfolio?.goals?.targetTimeline && (
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Timeline
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {portfolioDetails.portfolio.goals.targetTimeline}
                  </Typography>
                </Box>
              )}
            </Box>
            {portfolioDetails?.portfolio?.goals?.targetMonthlyIncome && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary" fontWeight="medium">
                  Target Monthly Income
                </Typography>
                <Typography variant="h6" sx={{ color: appleColors.green[600], fontWeight: 600 }}>
                  ${portfolioDetails.portfolio.goals.targetMonthlyIncome.toLocaleString()}
                </Typography>
              </Box>
            )}
            {portfolioDetails?.portfolio?.goals?.targetNetWorth && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary" fontWeight="medium">
                  Target Net Worth
                </Typography>
                <Typography variant="h6" sx={{ color: appleColors.blue[600], fontWeight: 600 }}>
                  ${portfolioDetails.portfolio.goals.targetNetWorth.toLocaleString()}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Tabs for Portfolio sections */}
          <Box sx={{ mt: 4 }}>
            <Tabs 
              value={activeTab} 
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem'
                }
              }}
            >
              <Tab 
                icon={<Home />} 
                iconPosition="start" 
                label="Properties" 
                sx={{ minHeight: 60 }}
              />
              <Tab 
                icon={<AutoAwesome />} 
                iconPosition="start" 
                label="AI Insights" 
                sx={{ minHeight: 60 }}
              />
            </Tabs>
          </Box>
          
          {/* Tab Content */}
          <Box sx={{ mt: 3 }}>
            {/* Properties Tab */}
            {activeTab === 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Properties ({portfolioDetails?.totalProperties || 0})
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setShowAddPropertyModal(true)}
                    sx={{
                      backgroundColor: appleColors.blue[600],
                      '&:hover': { backgroundColor: appleColors.blue[700] }
                    }}
                  >
                    Add Property
                  </Button>
                </Box>
                {portfolioDetails?.properties?.length > 0 ? (
                  portfolioDetails.properties.map((property: any) => (
                    <Box 
                      key={property.id} 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        bgcolor: appleColors.gray[50], 
                        borderRadius: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {property.propertyName || property.address}
                        </Typography>
                        <Typography variant="body2">
                          Type: {property.propertyType} | Purchase Price: ${property.purchasePrice?.toLocaleString()}
                          {property.ownershipPercentage && property.ownershipPercentage < 100 && (
                            <> | Ownership: {property.ownershipPercentage}%</>
                          )}
                        </Typography>
                        {property.analysis && (
                          <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                            Monthly Income: ${(() => {
                              // Try multiple sources for monthly rent
                              const rent = property.monthlyRent || 
                                         property.analysis?.monthlyAnalysis?.income?.monthlyRent ||
                                         property.analysis?.keyMetrics?.monthlyRent ||
                                         property.analysis?.monthlyAnalysis?.income?.total;
                              return rent ? rent.toLocaleString() : 'N/A';
                            })()}
                          </Typography>
                        )}
                      </Box>
                      <IconButton
                        onClick={() => removePropertyFromPortfolio(property.id)}
                        disabled={loading}
                        sx={{ 
                          color: appleColors.red[600],
                          '&:hover': { 
                            backgroundColor: appleColors.red[50]
                          }
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                    No properties added to this portfolio yet. Click "Add Property" to add your saved properties to this portfolio.
                  </Typography>
                )}
              </Box>
            )}

            {/* AI Insights Tab */}
            {activeTab === 1 && portfolioDetails?.portfolio && (
              <PortfolioAIInsights
                portfolioId={portfolioDetails.portfolio.id}
                portfolioName={portfolioDetails.portfolio.name}
              />
            )}
          </Box>
        </AppleCard>
        
        <AddPropertyModal
          open={showAddPropertyModal}
          onClose={() => setShowAddPropertyModal(false)}
          portfolioId={id}
          portfolioName={portfolioDetails?.portfolio?.name || 'Portfolio'}
          onSuccess={() => {
            setShowAddPropertyModal(false);
            loadPortfolioDetails(id);
          }}
        />
        
        {portfolioDetails?.portfolio && (
          <EditPortfolioTargets
            open={showEditTargetsModal}
            onClose={() => setShowEditTargetsModal(false)}
            portfolio={{
              id: portfolioDetails.portfolio.id,
              name: portfolioDetails.portfolio.name,
              goals: portfolioDetails.portfolio.goals
            }}
            onSuccess={() => {
              setShowEditTargetsModal(false);
              loadPortfolioDetails(id);
            }}
          />
        )}
      </Container>
    );
  }

  // Otherwise show the portfolio list
  return (
    <>
      <PortfolioList
        onCreatePortfolio={handleCreatePortfolio}
        onViewPortfolio={handleViewPortfolio}
      />
      
      <CreatePortfolioModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};

export default PortfolioDashboard;