import React, { useState, useEffect, memo } from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  ArrowForward as ArrowForwardIcon,
  Schedule as ScheduleIcon,
  AttachMoney as AttachMoneyIcon,
  HelpOutline as HelpOutlineIcon,
  Timeline as PipelineIcon,
  Assessment as AnalysisIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AppleCard, AppleButton } from '../ui/AppleComponents';
import { propertyApi, pipelineApi } from '../../services/api';

interface DecisionItem {
  id: string;
  propertyName: string;
  address: string;
  askingPrice: number;
  verdict: 'BUY' | 'NEGOTIATE' | 'CAUTION' | 'PASS';
  dealQuality: number;
  cashFlow: number;
  analysisDate: string;
  daysWaiting: number;
  source: 'pipeline' | 'standalone';
  pipelineStage?: string;
}

const VERDICT_CONFIG = {
  BUY: { color: 'success', icon: CheckCircleIcon },
  NEGOTIATE: { color: 'warning', icon: InfoIcon },
  CAUTION: { color: 'warning', icon: InfoIcon },
  PASS: { color: 'error', icon: CancelIcon }
};

const DecisionQueue: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);

  useEffect(() => {
    loadDecisions();
  }, []);

  const loadDecisions = async () => {
    try {
      setLoading(true);
      // Get both saved properties and pipeline properties
      const [propertiesResponse, pipelineResponse] = await Promise.all([
        propertyApi.getAllProperties(),
        pipelineApi.getDeals()
      ]);

      const savedProperties = (propertiesResponse.data || []).map((p: any) => ({ ...p, source: 'standalone' }));
      const pipelineProperties = (pipelineResponse.data?.deals || []).map((p: any) => ({ ...p, source: 'pipeline' }));

      const allProperties = [...savedProperties, ...pipelineProperties];

      // Remove duplicates - prefer pipeline version over standalone
      const propertyMap = new Map();
      allProperties.forEach(p => {
        const existing = propertyMap.get(p._id);
        if (!existing || (p.source === 'pipeline' && existing.source === 'standalone')) {
          propertyMap.set(p._id, p);
        }
      });
      const uniqueProperties = Array.from(propertyMap.values());

      if (uniqueProperties.length > 0) {
        console.log('Checking properties for decision queue:', uniqueProperties.length);
        console.log('First property structure:', uniqueProperties[0]);

        // Filter for properties with completed analyses and pending decisions
        const pendingDecisions = uniqueProperties
          .filter((deal: any) => {
            // More flexible checks for different data structures
            const hasAnalysis = !!(deal.analysis || deal.analysisResults || deal.analysisData);
            const hasVerdict = !!(deal.investmentDecision?.verdict || deal.verdict || deal.analysis?.verdict || deal.quickMetrics?.verdict);
            // More lenient active check - if no stage is defined, assume it's active
            const isActive = !deal.currentStage || (deal.currentStage !== 'CLOSED' && deal.currentStage !== 'LOST');

            console.log(`Decision Queue Filter - Property ${deal._id}:`, {
              hasAnalysis,
              hasVerdict,
              isActive,
              currentStage: deal.currentStage,
              qualifies: hasAnalysis && hasVerdict && isActive,
              analysisData: deal.analysis || deal.analysisResults || deal.analysisData || 'none',
              verdictData: deal.investmentDecision?.verdict || deal.verdict || deal.analysis?.verdict || deal.quickMetrics?.verdict || 'none'
            });

            return hasAnalysis && hasVerdict && isActive;
          })
          .map((deal: any) => {
            // Flexible data extraction
            const analysis = deal.analysis || deal.analysisResults || deal.analysisData || {};
            const investmentDecision = deal.investmentDecision || {};
            const analysisDate = new Date(analysis.timestamp || deal.updatedAt || deal.createdAt);
            const now = new Date();
            const daysWaiting = Math.floor((now.getTime() - analysisDate.getTime()) / (1000 * 60 * 60 * 24));

            // Property name fallbacks
            const propertyName = deal.propertyName ||
                               deal.dealName ||
                               `${deal.propertyAddress?.street || deal.address?.street || 'Property'}`;

            // Address fallbacks
            const address = formatAddress(deal.propertyAddress || deal.address);

            // Price fallbacks
            const askingPrice = deal.purchasePrice || deal.askingPrice || 0;

            // Verdict fallbacks
            const verdict = investmentDecision.verdict || deal.verdict || analysis.verdict || deal.quickMetrics?.verdict || 'REVIEW';

            // Deal quality fallbacks
            const dealQuality = investmentDecision.professionalAssessment?.dealQuality ||
                              deal.dealQuality ||
                              analysis.dealQuality ||
                              deal.quickMetrics?.dealQuality || 0;

            // Cash flow fallbacks
            const cashFlow = analysis.monthlyAnalysis?.cashFlow ||
                           analysis.cashFlow ||
                           deal.cashFlow || 0;

            return {
              id: deal._id,
              propertyName,
              address,
              askingPrice,
              verdict,
              dealQuality,
              cashFlow,
              analysisDate: analysisDate.toISOString(),
              daysWaiting,
              source: deal.source,
              pipelineStage: deal.source === 'pipeline' ? deal.currentStage : undefined
            };
          })
          .sort((a: DecisionItem, b: DecisionItem) => {
            // Pipeline deals first, then standalone
            if (a.source !== b.source) {
              return a.source === 'pipeline' ? -1 : 1;
            }
            // Within same source, sort by deal quality
            return b.dealQuality - a.dealQuality;
          })
          .slice(0, 5); // Top 5 decisions

        console.log('Final Decision Queue decisions:', pendingDecisions.length, pendingDecisions);
        setDecisions(pendingDecisions);
      }
    } catch (error) {
      console.error('Error loading decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: any): string => {
    if (!address) return 'Unknown Location';
    return `${address.city || ''}, ${address.state || ''}`.trim() || 'Unknown Location';
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${Math.round(amount).toLocaleString()}`;
  };

  const getVerdictColor = (verdict: string) => {
    return VERDICT_CONFIG[verdict as keyof typeof VERDICT_CONFIG]?.color || 'default';
  };

  const getDaysColor = (days: number): string => {
    if (days > 30) return 'error';
    if (days > 14) return 'warning';
    return 'default';
  };

  const getSourceBadge = (item: DecisionItem) => {
    if (item.source === 'pipeline' && item.pipelineStage) {
      const stageLabels: { [key: string]: string } = {
        'WATCHING': 'Watching',
        'ANALYZING': 'Analyzing',
        'NEGOTIATING': 'Negotiating',
        'UNDER_CONTRACT': 'Under Contract'
      };
      return {
        label: stageLabels[item.pipelineStage] || item.pipelineStage,
        color: 'primary' as const,
        icon: <PipelineIcon />
      };
    }
    return {
      label: 'Analyzed',
      color: 'default' as const,
      icon: <AnalysisIcon />
    };
  };

  if (loading) {
    return (
      <AppleCard padding="large">
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          Decision Queue
        </Typography>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={80} sx={{ mb: 2, borderRadius: 2 }} />
        ))}
      </AppleCard>
    );
  }

  if (decisions.length === 0) {
    return (
      <AppleCard padding="large">
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          Decision Queue
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            No pending decisions. All properties are handled!
          </Typography>
          <AppleButton
            variant="primary"
            onClick={() => navigate('/sfr-analysis')}
          >
            Analyze New Property
          </AppleButton>
        </Box>
      </AppleCard>
    );
  }

  return (
    <AppleCard padding="large">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            Decision Queue
          </Typography>
          <Tooltip
            title="Properties with completed analysis that need your investment decision. Each property shows AI verdict, deal quality score, and projected cash flow to help you make informed investment choices."
            placement="top"
            arrow
          >
            <HelpOutlineIcon sx={{ fontSize: 18, color: 'text.secondary', cursor: 'help' }} />
          </Tooltip>
        </Box>
        <Chip
          label={`${decisions.length} Pending`}
          size="small"
          color="primary"
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {decisions.map((item) => {
          const VerdictIcon = VERDICT_CONFIG[item.verdict as keyof typeof VERDICT_CONFIG]?.icon || InfoIcon;
          const sourceBadge = getSourceBadge(item);

          return (
            <Box
              key={item.id}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'translateX(0px) scale(1)',
                '&:hover': {
                  backgroundColor: 'grey.50',
                  transform: 'translateX(8px) scale(1.02)',
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }
              }}
              onClick={() => navigate(`/analysis/${item.id}`)}
            >
              {/* Row 1: Property Name, Source Badge, and Days Waiting */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {item.propertyName}
                  </Typography>
                  <Chip
                    icon={sourceBadge.icon}
                    label={sourceBadge.label}
                    size="small"
                    color={sourceBadge.color}
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>
                <Chip
                  icon={<ScheduleIcon />}
                  label={`${item.daysWaiting}d waiting`}
                  size="small"
                  color={getDaysColor(item.daysWaiting) as any}
                  variant="outlined"
                />
              </Box>

              {/* Row 2: Address and Price */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {item.address}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(item.askingPrice)}
                </Typography>
              </Box>

              {/* Row 3: Verdict, Deal Quality, Cash Flow */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  icon={<VerdictIcon />}
                  label={item.verdict}
                  color={getVerdictColor(item.verdict) as any}
                  size="small"
                />
                <Chip
                  label={`Quality: ${item.dealQuality}/100`}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: item.dealQuality >= 70 ? 'success.main' :
                               item.dealQuality >= 50 ? 'warning.main' : 'error.main'
                  }}
                />
                <Chip
                  icon={<AttachMoneyIcon />}
                  label={`${item.cashFlow >= 0 ? '+' : ''}${formatCurrency(item.cashFlow)}/mo`}
                  size="small"
                  variant="outlined"
                  color={item.cashFlow >= 0 ? 'success' : 'error'}
                />
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Review Analysis">
                  <IconButton size="small">
                    <ArrowForwardIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          );
        })}
      </Box>

      {decisions.length > 3 && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <AppleButton
            variant="ghost"
            onClick={() => navigate('/saved-properties')}
          >
            View All Properties
          </AppleButton>
        </Box>
      )}
    </AppleCard>
  );
};

export default memo(DecisionQueue);