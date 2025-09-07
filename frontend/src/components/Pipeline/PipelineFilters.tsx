import React, { useState } from 'react';
import {
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Collapse
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandIcon
} from '@mui/icons-material';
import type { PipelineFilters as FilterType } from '../../types/pipeline';
import { PropertyType, DealSource, DealStage } from '../../types/pipeline';

interface PipelineFiltersProps {
  onFiltersChange: (filters: FilterType) => void;
}

export const PipelineFilters: React.FC<PipelineFiltersProps> = ({ onFiltersChange }) => {
  const [filters, setFilters] = useState<FilterType>({});
  const [expanded, setExpanded] = useState(false);

  const handleFilterChange = (key: keyof FilterType, value: any) => {
    const newFilters = { ...filters, [key]: value };
    if (value === '' || value === undefined) {
      delete newFilters[key];
    }
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;
  const activeFilterCount = Object.keys(filters).length;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon color="action" />
          <span>Filters</span>
          {hasActiveFilters && (
            <Chip 
              label={`${activeFilterCount} active`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasActiveFilters && (
            <IconButton size="small" onClick={clearFilters} title="Clear filters">
              <ClearIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton 
            size="small" 
            onClick={() => setExpanded(!expanded)}
            sx={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          >
            <ExpandIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Filter Controls */}
      <Collapse in={expanded}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
          gap: 2, 
          mt: 2 
        }}>
          {/* Stage Filter */}
          <FormControl size="small">
            <InputLabel>Stage</InputLabel>
            <Select
              value={filters.stage || ''}
              label="Stage"
              onChange={(e) => handleFilterChange('stage', e.target.value)}
            >
              <MenuItem value="">All Stages</MenuItem>
              <MenuItem value={DealStage.WATCHING}>Watching</MenuItem>
              <MenuItem value={DealStage.ANALYZING}>Analyzing</MenuItem>
              <MenuItem value={DealStage.NEGOTIATING}>Negotiating</MenuItem>
              <MenuItem value={DealStage.UNDER_CONTRACT}>Under Contract</MenuItem>
              <MenuItem value={DealStage.CLOSED}>Closed</MenuItem>
              <MenuItem value={DealStage.LOST}>Lost</MenuItem>
            </Select>
          </FormControl>

          {/* Property Type Filter */}
          <FormControl size="small">
            <InputLabel>Property Type</InputLabel>
            <Select
              value={filters.propertyType || ''}
              label="Property Type"
              onChange={(e) => handleFilterChange('propertyType', e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value={PropertyType.SFR}>Single Family</MenuItem>
              <MenuItem value={PropertyType.MF}>Multifamily</MenuItem>
              <MenuItem value={PropertyType.CONDO}>Condo</MenuItem>
              <MenuItem value={PropertyType.TOWNHOUSE}>Townhouse</MenuItem>
              <MenuItem value={PropertyType.APARTMENT}>Large Multifamily</MenuItem>
              <MenuItem value={PropertyType.COMMERCIAL_RETAIL}>Commercial - Retail</MenuItem>
              <MenuItem value={PropertyType.COMMERCIAL_OFFICE}>Commercial - Office</MenuItem>
              <MenuItem value={PropertyType.COMMERCIAL_INDUSTRIAL}>Commercial - Industrial</MenuItem>
              <MenuItem value={PropertyType.SELF_STORAGE}>Self Storage</MenuItem>
              <MenuItem value={PropertyType.MOBILE_HOME_PARK}>Mobile Home Park</MenuItem>
              <MenuItem value={PropertyType.LAND}>Land</MenuItem>
              <MenuItem value={PropertyType.OTHER}>Other</MenuItem>
            </Select>
          </FormControl>

          {/* Source Filter */}
          <FormControl size="small">
            <InputLabel>Source</InputLabel>
            <Select
              value={filters.source || ''}
              label="Source"
              onChange={(e) => handleFilterChange('source', e.target.value)}
            >
              <MenuItem value="">All Sources</MenuItem>
              <MenuItem value={DealSource.MLS}>MLS</MenuItem>
              <MenuItem value={DealSource.AGENT}>Agent</MenuItem>
              <MenuItem value={DealSource.DIRECT_MARKETING}>Direct Marketing</MenuItem>
              <MenuItem value={DealSource.ONLINE}>Online</MenuItem>
              <MenuItem value={DealSource.REFERRAL}>Referral</MenuItem>
              <MenuItem value={DealSource.COLD_CALLING}>Cold Calling</MenuItem>
              <MenuItem value={DealSource.OTHER}>Other</MenuItem>
            </Select>
          </FormControl>

          {/* Price Range - Min */}
          <TextField
            size="small"
            label="Min Price"
            type="number"
            value={filters.minPrice || ''}
            onChange={(e) => handleFilterChange('minPrice', Number(e.target.value) || undefined)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />

          {/* Price Range - Max */}
          <TextField
            size="small"
            label="Max Price"
            type="number"
            value={filters.maxPrice || ''}
            onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value) || undefined)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        </Box>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {filters.stage && (
              <Chip
                label={`Stage: ${filters.stage}`}
                size="small"
                onDelete={() => handleFilterChange('stage', undefined)}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.propertyType && (
              <Chip
                label={`Type: ${filters.propertyType}`}
                size="small"
                onDelete={() => handleFilterChange('propertyType', undefined)}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.source && (
              <Chip
                label={`Source: ${filters.source}`}
                size="small"
                onDelete={() => handleFilterChange('source', undefined)}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.minPrice && (
              <Chip
                label={`Min: $${filters.minPrice.toLocaleString()}`}
                size="small"
                onDelete={() => handleFilterChange('minPrice', undefined)}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.maxPrice && (
              <Chip
                label={`Max: $${filters.maxPrice.toLocaleString()}`}
                size="small"
                onDelete={() => handleFilterChange('maxPrice', undefined)}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </Collapse>
    </Paper>
  );
};