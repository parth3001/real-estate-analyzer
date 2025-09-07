import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Tooltip
} from '@mui/material';
import { 
  MoreVert as MoreIcon,
  Analytics as AnalyticsIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { Draggable } from 'react-beautiful-dnd';
import type { PipelineDeal } from '../../types/pipeline';
import { PropertyType, DealSource } from '../../types/pipeline';
import { formatCurrency } from '../../utils/formatters';
import { ConfidenceIndicator } from '../ui/ConfidenceIndicator';

interface DealCardProps {
  deal: PipelineDeal;
  index: number;
  onDelete: (dealId: string) => Promise<void>;
  onAnalyze: (deal: PipelineDeal) => void;
  onEdit: (deal: PipelineDeal) => void;
  isDragging: boolean;
}

// Calculate investment insights level for Pipeline deals
const calculatePipelineInsightsLevel = (deal: PipelineDeal): 1 | 2 | 3 => {
  // Check if backend confidence level is available (from our new model)
  if (deal.confidence?.level) {
    return deal.confidence.level as 1 | 2 | 3;
  }
  
  // Fallback calculation based on deal data
  // Level 3: Full analysis (linked to complete Deal analysis)
  if (deal.analysisStatus === 'COMPLETE' && deal.analysisId) {
    return 3;
  }
  
  // Level 2: Quick metrics calculated
  if (deal.quickMetrics && (
    deal.quickMetrics.cashFlow !== undefined || 
    deal.quickMetrics.capRate !== undefined ||
    deal.quickMetrics.cashOnCashReturn !== undefined
  )) {
    return 2;
  }
  
  // Level 1: Basic deal info only
  return 1;
};

export const DealCard: React.FC<DealCardProps> = ({ 
  deal, 
  index, 
  onDelete,
  onAnalyze,
  onEdit,
  isDragging 
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleMenuClose();
    if (confirm(`Are you sure you want to delete "${deal.dealName}"?`)) {
      onDelete(deal._id);
    }
  };

  const handleAnalyze = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleMenuClose();
    
    // Open skinny calculator for all property types
    onAnalyze(deal);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleMenuClose();
    
    // Open edit modal
    onEdit(deal);
  };


  const getPropertyTypeColor = (type: PropertyType) => {
    const colors = {
      [PropertyType.SFR]: '#2563eb',
      [PropertyType.MF]: '#059669',
      [PropertyType.COMMERCIAL_RETAIL]: '#d97706',
      [PropertyType.COMMERCIAL_OFFICE]: '#7c3aed',
      [PropertyType.SELF_STORAGE]: '#dc2626',
      [PropertyType.CONDO]: '#0891b2',
      [PropertyType.TOWNHOUSE]: '#ea580c',
      [PropertyType.APARTMENT]: '#059669',
      [PropertyType.COMMERCIAL_INDUSTRIAL]: '#374151',
      [PropertyType.COMMERCIAL_MIXED]: '#7c2d12',
      [PropertyType.MOBILE_HOME_PARK]: '#be123c',
      [PropertyType.LAND]: '#65a30d',
      [PropertyType.OTHER]: '#6b7280'
    };
    return colors[type] || '#6b7280';
  };

  const getSourceColor = (source: DealSource) => {
    const colors = {
      [DealSource.MLS]: '#2563eb',
      [DealSource.AGENT]: '#059669',
      [DealSource.DIRECT_MARKETING]: '#d97706',
      [DealSource.ONLINE]: '#7c3aed',
      [DealSource.REFERRAL]: '#dc2626',
      [DealSource.COLD_CALLING]: '#0891b2',
      [DealSource.OTHER]: '#6b7280'
    };
    return colors[source] || '#6b7280';
  };

  return (
    <Draggable draggableId={deal._id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            mb: 2,
            cursor: 'grab',
            transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
            boxShadow: snapshot.isDragging ? 3 : 1,
            backgroundColor: snapshot.isDragging ? '#f9fafb' : 'white',
            border: snapshot.isDragging ? '2px solid #3b82f6' : '1px solid #e5e7eb',
            transition: isDragging ? 'none' : 'all 0.2s',
            '&:hover': {
              boxShadow: 2,
              borderColor: '#d1d5db'
            }
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: '0.875rem',
                  lineHeight: 1.2,
                  maxWidth: '80%'
                }}
              >
                {deal.dealName}
              </Typography>
              
              <IconButton
                size="small"
                onClick={handleMenuClick}
                sx={{ p: 0.5 }}
              >
                <MoreIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Address */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationIcon sx={{ fontSize: 14, color: 'text.secondary', mr: 0.5 }} />
              <Typography variant="caption" color="text.secondary">
                {deal.address.city}, {deal.address.state}
              </Typography>
            </Box>

            {/* Price & Investment Insights */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MoneyIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {formatCurrency(deal.askingPrice)}
                </Typography>
              </Box>
              
              <ConfidenceIndicator 
                level={calculatePipelineInsightsLevel(deal)}
                size="small"
                source={`Pipeline (${deal.sourceInfo.channel})`}
              />
            </Box>

            {/* Property Details */}
            {deal.propertyDetails && (
              <Box sx={{ mb: 2 }}>
                {deal.propertyType === PropertyType.SFR && deal.propertyDetails.bedrooms && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {deal.propertyDetails.bedrooms}bd/{deal.propertyDetails.bathrooms}ba
                    {deal.propertyDetails.squareFootage && ` • ${deal.propertyDetails.squareFootage.toLocaleString()} sqft`}
                  </Typography>
                )}
                {deal.propertyType === PropertyType.MF && deal.propertyDetails.units && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {deal.propertyDetails.units} units
                  </Typography>
                )}
              </Box>
            )}

            {/* Tags */}
            <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={deal.propertyType} 
                size="small"
                sx={{ 
                  fontSize: '0.7rem',
                  height: 20,
                  backgroundColor: getPropertyTypeColor(deal.propertyType),
                  color: 'white'
                }}
              />
              
              <Chip 
                label={deal.sourceInfo.channel} 
                size="small"
                sx={{ 
                  fontSize: '0.7rem',
                  height: 20,
                  backgroundColor: getSourceColor(deal.sourceInfo.channel),
                  color: 'white'
                }}
              />
            </Box>

            {/* Analysis Status & Metrics */}
            {deal.analysisStatus === 'COMPLETE' && deal.quickMetrics && (
              <Box sx={{ mb: 2, p: 1, backgroundColor: '#f8fafc', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Analysis Complete
                  </Typography>
                  {deal.quickMetrics.verdict && (
                    <Chip 
                      label={deal.quickMetrics.verdict} 
                      size="small"
                      color={
                        deal.quickMetrics.verdict === 'BUY' ? 'success' :
                        deal.quickMetrics.verdict === 'NEGOTIATE' ? 'warning' :
                        deal.quickMetrics.verdict === 'CAUTION' ? 'warning' : 'error'
                      }
                      sx={{ fontSize: '0.6rem', height: 16 }}
                    />
                  )}
                </Box>
                
                {deal.quickMetrics.dealQuality && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Deal Quality: {deal.quickMetrics.dealQuality}/100
                  </Typography>
                )}
                
                {deal.quickMetrics.cashFlow && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Cash Flow: {formatCurrency(deal.quickMetrics.cashFlow)}/mo
                  </Typography>
                )}
              </Box>
            )}

            {/* Footer */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon sx={{ fontSize: 12, color: 'text.secondary', mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  {deal.daysInCurrentStage || 0} days
                </Typography>
              </Box>
              
              {deal.analysisStatus === 'NOT_ANALYZED' && (
                <Badge color="primary" variant="dot">
                  <Tooltip title="Ready to analyze">
                    <TrendingUpIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  </Tooltip>
                </Badge>
              )}
            </Box>

            {/* Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleAnalyze}>
                <AnalyticsIcon sx={{ mr: 1, fontSize: 16 }} />
                Analyze Deal
              </MenuItem>
              <MenuItem onClick={handleEdit}>
                <EditIcon sx={{ mr: 1, fontSize: 16 }} />
                Edit
              </MenuItem>
              <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                <DeleteIcon sx={{ mr: 1, fontSize: 16 }} />
                Delete
              </MenuItem>
            </Menu>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};