import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Checkbox,
  Chip
} from '@mui/material';
import { Close as CloseIcon, Home, TrendingUp } from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';
import { propertyApi, portfolioApi } from '../../services/api';
import AddManualPropertyModal from './AddManualPropertyModal';

interface AddPropertyModalProps {
  open: boolean;
  onClose: () => void;
  portfolioId: string;
  portfolioName: string;
  onSuccess: () => void;
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  open,
  onClose,
  portfolioId,
  portfolioName,
  onSuccess
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showManualPropertyModal, setShowManualPropertyModal] = useState(false);

  useEffect(() => {
    if (open) {
      loadAvailableProperties();
    }
  }, [open]);

  const loadAvailableProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all user properties
      const response = await propertyApi.getAllProperties();
      
      if (response.data) {
        // Filter out properties that are already in a portfolio (only show unassigned properties)
        const availableProperties = response.data.filter((property: any) => 
          !property.portfolioId
        );
        setProperties(availableProperties);
        
        console.log('Loaded properties for portfolio addition:', {
          totalProperties: response.data.length,
          availableProperties: availableProperties.length,
          filteredOut: response.data.length - availableProperties.length
        });
      }
    } catch (err: any) {
      console.error('Error loading properties:', err);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProperty = (propertyId: string) => {
    setSelectedProperties(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };

  const handleAddProperties = async () => {
    if (selectedProperties.length === 0) {
      setError('Please select at least one property');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Add each selected property to the portfolio
      for (const propertyId of selectedProperties) {
        await portfolioApi.addPropertyToPortfolio(portfolioId, propertyId);
      }

      onSuccess();
      onClose();
      setSelectedProperties([]);
    } catch (err: any) {
      console.error('Error adding properties:', err);
      setError(err.response?.data?.error || 'Failed to add properties to portfolio');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: 500
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 2,
        borderBottom: `1px solid ${appleColors.gray[200]}`
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: appleColors.gray[900] }}>
            Add Properties to Portfolio
          </Typography>
          <Typography variant="body2" sx={{ color: appleColors.gray[600], mt: 0.5 }}>
            Adding to: {portfolioName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress size={40} sx={{ color: appleColors.blue[600] }} />
          </Box>
        ) : properties.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Home sx={{ fontSize: 60, color: appleColors.gray[400], mb: 2 }} />
            <Typography variant="h6" sx={{ color: appleColors.gray[700], mb: 2 }}>
              No Available Properties
            </Typography>
            <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 3 }}>
              You don't have any saved properties yet. You can analyze a property first or add a property manually.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={() => window.location.href = '/sfr-analysis'}
                sx={{
                  backgroundColor: appleColors.blue[600],
                  '&:hover': { backgroundColor: appleColors.blue[700] }
                }}
              >
                Analyze New Property
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowManualPropertyModal(true)}
                sx={{
                  borderColor: appleColors.blue[600],
                  color: appleColors.blue[600],
                  '&:hover': { 
                    borderColor: appleColors.blue[700],
                    backgroundColor: appleColors.blue[50] 
                  }
                }}
              >
                Add Property Manually
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                Select properties to add to this portfolio ({selectedProperties.length} selected)
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowManualPropertyModal(true)}
                sx={{
                  borderColor: appleColors.blue[600],
                  color: appleColors.blue[600],
                  fontSize: '0.875rem',
                  '&:hover': { 
                    borderColor: appleColors.blue[700],
                    backgroundColor: appleColors.blue[50] 
                  }
                }}
              >
                Add New Property
              </Button>
            </Box>
            
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {properties.map((property) => (
                <ListItem 
                  key={property._id} 
                  disablePadding
                  sx={{ mb: 2 }}
                >
                  <ListItemButton
                    onClick={() => handleToggleProperty(property._id)}
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${
                        selectedProperties.includes(property._id) 
                          ? appleColors.blue[600] 
                          : appleColors.gray[200]
                      }`,
                      backgroundColor: selectedProperties.includes(property._id) 
                        ? appleColors.blue[50] 
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: selectedProperties.includes(property._id)
                          ? appleColors.blue[100]
                          : appleColors.gray[50]
                      }
                    }}
                  >
                    <Checkbox
                      edge="start"
                      checked={selectedProperties.includes(property._id)}
                      tabIndex={-1}
                      disableRipple
                      sx={{
                        color: appleColors.gray[400],
                        '&.Mui-checked': {
                          color: appleColors.blue[600]
                        }
                      }}
                    />
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {property.propertyName || property.address?.street || 'Unnamed Property'}
                          </Typography>
                          {property.analysis?.monthlyAnalysis?.cashFlow && (
                            <Chip
                              label={`${formatCurrency(property.analysis.monthlyAnalysis.cashFlow)}/mo`}
                              size="small"
                              icon={<TrendingUp sx={{ fontSize: 16 }} />}
                              sx={{
                                backgroundColor: property.analysis.monthlyAnalysis.cashFlow >= 0 
                                  ? appleColors.green[100] 
                                  : appleColors.red[100],
                                color: property.analysis.monthlyAnalysis.cashFlow >= 0 
                                  ? appleColors.green[800] 
                                  : appleColors.red[800],
                                fontWeight: 600
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                            {property.address?.city}, {property.address?.state} {property.address?.zipCode}
                          </Typography>
                          <Typography variant="body2" sx={{ color: appleColors.gray[700] }}>
                            Purchase Price: {formatCurrency(property.purchasePrice || 0)} • 
                            {property.bedrooms} bed / {property.bathrooms} bath • 
                            {property.squareFootage?.toLocaleString()} sqft
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        px: 3, 
        py: 3, 
        borderTop: `1px solid ${appleColors.gray[200]}`,
        justifyContent: 'space-between'
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: appleColors.gray[400],
            color: appleColors.gray[700],
            '&:hover': {
              borderColor: appleColors.gray[600],
              backgroundColor: appleColors.gray[50]
            }
          }}
        >
          Cancel
        </Button>

        <Button
          onClick={handleAddProperties}
          variant="contained"
          disabled={selectedProperties.length === 0 || submitting}
          sx={{
            backgroundColor: appleColors.blue[600],
            color: 'white',
            px: 3,
            '&:hover': {
              backgroundColor: appleColors.blue[700]
            },
            '&:disabled': {
              backgroundColor: appleColors.gray[300]
            }
          }}
        >
          {submitting ? (
            <CircularProgress size={20} sx={{ color: 'white' }} />
          ) : (
            `Add ${selectedProperties.length > 0 ? selectedProperties.length : ''} Properties`
          )}
        </Button>
      </DialogActions>
      
      <AddManualPropertyModal
        open={showManualPropertyModal}
        onClose={() => setShowManualPropertyModal(false)}
        portfolioId={portfolioId}
        onSuccess={() => {
          setShowManualPropertyModal(false);
          loadAvailableProperties(); // Refresh the properties list
        }}
      />
    </Dialog>
  );
};

export default AddPropertyModal;