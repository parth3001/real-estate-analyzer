import React, { useState, useEffect, memo } from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  PieChart as ChartIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { AppleCard } from '../ui/AppleComponents';
import { propertyApi, pipelineApi } from '../../services/api';

interface Distribution {
  label: string;
  value: number;
  count: number;
  percentage: number;
  color: string;
}

interface PortfolioMetrics {
  geographic: Distribution[];
  propertyType: Distribution[];
  priceRange: Distribution[];
  totalValue: number;
  totalProperties: number;
  concentrationRisks: string[];
}

const PROPERTY_TYPE_LABELS: { [key: string]: string } = {
  'SFR': 'Single Family',
  'MF': 'Multi-Family',
  'CONDO': 'Condo',
  'TOWNHOUSE': 'Townhouse',
  'COMMERCIAL_RETAIL': 'Retail',
  'COMMERCIAL_OFFICE': 'Office',
  'COMMERCIAL_INDUSTRIAL': 'Industrial',
  'OTHER': 'Other'
};

const COLORS = [
  '#4F46E5', // Indigo
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#14B8A6'  // Teal
];

const PortfolioDistribution: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);

      // Load both deals and pipeline properties
      const [dealsResponse, pipelineResponse] = await Promise.all([
        propertyApi.getAllProperties(),
        pipelineApi.getDeals()
      ]);

      const allProperties = [
        ...(dealsResponse.data || []),
        ...(pipelineResponse.data?.deals || [])
      ];

      // Remove duplicates based on ID
      const uniqueProperties = Array.from(
        new Map(allProperties.map(p => [p._id, p])).values()
      );

      calculateDistributions(uniqueProperties);
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistributions = (properties: any[]) => {
    const totalValue = properties.reduce((sum, p) => sum + (p.purchasePrice || p.askingPrice || 0), 0);
    const totalProperties = properties.length;

    // Geographic distribution
    const geoMap = new Map<string, { value: number; count: number }>();
    properties.forEach(p => {
      const location = p.propertyAddress
        ? `${p.propertyAddress.city}, ${p.propertyAddress.state}`
        : p.address
        ? `${p.address.city}, ${p.address.state}`
        : 'Unknown';

      const current = geoMap.get(location) || { value: 0, count: 0 };
      current.value += p.purchasePrice || p.askingPrice || 0;
      current.count += 1;
      geoMap.set(location, current);
    });

    const geographic = Array.from(geoMap.entries())
      .map(([location, data], index) => ({
        label: location,
        value: data.value,
        count: data.count,
        percentage: Math.round((data.value / totalValue) * 100),
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 locations

    // Property type distribution
    const typeMap = new Map<string, { value: number; count: number }>();
    properties.forEach(p => {
      const type = p.propertyType || 'OTHER';
      const current = typeMap.get(type) || { value: 0, count: 0 };
      current.value += p.purchasePrice || p.askingPrice || 0;
      current.count += 1;
      typeMap.set(type, current);
    });

    const propertyType = Array.from(typeMap.entries())
      .map(([type, data], index) => ({
        label: PROPERTY_TYPE_LABELS[type] || type,
        value: data.value,
        count: data.count,
        percentage: Math.round((data.value / totalValue) * 100),
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    // Price range distribution
    const priceRanges = [
      { min: 0, max: 100000, label: '<$100K' },
      { min: 100000, max: 250000, label: '$100-250K' },
      { min: 250000, max: 500000, label: '$250-500K' },
      { min: 500000, max: 1000000, label: '$500K-1M' },
      { min: 1000000, max: Infinity, label: '>$1M' }
    ];

    const priceRange = priceRanges.map((range, index) => {
      const inRange = properties.filter(p => {
        const price = p.purchasePrice || p.askingPrice || 0;
        return price >= range.min && price < range.max;
      });

      const value = inRange.reduce((sum, p) => sum + (p.purchasePrice || p.askingPrice || 0), 0);

      return {
        label: range.label,
        value,
        count: inRange.length,
        percentage: Math.round((value / totalValue) * 100),
        color: COLORS[index % COLORS.length]
      };
    }).filter(r => r.count > 0);

    // Identify concentration risks
    const concentrationRisks: string[] = [];

    // Geographic concentration risk
    if (geographic.length > 0 && geographic[0].percentage > 60) {
      concentrationRisks.push(`${geographic[0].percentage}% concentrated in ${geographic[0].label}`);
    }

    // Property type concentration risk
    if (propertyType.length > 0 && propertyType[0].percentage > 70) {
      concentrationRisks.push(`${propertyType[0].percentage}% in ${propertyType[0].label} properties`);
    }

    // Price range concentration risk
    if (priceRange.length === 1) {
      concentrationRisks.push('All properties in single price range');
    }

    setMetrics({
      geographic,
      propertyType,
      priceRange,
      totalValue,
      totalProperties,
      concentrationRisks
    });
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${Math.round(amount).toLocaleString()}`;
  };

  const renderDistributionBars = (data: Distribution[], icon: React.ReactNode) => {
    if (data.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No data available
        </Typography>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {data.map((item, index) => (
          <Box key={`${item.label}-${index}`}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {icon}
                <Typography variant="caption" fontWeight={500}>
                  {item.label}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`${item.count}`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatCurrency(item.value)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ flex: 1, position: 'relative' }}>
                <LinearProgress
                  variant="determinate"
                  value={item.percentage}
                  sx={{
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: 'grey.100',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: item.color,
                      borderRadius: 10
                    }
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontWeight: 600,
                    color: item.percentage > 50 ? 'white' : 'text.primary',
                    fontSize: '0.7rem'
                  }}
                >
                  {item.percentage}%
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  if (loading) {
    return (
      <AppleCard padding="large">
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          Saved Properties Distribution
        </Typography>
        <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
      </AppleCard>
    );
  }

  if (!metrics || metrics.totalProperties === 0) {
    return (
      <AppleCard padding="large">
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          Saved Properties Distribution
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <ChartIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            No saved properties yet
          </Typography>
        </Box>
      </AppleCard>
    );
  }

  return (
    <AppleCard padding="large">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Saved Properties Distribution
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={`${metrics.totalProperties} properties`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={formatCurrency(metrics.totalValue)}
            size="small"
            color="primary"
          />
        </Box>
      </Box>

      {/* Distributions */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Geographic Distribution */}
        <Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon sx={{ fontSize: 18 }} />
            Geographic Distribution
          </Typography>
          {renderDistributionBars(metrics.geographic, <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />)}
        </Box>

        {/* Property Type Distribution */}
        <Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HomeIcon sx={{ fontSize: 18 }} />
            Property Type
          </Typography>
          {renderDistributionBars(metrics.propertyType, <HomeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />)}
        </Box>

        {/* Price Range Distribution */}
        <Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoneyIcon sx={{ fontSize: 18 }} />
            Price Range
          </Typography>
          {renderDistributionBars(metrics.priceRange, <MoneyIcon sx={{ fontSize: 14, color: 'text.secondary' }} />)}
        </Box>
      </Box>

      {/* Concentration Risks */}
      {metrics.concentrationRisks.length > 0 && (
        <Box sx={{
          mt: 3,
          p: 2,
          backgroundColor: 'warning.light',
          borderRadius: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <WarningIcon sx={{ fontSize: 20, color: 'warning.dark' }} />
            <Box>
              <Typography variant="subtitle2" fontWeight={600} color="warning.dark">
                Concentration Risks
              </Typography>
              {metrics.concentrationRisks.map((risk, index) => (
                <Typography key={index} variant="caption" color="warning.dark" display="block">
                  • {risk}
                </Typography>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </AppleCard>
  );
};

export default memo(PortfolioDistribution);