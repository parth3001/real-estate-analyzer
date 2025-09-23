import React, { useState, useEffect, memo } from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Chip,
  Avatar,
  Button
} from '@mui/material';
import {
  Add as AddIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AppleCard, AppleButton } from '../ui/AppleComponents';
import { propertyApi, pipelineApi } from '../../services/api';

interface ActivityItem {
  id: string;
  type: 'PROPERTY_ADDED' | 'ANALYSIS_COMPLETED' | 'VERDICT_CHANGED' | 'STAGE_ADVANCED' | 'PIPELINE_ADDED';
  title: string;
  description: string;
  timestamp: string;
  propertyName: string;
  metadata?: {
    verdict?: string;
    dealQuality?: number;
    fromStage?: string;
    toStage?: string;
    propertyType?: string;
    askingPrice?: number;
  };
}

const ACTIVITY_CONFIG = {
  PROPERTY_ADDED: {
    icon: AddIcon,
    color: 'primary.main',
    bgColor: 'primary.light',
    label: 'Property Added'
  },
  ANALYSIS_COMPLETED: {
    icon: AnalyticsIcon,
    color: 'success.main',
    bgColor: 'success.light',
    label: 'Analysis Complete'
  },
  VERDICT_CHANGED: {
    icon: AssignmentIcon,
    color: 'warning.main',
    bgColor: 'warning.light',
    label: 'Verdict Updated'
  },
  STAGE_ADVANCED: {
    icon: TrendingUpIcon,
    color: 'info.main',
    bgColor: 'info.light',
    label: 'Stage Advanced'
  },
  PIPELINE_ADDED: {
    icon: AddIcon,
    color: 'secondary.main',
    bgColor: 'secondary.light',
    label: 'Added to Pipeline'
  }
};

const VERDICT_COLORS = {
  BUY: 'success',
  NEGOTIATE: 'warning',
  CAUTION: 'warning',
  PASS: 'error'
};

const ActivityTimeline: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadActivityData();
  }, []);

  const loadActivityData = async () => {
    try {
      setLoading(true);

      // Load both deals and pipeline data to generate timeline
      const [dealsResponse, pipelineResponse] = await Promise.all([
        propertyApi.getAllProperties(),
        pipelineApi.getDeals()
      ]);

      const deals = dealsResponse.data || [];
      const pipelineDeals = pipelineResponse.data?.deals || [];

      generateActivities([...deals, ...pipelineDeals]);
    } catch (error) {
      console.error('Error loading activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateActivities = (allProperties: any[]) => {
    const activities: ActivityItem[] = [];

    allProperties.forEach(property => {
      const propertyName = property.propertyName ||
                          property.dealName ||
                          `${property.propertyAddress?.street || property.address?.street || 'Property'}`;

      // Property added to deals/pipeline
      const addedDate = property.createdAt || property.updatedAt;
      if (addedDate) {
        const isFromPipeline = property.currentStage !== undefined;
        activities.push({
          id: `${property._id}-added`,
          type: isFromPipeline ? 'PIPELINE_ADDED' : 'PROPERTY_ADDED',
          title: isFromPipeline ? 'Added to Pipeline' : 'Property Added',
          description: `${propertyName} was ${isFromPipeline ? 'added to pipeline' : 'saved for analysis'}`,
          timestamp: addedDate,
          propertyName,
          metadata: {
            propertyType: property.propertyType,
            askingPrice: property.purchasePrice || property.askingPrice
          }
        });
      }

      // Analysis completed
      if (property.analysis && property.analysis.timestamp) {
        activities.push({
          id: `${property._id}-analysis`,
          type: 'ANALYSIS_COMPLETED',
          title: 'Analysis Completed',
          description: `Investment analysis completed for ${propertyName}`,
          timestamp: property.analysis.timestamp,
          propertyName,
          metadata: {
            verdict: property.investmentDecision?.verdict,
            dealQuality: property.investmentDecision?.professionalAssessment?.dealQuality
          }
        });
      }

      // Stage changes (for pipeline properties)
      if (property.stageHistory && property.stageHistory.length > 1) {
        property.stageHistory.slice(1).forEach((entry: any, index: number) => {
          const previousStage = property.stageHistory[index];
          activities.push({
            id: `${property._id}-stage-${index}`,
            type: 'STAGE_ADVANCED',
            title: 'Stage Advanced',
            description: `${propertyName} moved from ${previousStage.stage} to ${entry.stage}`,
            timestamp: entry.date,
            propertyName,
            metadata: {
              fromStage: previousStage.stage,
              toStage: entry.stage
            }
          });
        });
      }
    });

    // Sort by timestamp (newest first) and limit to recent activities
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20); // Keep last 20 activities

    setActivities(sortedActivities);
  };

  const formatTimeAgo = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${Math.round(amount).toLocaleString()}`;
  };

  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  if (loading) {
    return (
      <AppleCard padding="large">
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          Activity Timeline
        </Typography>
        {[1, 2, 3, 4].map((i) => (
          <Box key={i} sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="40%" height={16} />
            </Box>
          </Box>
        ))}
      </AppleCard>
    );
  }

  if (activities.length === 0) {
    return (
      <AppleCard padding="large">
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          Activity Timeline
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <TimelineIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            No recent activity
          </Typography>
          <AppleButton
            variant="primary"
            onClick={() => navigate('/sfr-analysis')}
            icon={<AddIcon />}
          >
            Start Analyzing Properties
          </AppleButton>
        </Box>
      </AppleCard>
    );
  }

  return (
    <AppleCard padding="large">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Activity Timeline
        </Typography>
        <Chip
          label={`${activities.length} activities`}
          size="small"
          variant="outlined"
        />
      </Box>

      {/* Timeline */}
      <Box sx={{ position: 'relative' }}>
        {/* Timeline line */}
        <Box
          sx={{
            position: 'absolute',
            left: 20,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: 'divider',
            zIndex: 0
          }}
        />

        {/* Activity items */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {displayedActivities.map((activity) => {
            const config = ACTIVITY_CONFIG[activity.type];
            const Icon = config.icon;

            return (
              <Box key={activity.id} sx={{ display: 'flex', gap: 2, position: 'relative', zIndex: 1 }}>
                {/* Activity icon */}
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: config.bgColor,
                    color: config.color
                  }}
                >
                  <Icon sx={{ fontSize: 20 }} />
                </Avatar>

                {/* Activity content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {activity.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ScheduleIcon sx={{ fontSize: 12 }} />
                      {formatTimeAgo(activity.timestamp)}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {activity.description}
                  </Typography>

                  {/* Metadata chips */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {activity.metadata?.verdict && (
                      <Chip
                        label={activity.metadata.verdict}
                        size="small"
                        color={VERDICT_COLORS[activity.metadata.verdict as keyof typeof VERDICT_COLORS] as any}
                        variant="outlined"
                      />
                    )}
                    {activity.metadata?.dealQuality && (
                      <Chip
                        label={`${activity.metadata.dealQuality}/100`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {activity.metadata?.propertyType && (
                      <Chip
                        label={activity.metadata.propertyType}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {activity.metadata?.askingPrice && (
                      <Chip
                        label={formatCurrency(activity.metadata.askingPrice)}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {activity.metadata?.fromStage && activity.metadata?.toStage && (
                      <Chip
                        label={`${activity.metadata.fromStage} → ${activity.metadata.toStage}`}
                        size="small"
                        variant="outlined"
                        color="info"
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Show More/Less Button */}
      {activities.length > 5 && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            variant="text"
            onClick={() => setShowAll(!showAll)}
            startIcon={showAll ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            {showAll ? 'Show Less' : `Show ${activities.length - 5} More Activities`}
          </Button>
        </Box>
      )}
    </AppleCard>
  );
};

export default memo(ActivityTimeline);