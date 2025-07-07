import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  GridLegacy as Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
  Alert,
  IconButton,
  Collapse
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Info,
  ExpandMore,
  ExpandLess,
  LocationOn,
  AttachMoney,
  Schedule,
  Assessment,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { green, red, orange, blue, grey } from '@mui/material/colors';
import type { MarketIntelligenceTabProps } from '../../types/marketData';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const MarketIntelligenceSection: React.FC<MarketIntelligenceTabProps> = ({
  marketData,
  marketInsights,
  investmentTiming,
  loading,
  error
}) => {
  // Debug logging
  React.useEffect(() => {
    console.log('MarketIntelligenceSection Debug:', {
      marketData,
      marketInsights,
      investmentTiming,
      loading,
      error
    });
  }, [marketData, marketInsights, investmentTiming, loading, error]);
  const [expandedSections, setExpandedSections] = React.useState<{ [key: string]: boolean }>({
    property: true,
    trends: true,
    economic: true,
    insights: true,
    timing: true,
    comparables: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loading Market Intelligence...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load market intelligence data: {error}
        </Alert>
      </Box>
    );
  }

  if (!marketData && !marketInsights && !investmentTiming) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Market intelligence data is not available for this analysis.
        </Alert>
      </Box>
    );
  }

  const formatPercentage = (value: number) => formatPercent(value / 100, 1);

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'positive': return green[500];
      case 'negative': return red[500];
      default: return grey[500];
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'rising':
      case 'up':
        return <TrendingUp sx={{ color: red[500] }} />;
      case 'falling':
      case 'down':
        return <TrendingDown sx={{ color: green[500] }} />;
      default:
        return <TrendingFlat sx={{ color: grey[500] }} />;
    }
  };

  const getTimingScoreColor = (score: number) => {
    if (score >= 80) return green[500];
    if (score >= 60) return orange[500];
    return red[500];
  };

  const SectionHeader: React.FC<{ title: string; icon: React.ReactNode; section: string }> = ({ title, icon, section }) => (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        cursor: 'pointer',
        p: 1,
        borderRadius: 1,
        '&:hover': { bgcolor: 'action.hover' }
      }}
      onClick={() => toggleSection(section)}
    >
      {icon}
      <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
        {title}
      </Typography>
      <IconButton size="small">
        {expandedSections[section] ? <ExpandLess /> : <ExpandMore />}
      </IconButton>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Market Intelligence
      </Typography>

      <Grid container spacing={3}>
        {/* Property Market Data */}
        {marketData?.property && (
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <SectionHeader 
                  title="Property Market Data" 
                  icon={<AttachMoney sx={{ color: blue[500] }} />}
                  section="property"
                />
                <Collapse in={expandedSections.property}>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Market Rent Estimate
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(marketData.property.rentEstimate)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {marketData.property.confidence}% confidence
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Rent Range
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(marketData.property.rentRange.low)} - {formatCurrency(marketData.property.rentRange.high)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Chip 
                          label={marketData.property.marketPosition}
                          color={marketData.property.marketPosition === 'Above Market' ? 'error' : 
                                 marketData.property.marketPosition === 'Below Market' ? 'success' : 'default'}
                          sx={{ mt: 1 }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Market Trends */}
        {marketData?.marketTrends && (
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <SectionHeader 
                  title={`Market Trends (${marketData.marketTrends.zipCode})`}
                  icon={<Assessment sx={{ color: green[500] }} />}
                  section="trends"
                />
                <Collapse in={expandedSections.trends}>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Median Rent
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(marketData.marketTrends.medianRent)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Rent Growth Rate
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="h6">
                            {formatPercentage(marketData.marketTrends.rentGrowthRate)}
                          </Typography>
                          {getTrendIcon('up')}
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Median Sale Price
                        </Typography>
                        <Typography variant="body1">
                          {formatCurrency(marketData.marketTrends.medianSalePrice)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Days on Market
                        </Typography>
                        <Typography variant="body1">
                          {marketData.marketTrends.daysOnMarket} days
                        </Typography>
                        <Chip 
                          label={marketData.marketTrends.inventoryLevel}
                          size="small"
                          color={marketData.marketTrends.inventoryLevel === 'Low' ? 'success' : 
                                 marketData.marketTrends.inventoryLevel === 'High' ? 'error' : 'default'}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Economic Indicators */}
        {marketData?.economicIndicators && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <SectionHeader 
                  title="Economic Indicators"
                  icon={<TrendingUp sx={{ color: orange[500] }} />}
                  section="economic"
                />
                <Collapse in={expandedSections.economic}>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color={red[500]}>
                            {formatPercentage(marketData.economicIndicators.currentMortgageRate)}
                          </Typography>
                          <Typography variant="subtitle2" color="textSecondary">
                            Mortgage Rate
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                            {getTrendIcon(marketData.economicIndicators.mortgageRateTrend)}
                            <Typography variant="caption" sx={{ ml: 1 }}>
                              {marketData.economicIndicators.mortgageRateTrend}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4">
                            {formatPercentage(marketData.economicIndicators.inflationRate)}
                          </Typography>
                          <Typography variant="subtitle2" color="textSecondary">
                            Inflation Rate
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4">
                            {formatPercentage(marketData.economicIndicators.unemploymentRate)}
                          </Typography>
                          <Typography variant="subtitle2" color="textSecondary">
                            Unemployment
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4">
                            {marketData.economicIndicators.housingIndex.toFixed(1)}
                          </Typography>
                          <Typography variant="subtitle2" color="textSecondary">
                            Housing Index
                          </Typography>
                          <Typography variant="caption" color={marketData.economicIndicators.housingIndexChange > 0 ? green[500] : red[500]}>
                            {marketData.economicIndicators.housingIndexChange > 0 ? '+' : ''}{formatPercentage(marketData.economicIndicators.housingIndexChange)} YoY
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Market Insights */}
        {marketInsights && marketInsights.length > 0 && (
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <SectionHeader 
                  title="Market Insights"
                  icon={<Info sx={{ color: blue[500] }} />}
                  section="insights"
                />
                <Collapse in={expandedSections.insights}>
                  <List sx={{ mt: 2 }}>
                    {marketInsights.map((insight, index) => (
                      <React.Fragment key={index}>
                        <ListItem alignItems="flex-start">
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Chip 
                                  label={insight.category}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 1 }}
                                />
                                <Chip 
                                  label={insight.impact}
                                  size="small"
                                  sx={{ 
                                    bgcolor: getImpactColor(insight.impact),
                                    color: 'white'
                                  }}
                                />
                                <Typography variant="caption" sx={{ ml: 'auto' }}>
                                  {insight.confidence}% confidence
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" color="textPrimary">
                                {insight.insight}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < marketInsights.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Investment Timing */}
        {investmentTiming && (
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <SectionHeader 
                  title="Investment Timing"
                  icon={<Schedule sx={{ color: orange[500] }} />}
                  section="timing"
                />
                <Collapse in={expandedSections.timing}>
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h3" sx={{ color: getTimingScoreColor(investmentTiming.timingScore) }}>
                        {investmentTiming.timingScore}/100
                      </Typography>
                      <Typography variant="subtitle1" color="textSecondary">
                        Timing Score
                      </Typography>
                    </Box>

                    <Chip 
                      label={investmentTiming.recommendation}
                      color={investmentTiming.recommendation === 'Buy' ? 'success' : 
                             investmentTiming.recommendation === 'Sell' ? 'error' : 'default'}
                      sx={{ mb: 2, fontSize: '1.1rem', py: 2, px: 3, height: 'auto' }}
                    />

                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {investmentTiming.confidence}% confidence • {investmentTiming.marketCycle} market
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Key Reasoning:
                      </Typography>
                      <List dense>
                        {investmentTiming.reasoning.map((reason, index) => (
                          <ListItem key={index} sx={{ py: 0.25 }}>
                            <CheckCircle sx={{ color: green[500], fontSize: 16, mr: 1 }} />
                            <ListItemText 
                              primary={reason}
                              primaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        ))}
                      </List>

                      {investmentTiming.riskFactors.length > 0 && (
                        <>
                          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                            Risk Factors:
                          </Typography>
                          <List dense>
                            {investmentTiming.riskFactors.map((risk, index) => (
                              <ListItem key={index} sx={{ py: 0.25 }}>
                                <Warning sx={{ color: orange[500], fontSize: 16, mr: 1 }} />
                                <ListItemText 
                                  primary={risk}
                                  primaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </>
                      )}

                      {investmentTiming.opportunities.length > 0 && (
                        <>
                          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                            Opportunities:
                          </Typography>
                          <List dense>
                            {investmentTiming.opportunities.map((opportunity, index) => (
                              <ListItem key={index} sx={{ py: 0.25 }}>
                                <CheckCircle sx={{ color: blue[500], fontSize: 16, mr: 1 }} />
                                <ListItemText 
                                  primary={opportunity}
                                  primaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </>
                      )}
                    </Box>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Comparable Properties */}
        {marketData?.comparables && marketData.comparables.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <SectionHeader 
                  title={`Comparable Properties (${marketData.comparables.length})`}
                  icon={<LocationOn sx={{ color: green[500] }} />}
                  section="comparables"
                />
                <Collapse in={expandedSections.comparables}>
                  <Box sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
                    <List>
                      {marketData.comparables.slice(0, 5).map((comp, index) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemText
                              primary={comp.address}
                              secondary={
                                <Box>
                                  <Typography variant="body2">
                                    {formatCurrency(comp.salePrice)} • {formatCurrency(comp.pricePerSqft)}/sqft • {comp.distance.toFixed(1)} mi
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {comp.bedrooms}bd/{comp.bathrooms}ba • {comp.sqft.toLocaleString()} sqft • {comp.daysOnMarket} days on market
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < Math.min(marketData.comparables.length - 1, 4) && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Data Source Footer */}
      {marketData && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="textSecondary">
            Data Sources: {marketData.dataSource.join(', ')} • 
            Last Updated: {new Date(marketData.lastUpdated).toLocaleString()}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MarketIntelligenceSection;