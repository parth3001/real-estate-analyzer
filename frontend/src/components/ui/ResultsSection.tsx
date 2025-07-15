import React, { useState } from 'react';
import type { ReactNode } from 'react';

export interface Badge {
  label: string;
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

export interface ResultsSectionProps {
  title: string;
  subtitle?: string;
  summary?: ReactNode;
  children?: ReactNode;
  defaultExpanded?: boolean;
  status?: 'success' | 'warning' | 'error' | 'neutral';
  metricCount?: number;
  badges?: Badge[];
  showActions?: boolean;
  onExport?: () => void;
  onShare?: () => void;
  onPrint?: () => void;
  icon?: ReactNode;
  highlighted?: boolean;
  sx?: any;
}
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Collapse,
  IconButton,
  Chip,
  Button,
  Divider,
  Badge,
  useTheme,
  alpha,
  Fade,
  Stack,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Info,
  FileDownload,
  Share,
  Print,
  CheckCircle,
  Warning,
  Error,
  TrendingUp,
} from '@mui/icons-material';

/**
 * ResultsSection Component
 * 
 * An expandable section for organizing detailed analysis results with
 * status indicators, action buttons, and smooth expand/collapse animations.
 */
const ResultsSection: React.FC<ResultsSectionProps> = ({
  title,
  subtitle,
  summary,
  children,
  defaultExpanded = false,
  status = 'neutral',
  metricCount,
  badges = [],
  showActions = true,
  onExport,
  onShare,
  onPrint,
  icon,
  highlighted = false,
  ...props
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Status configurations
  const statusConfig = {
    success: {
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.08),
      icon: <CheckCircle />,
    },
    warning: {
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.08),
      icon: <Warning />,
    },
    error: {
      color: theme.palette.error.main,
      bgColor: alpha(theme.palette.error.main, 0.08),
      icon: <Error />,
    },
    neutral: {
      color: theme.palette.text.secondary,
      bgColor: alpha(theme.palette.grey[500], 0.08),
      icon: <Info />,
    },
  };

  const config = statusConfig[status];

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <Card
      sx={{
        border: highlighted ? `2px solid ${theme.palette.primary.main}` : '1px solid',
        borderColor: highlighted ? theme.palette.primary.main : 'divider',
        bgcolor: highlighted ? alpha(theme.palette.primary.main, 0.02) : 'background.paper',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: theme.shadows[2],
        },
        ...props.sx,
      }}
    >
      {/* Header Section - Always Visible */}
      <CardContent sx={{ pb: expanded ? 0 : 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {/* Left Side - Title and Info */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {/* Status Icon */}
              {icon || (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: config.bgColor,
                    color: config.color,
                  }}
                >
                  {config.icon}
                </Box>
              )}
              
              {/* Title and Metric Count */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" component="h3" fontWeight={600}>
                    {title}
                  </Typography>
                  {metricCount && (
                    <Chip
                      label={`${metricCount} metrics`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.75rem',
                        bgcolor: 'grey.100',
                        color: 'text.secondary',
                      }}
                    />
                  )}
                </Box>
                {subtitle && (
                  <Typography variant="body2" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}
              </Box>

              {/* Badges */}
              {badges.length > 0 && (
                <Stack direction="row" spacing={1}>
                  {badges.map((badge, index) => (
                    <Chip
                      key={index}
                      label={badge.label}
                      size="small"
                      color={badge.color || 'default'}
                      sx={{ height: 24 }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Box>

          {/* Right Side - Expand Button */}
          <IconButton
            onClick={handleToggle}
            sx={{
              ml: 2,
              bgcolor: expanded ? 'action.selected' : 'transparent',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        {/* Summary Section - Always Visible */}
        {summary && (
          <Box sx={{ mt: 2 }}>
            {summary}
          </Box>
        )}
      </CardContent>

      {/* Expandable Detailed Content */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <CardContent sx={{ pt: 3 }}>
          <Fade in={expanded} timeout={600}>
            <Box>{children}</Box>
          </Fade>
        </CardContent>

        {/* Action Buttons */}
        {showActions && (onExport || onShare || onPrint) && (
          <>
            <Divider />
            <CardActions sx={{ px: 3, py: 2, bgcolor: 'grey.50' }}>
              <Stack direction="row" spacing={1}>
                {onExport && (
                  <Button
                    size="small"
                    startIcon={<FileDownload />}
                    onClick={onExport}
                    sx={{ textTransform: 'none' }}
                  >
                    Export
                  </Button>
                )}
                {onShare && (
                  <Button
                    size="small"
                    startIcon={<Share />}
                    onClick={onShare}
                    sx={{ textTransform: 'none' }}
                  >
                    Share
                  </Button>
                )}
                {onPrint && (
                  <Button
                    size="small"
                    startIcon={<Print />}
                    onClick={onPrint}
                    sx={{ textTransform: 'none' }}
                  >
                    Print
                  </Button>
                )}
              </Stack>
            </CardActions>
          </>
        )}
      </Collapse>
    </Card>
  );
};

// Preset section interfaces
export interface PresetSectionProps extends Omit<ResultsSectionProps, 'title' | 'subtitle' | 'icon' | 'status' | 'metricCount' | 'badges'> {
  summary?: ReactNode;
  children?: ReactNode;
}

// Example preset sections for common use cases
export const FinancialAnalysisSection: React.FC<PresetSectionProps> = ({ summary, children, ...props }) => (
  <ResultsSection
    title="Financial Analysis"
    subtitle="Comprehensive income and expense breakdown"
    icon={<TrendingUp sx={{ fontSize: 24 }} />}
    status="success"
    metricCount={12}
    badges={[{ label: 'Updated', color: 'success' }]}
    summary={summary}
    {...props}
  >
    {children}
  </ResultsSection>
);

export const MarketIntelligenceSection: React.FC<PresetSectionProps> = ({ summary, children, ...props }) => (
  <ResultsSection
    title="Market Intelligence"
    subtitle="Local market data and comparable properties"
    status="neutral"
    metricCount={8}
    badges={[{ label: 'Live Data', color: 'info' }]}
    summary={summary}
    {...props}
  >
    {children}
  </ResultsSection>
);

export const InvestmentReturnsSection: React.FC<PresetSectionProps> = ({ summary, children, ...props }) => (
  <ResultsSection
    title="Investment Returns"
    subtitle="ROI, cash flow, and appreciation projections"
    status="success"
    metricCount={15}
    badges={[{ label: 'AI Enhanced', color: 'secondary' }]}
    summary={summary}
    highlighted
    {...props}
  >
    {children}
  </ResultsSection>
);

export const RiskAnalysisSection: React.FC<PresetSectionProps> = ({ summary, children, ...props }) => (
  <ResultsSection
    title="Risk Analysis"
    subtitle="Potential risks and mitigation strategies"
    status="warning"
    metricCount={6}
    summary={summary}
    {...props}
  >
    {children}
  </ResultsSection>
);

// Export all preset sections
export const ResultsSections = {
  Financial: FinancialAnalysisSection,
  Market: MarketIntelligenceSection,
  Returns: InvestmentReturnsSection,
  Risk: RiskAnalysisSection,
};

export default ResultsSection;