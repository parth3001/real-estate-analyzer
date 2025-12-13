import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  Grid,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import { propertyApi } from '../services/api';
import { formatCurrency, formatPercent, formatDate } from '../utils/formatters';

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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('dealQuality');

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
  const openDeleteDialog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setPropertyToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPropertyToDelete(null);
  };

  // Handle card click to navigate to property details
  const handleCardClick = (property: SavedProperty) => {
    navigate(`/${property.propertyType.toLowerCase()}-analysis?id=${property._id}`);
  };

  // Get verdict color based on verdict type
  const getVerdictColor = (verdict?: string) => {
    switch (verdict) {
      case 'BUY':
        return { bg: '#34C759', text: '#FFFFFF' };
      case 'NEGOTIATE':
        return { bg: '#FF9500', text: '#FFFFFF' };
      case 'CAUTION':
        return { bg: '#007AFF', text: '#FFFFFF' };
      case 'PASS':
        return { bg: '#FF3B30', text: '#FFFFFF' };
      default:
        return { bg: '#8E8E93', text: '#FFFFFF' };
    }
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

      {/* Properties Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      ) : properties.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No saved properties yet
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
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
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {sortedProperties.map((property) => {
            const dealQuality = property.analysis?.investmentDecision?.professionalAssessment?.dealQuality;
            const verdict = property.analysis?.investmentDecision?.verdict;
            const cashFlow = property.analysis?.monthlyAnalysis?.cashFlow;
            const capRate = property.analysis?.keyMetrics?.capRate;
            const cocReturn = property.analysis?.keyMetrics?.cashOnCashReturn;
            const verdictColors = getVerdictColor(verdict);

            return (
              <Grid item xs={12} sm={6} md={4} key={property._id}>
                <Card
                  onMouseEnter={() => setHoveredCard(property._id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => handleCardClick(property)}
                  sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    height: '100%',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 122, 255, 0.04)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  {/* Delete Button (top-right, appears on hover) */}
                  <IconButton
                    onClick={(e) => openDeleteDialog(property._id, e)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      opacity: hoveredCard === property._id ? 1 : 0,
                      transition: 'opacity 0.2s ease',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      zIndex: 2, // FIX: Above badge
                      '&:hover': {
                        backgroundColor: 'rgba(255, 59, 48, 0.1)',
                      },
                      // Always show on mobile (no hover)
                      '@media (hover: none)': {
                        opacity: 1,
                      }
                    }}
                  >
                    <DeleteIcon sx={{ color: '#FF3B30', fontSize: 20 }} />
                  </IconButton>

                  {/* Deal Quality Badge (top-right, ALWAYS consistent position) */}
                  {typeof dealQuality === 'number' && verdict && (
                    <Chip
                      label={`${dealQuality} ${verdict}`}
                      sx={{
                        position: 'absolute',
                        top: 8,  // FIX: Always top-right, no animation
                        right: 8,
                        backgroundColor: verdictColors.bg,
                        color: verdictColors.text,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        height: 28,
                        zIndex: 1, // Below delete button
                      }}
                    />
                  )}

                  <CardContent sx={{ pt: 3, pb: 3, px: 3 }}> {/* FIX: 24px padding */}
                    {/* Property Address - FIX: Larger, more prominent */}
                    <Typography
                      variant="h5"
                      component="div"
                      sx={{
                        fontWeight: 600,
                        color: '#1C1C1E',
                        mb: 1,
                        fontSize: '1.25rem', // FIX: 20px (was 18px)
                        lineHeight: 1.3
                      }}
                    >
                      {property.propertyAddress?.street || property.propertyName || 'Unnamed Property'}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, fontSize: '0.875rem' }}
                    >
                      {property.propertyAddress ?
                        `${property.propertyAddress.city || ''}, ${property.propertyAddress.state || ''} ${property.propertyAddress.zipCode || ''}`.trim() :
                        'Address not available'
                      }
                    </Typography>

                    {/* Property Type Badge - FIX: Subtle gray instead of bright blue */}
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={property.propertyType === 'SFR' ? 'Single Family' : 'Multi-Family'}
                        size="small"
                        sx={{
                          fontSize: '0.75rem',
                          backgroundColor: '#F2F2F7', // FIX: Subtle gray background
                          color: '#8E8E93', // FIX: Gray text (not bright blue/purple)
                          fontWeight: 500
                        }}
                      />
                    </Box>

                    {/* Key Metrics - FIX: Black/gray colors, smaller font */}
                    <Box sx={{ mb: 2 }}>
                      {typeof cashFlow === 'number' ? (
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: cashFlow >= 0 ? '#1C1C1E' : '#8E8E93', // FIX: Black (not green) / Gray (not red)
                            mb: 0.5,
                            fontSize: '1.125rem' // FIX: 18px (was 24px in h5)
                          }}
                        >
                          {formatCurrency(cashFlow)}/mo
                        </Typography>
                      ) : (
                        <Typography
                          variant="h6"
                          sx={{
                            color: '#8E8E93',
                            mb: 0.5,
                            fontSize: '1.125rem'
                          }}
                        >
                          Cash Flow N/A
                        </Typography>
                      )}

                      <Typography
                        variant="body2"
                        sx={{
                          color: '#8E8E93', // FIX: Consistent gray
                          fontSize: '0.8125rem' // 13px
                        }}
                      >
                        {typeof capRate === 'number' ? `${formatPercent(capRate)} Cap Rate` : 'Cap Rate N/A'}
                        {typeof cocReturn === 'number' && ` · ${formatPercent(cocReturn)} CoC`}
                      </Typography>
                    </Box>

                    {/* Purchase Price */}
                    {property.purchasePrice && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Purchase: {formatCurrency(property.purchasePrice)}
                      </Typography>
                    )}

                    {/* Last Updated */}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Updated {formatDate(property.updatedAt)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

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
