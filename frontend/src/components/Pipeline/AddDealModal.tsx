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
  Chip,
  Divider
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';
import { propertyApi } from '../../services/api';
import { pipelineApi } from '../../services/pipelineApi';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { QuickAddDeal } from './QuickAddDeal';
import type { PipelineDeal } from '../../types/pipeline';

interface AddDealModalProps {
  open: boolean;
  onClose: () => void;
  onDealAdded: (deal: PipelineDeal) => void;
}

export const AddDealModal: React.FC<AddDealModalProps> = ({
  open,
  onClose,
  onDealAdded
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showManualDealModal, setShowManualDealModal] = useState(false);

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
        // Show all properties (user can import analyzed deals to Pipeline)
        setProperties(response.data);
        
        console.log('Loaded properties for Pipeline import:', {
          totalProperties: response.data.length
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

  const handleImportProperties = async () => {
    if (selectedProperties.length === 0) {
      setError('Please select at least one property to import');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Import each selected property to Pipeline
      for (const propertyId of selectedProperties) {
        const property = properties.find(p => p._id === propertyId);
        
        const result = await pipelineApi.convertAnalysisToPipeline(
          propertyId,
          {
            channel: 'OTHER',
            contact: 'Imported from Saved Properties',
            notes: 'Converted from existing analysis'
          },
          `Imported from saved properties: ${property?.propertyName || 'Unknown Property'}`
        );

        onDealAdded(result);
      }

      onClose();
    } catch (err: any) {
      console.error('Error importing properties:', err);
      setError(err.message || 'Failed to import properties');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualDealCreated = (deal: PipelineDeal) => {
    setShowManualDealModal(false);
    onDealAdded(deal);
    onClose();
  };

  const handleClose = () => {
    if (!submitting) {
      setSelectedProperties([]);
      setError(null);
      onClose();
    }
  };

  return (
    <>
      <Dialog 
        open={open && !showManualDealModal} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: appleColors.gray[50]
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: appleColors.gray[900] }}>
            Add Deal to Pipeline
          </Typography>
          <IconButton onClick={handleClose} disabled={submitting}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Options Section */}
          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<AddIcon />}
              onClick={() => setShowManualDealModal(true)}
              sx={{
                py: 2,
                mb: 2,
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500
              }}
            >
              Add New Manual Deal
            </Button>
            
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                or import from existing
              </Typography>
            </Divider>
          </Box>

          {/* Saved Properties List */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Import from Saved Properties
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : properties.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No saved properties found. Analyze some properties first, then return here to import them.
              </Typography>
            ) : (
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {properties.map((property) => (
                  <ListItem key={property._id} disablePadding>
                    <ListItemButton 
                      onClick={() => handleToggleProperty(property._id)}
                      dense
                    >
                      <Checkbox
                        checked={selectedProperties.includes(property._id)}
                        tabIndex={-1}
                        disableRipple
                      />
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                              {property.propertyName}
                            </Typography>
                            <Chip 
                              label={property.propertyType} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(property.purchasePrice || 0)}
                            </Typography>
                            {property.analysis?.keyMetrics?.capRate && (
                              <Typography variant="caption" color="text.secondary">
                                Cap Rate: {formatPercent(property.analysis.keyMetrics.capRate)}
                              </Typography>
                            )}
                            {property.analysis?.investmentDecision?.verdict && (
                              <Chip 
                                label={property.analysis.investmentDecision.verdict}
                                size="small"
                                color={
                                  property.analysis.investmentDecision.verdict === 'BUY' ? 'success' :
                                  property.analysis.investmentDecision.verdict === 'NEGOTIATE' ? 'warning' : 'default'
                                }
                                sx={{ fontSize: '0.65rem', height: 18 }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleImportProperties}
            variant="contained"
            disabled={selectedProperties.length === 0 || submitting}
            sx={{
              minWidth: 120,
              backgroundColor: appleColors.blue[600],
              '&:hover': { backgroundColor: appleColors.blue[700] }
            }}
          >
            {submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              `Import ${selectedProperties.length} ${selectedProperties.length === 1 ? 'Property' : 'Properties'}`
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Deal Modal */}
      <QuickAddDeal
        open={showManualDealModal}
        onClose={() => setShowManualDealModal(false)}
        onDealCreated={handleManualDealCreated}
      />
    </>
  );
};

export default AddDealModal;