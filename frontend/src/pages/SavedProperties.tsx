import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HomeIcon from '@mui/icons-material/Home';
import { propertyApi } from '../services/api';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { getStrategyIconConfig } from '../utils/strategyHelpers';
import { getScoreColor } from '../utils/scoreColors';
import PropertyImage from '../components/PropertyImage';

interface SavedProperty {
  _id: string;
  propertyName: string;
  propertyType: 'SFR' | 'MF';
  propertyAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  purchasePrice?: number;
  monthlyRent?: number;
  createdAt: string;
  updatedAt: string;
  analysis?: {
    keyMetrics?: {
      capRate?: number;
      cashOnCashReturn?: number;
      dscr?: number;
      irr?: number;
    };
    monthlyAnalysis?: {
      cashFlow?: number;
    };
    investmentDecision?: {
      verdict?: string;
      professionalAssessment?: {
        dealQuality?: number;
      };
    };
    [key: string]: any;
  };
  [key: string]: any;
}

const SavedProperties: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('dealQuality');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<SavedProperty | null>(null);

  // Fetch saved properties on component mount
  useEffect(() => {
    fetchProperties();
  }, []);

  // Clear success messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch all properties from the backend
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('Fetching saved properties...');
      const response = await propertyApi.getAllProperties();

      if (response.status === 200) {
        if (!Array.isArray(response.data)) {
          console.error('Expected array but received:', response.data);
          setError('Invalid data format returned from the server');
          setProperties([]);
          return;
        }

        console.log('Properties fetched successfully:', response.data.length, 'items');
        const savedProperties = response.data as unknown as SavedProperty[];
        setProperties(savedProperties);
      } else {
        console.error('Failed to load saved properties:', response);
        setError('Failed to load saved properties');
        setProperties([]);
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Error fetching properties: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle property deletion
  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;

    setDeleteLoading(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const response = await propertyApi.deleteProperty(propertyToDelete);

      if (response.status >= 200 && response.status < 300) {
        setProperties(prevProperties =>
          prevProperties.filter(property => property._id !== propertyToDelete)
        );
        setDeleteDialogOpen(false);
        setSuccessMessage('Property deleted successfully');
        console.log('Property deleted successfully');
      } else {
        console.error('Delete response:', response);
        setError('Failed to delete property');
      }
    } catch (err) {
      console.error('Error deleting property:', err);
      fetchProperties();
      setError('Error occurred, but property may have been deleted. Please check the list.');
    } finally {
      setDeleteLoading(false);
      setPropertyToDelete(null);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (id: string) => {
    setPropertyToDelete(id);
    setDeleteDialogOpen(true);
    handleCloseMenu();
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPropertyToDelete(null);
  };

  // Handle row click to navigate to property details
  const handleRowClick = (property: SavedProperty) => {
    navigate(`/${property.propertyType.toLowerCase()}-analysis?id=${property._id}`);
  };

  // Handle actions menu
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, property: SavedProperty) => {
    event.stopPropagation(); // Prevent row click
    setAnchorEl(event.currentTarget);
    setSelectedProperty(property);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedProperty(null);
  };


  // Sort properties based on selected criteria
  const getSortedProperties = () => {
    const sorted = [...properties];

    switch (sortBy) {
      case 'dealQuality':
        return sorted.sort((a, b) => {
          const aQuality = a.analysis?.investmentDecision?.professionalAssessment?.dealQuality || 0;
          const bQuality = b.analysis?.investmentDecision?.professionalAssessment?.dealQuality || 0;
          return bQuality - aQuality; // High to low
        });
      case 'cashFlow':
        return sorted.sort((a, b) => {
          const aCashFlow = a.analysis?.monthlyAnalysis?.cashFlow || 0;
          const bCashFlow = b.analysis?.monthlyAnalysis?.cashFlow || 0;
          return bCashFlow - aCashFlow; // High to low
        });
      case 'dateAdded':
        return sorted.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'price':
        return sorted.sort((a, b) => (a.purchasePrice || 0) - (b.purchasePrice || 0)); // Low to high
      default:
        return sorted;
    }
  };

  const sortedProperties = getSortedProperties();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Saved Properties
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Sort Dropdown */}
          {properties.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="dealQuality">Deal Quality (High to Low)</MenuItem>
                <MenuItem value="cashFlow">Cash Flow (High to Low)</MenuItem>
                <MenuItem value="dateAdded">Date Added (Newest First)</MenuItem>
                <MenuItem value="price">Price (Low to High)</MenuItem>
              </Select>
            </FormControl>
          )}

          <Button
            variant="outlined"
            color="primary"
            onClick={fetchProperties}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/sfr-analysis')}
          >
            Add New Property
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

      {/* Properties List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      ) : properties.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 8, backgroundColor: '#FAFAFA', borderRadius: 2 }}>
          <HomeIcon sx={{ fontSize: 64, color: '#C7C7CC', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No saved properties yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Start by analyzing a new property and save it to your collection.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/sfr-analysis')}
            sx={{ mt: 2 }}
          >
            Analyze New Property
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            backgroundColor: '#FFFFFF',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
          }}
        >
          {/* Column Headers */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              px: 3,
              py: 1.5,
              backgroundColor: '#F5F5F7',
              borderBottom: '1px solid #E5E5EA'
            }}
          >
            {/* Thumbnail column */}
            <Box sx={{ width: 64, flexShrink: 0 }} />

            {/* Deal Quality column */}
            <Box sx={{ width: 110, flexShrink: 0 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Deal Quality
              </Typography>
            </Box>

            {/* Property column - flexible */}
            <Box sx={{ flex: '1 1 200px', minWidth: 180, maxWidth: 320 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Property
              </Typography>
            </Box>

            {/* Cash Flow column */}
            <Box sx={{ width: 110, flexShrink: 0, textAlign: 'right' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Cash Flow
              </Typography>
            </Box>

            {/* Cap Rate column */}
            <Box sx={{ width: 90, flexShrink: 0, textAlign: 'right' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Cap Rate
              </Typography>
            </Box>

            {/* IRR column */}
            <Box sx={{ width: 80, flexShrink: 0, textAlign: 'right' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                IRR
              </Typography>
            </Box>

            {/* Price column */}
            <Box sx={{ width: 110, flexShrink: 0, textAlign: 'right' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Price
              </Typography>
            </Box>

            {/* Actions column */}
            <Box sx={{ width: 48, flexShrink: 0 }} />
          </Box>

          {/* Property Rows */}
          {sortedProperties.map((property) => {
            const dealQuality = property.analysis?.investmentDecision?.professionalAssessment?.dealQuality;
            const cashFlow = property.analysis?.monthlyAnalysis?.cashFlow;
            const capRate = property.analysis?.keyMetrics?.capRate;

            return (
              <Box
                key={property._id}
                onMouseEnter={() => setHoveredRow(property._id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => handleRowClick(property)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 3,
                  py: 2,
                  borderBottom: '1px solid #F2F2F7',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  backgroundColor: hoveredRow === property._id ? 'rgba(0, 122, 255, 0.04)' : 'transparent',
                  '&:last-child': {
                    borderBottom: 'none'
                  },
                  // Mobile responsive: stack vertically
                  '@media (max-width: 900px)': {
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 1
                  }
                }}
              >
                {/* Feature #9: Property photo with strategy badge overlay (hybrid approach) */}
                {(() => {
                  const iconConfig = getStrategyIconConfig(
                    property.propertyType,
                    property.investmentStrategy || property.strategy
                  );
                  const Icon = iconConfig.Icon;
                  const hasPropertyVisuals = property.propertyVisuals?.primaryImageUrl ||
                                             property.propertyVisuals?.streetViewStaticUrl ||
                                             property.propertyVisuals?.staticMapUrl;

                  // If property has image: Show photo with strategy badge overlay
                  if (hasPropertyVisuals) {
                    return (
                      <Box
                        sx={{
                          width: { xs: 64, md: 100 },
                          height: { xs: 48, md: 64 },
                          flexShrink: 0,
                          position: 'relative',
                          borderRadius: 1,
                          overflow: 'hidden',
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }}
                      >
                        {/* Property Photo */}
                        <PropertyImage
                          visuals={property.propertyVisuals}
                          alt={property.propertyAddress?.street || 'Property'}
                          height="100%"
                          width="100%"
                          borderRadius={1}
                        />

                        {/* Strategy Badge Overlay (bottom-right corner) */}
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            right: 4,
                            width: 20,
                            height: 20,
                            backgroundColor: iconConfig.bgColor,
                            borderRadius: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255, 255, 255, 0.9)',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                          }}
                        >
                          <Icon sx={{ fontSize: 12, color: iconConfig.color }} />
                        </Box>
                      </Box>
                    );
                  }

                  // Fallback: No photo available - show full strategy icon (existing design)
                  return (
                    <Box
                      sx={{
                        width: { xs: 40, md: 64 },
                        height: { xs: 40, md: 64 },
                        flexShrink: 0,
                        backgroundColor: iconConfig.bgColor,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      <Icon sx={{ fontSize: { xs: 20, md: 28 }, color: iconConfig.color }} />
                    </Box>
                  );
                })()}

                {/* Deal Quality Score Badge */}
                <Box sx={{ width: 110, flexShrink: 0 }}>
                  {typeof dealQuality === 'number' ? (
                    <Chip
                      label={`${Math.round(dealQuality)}/100`}
                      sx={{
                        backgroundColor: getScoreColor(dealQuality),
                        color: '#FFFFFF',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        height: 26
                      }}
                    />
                  ) : (
                    <Chip
                      label="N/A"
                      sx={{
                        backgroundColor: '#8E8E93',
                        color: '#FFFFFF',
                        fontSize: '0.8125rem',
                        height: 26
                      }}
                    />
                  )}
                </Box>

                {/* Property Address - flexible */}
                <Box sx={{ flex: '1 1 200px', minWidth: 180, maxWidth: 320 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: '#1C1C1E',
                      fontSize: '0.9375rem',
                      mb: 0.25,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {property.propertyAddress?.street || property.propertyName || 'Unnamed Property'}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#8E8E93',
                      fontSize: '0.8125rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {property.propertyAddress ?
                      `${property.propertyAddress.city || ''}, ${property.propertyAddress.state || ''} ${property.propertyAddress.zipCode || ''}`.trim() :
                      'Address not available'
                    }
                  </Typography>
                </Box>

                {/* Cash Flow */}
                <Box sx={{ width: 110, flexShrink: 0, textAlign: 'right' }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: typeof cashFlow === 'number' ? (cashFlow >= 0 ? '#1C1C1E' : '#8E8E93') : '#8E8E93',
                      fontSize: '0.9375rem'
                    }}
                  >
                    {typeof cashFlow === 'number' ? `${formatCurrency(cashFlow)}/mo` : 'N/A'}
                  </Typography>
                </Box>

                {/* Cap Rate */}
                <Box sx={{ width: 90, flexShrink: 0, textAlign: 'right' }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      color: '#1C1C1E',
                      fontSize: '0.9375rem'
                    }}
                  >
                    {typeof capRate === 'number' ? formatPercent(capRate) : 'N/A'}
                  </Typography>
                </Box>

                {/* IRR */}
                <Box sx={{ width: 80, flexShrink: 0, textAlign: 'right' }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      color: '#1C1C1E',
                      fontSize: '0.9375rem'
                    }}
                  >
                    {typeof property.analysis?.keyMetrics?.irr === 'number'
                      ? formatPercent(property.analysis.keyMetrics.irr)
                      : 'N/A'}
                  </Typography>
                </Box>

                {/* Purchase Price */}
                <Box sx={{ width: 110, flexShrink: 0, textAlign: 'right' }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      color: '#8E8E93',
                      fontSize: '0.9375rem'
                    }}
                  >
                    {property.purchasePrice ? formatCurrency(property.purchasePrice) : 'N/A'}
                  </Typography>
                </Box>

                {/* Actions Menu */}
                <Box sx={{ width: 48, flexShrink: 0, textAlign: 'right' }}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenMenu(e, property)}
                    sx={{
                      opacity: hoveredRow === property._id ? 1 : 0,
                      transition: 'opacity 0.15s ease',
                      '@media (hover: none)': {
                        opacity: 1, // Always visible on mobile
                      }
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedProperty) {
              openDeleteDialog(selectedProperty._id);
            }
          }}
          sx={{ color: '#FF3B30' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: '#FF3B30' }} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Delete Property
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this property? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteProperty}
            color="error"
            disabled={deleteLoading}
            autoFocus
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SavedProperties;
