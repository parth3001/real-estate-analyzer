import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Card,
  CardContent
} from '@mui/material';
import Grid from '@mui/system/Grid';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Analytics as AnalyticsIcon,
  Person as PersonIcon
} from '@mui/icons-material';
interface PropertyDetailModalProps {
  open: boolean;
  onClose: () => void;
  property: any | null;
  onUpdate?: (updatedProperty: any) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  open,
  onClose,
  property,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  interface EditData {
    propertyName?: string;
    monthlyRent?: number | string;
    monthlyOperatingExpenses?: number | string;
    bedrooms?: number | string;
    bathrooms?: number | string;
    squareFootage?: number | string;
    yearBuilt?: number | string;
    [key: string]: any;
  }
  
  const [editData, setEditData] = useState<EditData>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (property) {
      console.log('🔍 Loading property data for modal:', property);
      setEditData({
        propertyName: property.propertyName || '',
        propertyType: property.propertyType || '',
        address: property.address || property.propertyAddress || { street: '', city: '', state: '', zipCode: '' },
        purchasePrice: property.purchasePrice || '',
        monthlyRent: property.monthlyRent || '',
        monthlyOperatingExpenses: property.monthlyOperatingExpenses || '',
        bedrooms: property.bedrooms || '',
        bathrooms: property.bathrooms || '',
        squareFootage: property.squareFootage || '',
        yearBuilt: property.yearBuilt || '',
        ownershipPercentage: property.ownershipPercentage || '100'
      });
      console.log('📝 EditData set to:', {
        propertyName: property.propertyName,
        monthlyRent: property.monthlyRent,
        monthlyOperatingExpenses: property.monthlyOperatingExpenses,
        purchasePrice: property.purchasePrice
      });
    }
  }, [property]);

  if (!property) return null;

  // Use the same robust detection logic as the portfolio dashboard
  const getPropertySource = (property: any) => {
    if (property.source === 'PORTFOLIO_MANUAL_ENTRY' || 
        property.isManualEntry || 
        property.isPortfolioProperty ||
        property.manualEntryData ||
        (property.monthlyOperatingExpenses !== undefined) ||
        (property.propertyType === 'OTHER' && property.monthlyRent) ||
        (!property.analysis?.investmentDecision?.verdict)) {
      return 'manual';
    }
    
    if (property.analysis && 
        property.analysis.investmentDecision && 
        property.analysis.investmentDecision.verdict &&
        ['BUY', 'PASS', 'NEGOTIATE'].includes(property.analysis.investmentDecision.verdict)) {
      return 'analyzed';
    }
    
    return 'manual';
  };
  
  const isManualProperty = getPropertySource(property) === 'manual';
  const canEdit = isManualProperty;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to update property
      console.log('Saving property data:', editData);
      
      // Mock update - in real implementation, call API
      if (onUpdate) {
        onUpdate({ ...property, ...editData });
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating property:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      propertyName: property.propertyName || '',
      propertyType: property.propertyType || '',
      address: property.address || { street: '', city: '', state: '', zipCode: '' },
      purchasePrice: property.purchasePrice || '',
      monthlyRent: property.monthlyRent || '',
      monthlyOperatingExpenses: property.monthlyOperatingExpenses || '',
      bedrooms: property.bedrooms || '',
      bathrooms: property.bathrooms || '',
      squareFootage: property.squareFootage || '',
      yearBuilt: property.yearBuilt || '',
      ownershipPercentage: property.ownershipPercentage || '100'
    });
    setIsEditing(false);
  };

  const formatCurrency = (value: number | undefined) => {
    return value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value) : 'N/A';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {property.propertyName}
            </Typography>
            <Chip
              size="small"
              icon={isManualProperty ? <PersonIcon /> : <AnalyticsIcon />}
              label={isManualProperty ? "Manual Entry" : "Analyzed"}
              color={isManualProperty ? "default" : "primary"}
              variant="outlined"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {canEdit && !isEditing && (
              <IconButton onClick={handleEdit} size="small">
                <EditIcon />
              </IconButton>
            )}
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={3}>
          {/* Property Overview Section */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Property Overview
            </Typography>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Property Type</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {property.propertyType}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Purchase Price</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(property.purchasePrice)}
                    </Typography>
                  </Grid>
                  <Grid size={12}>
                    <Typography variant="body2" color="text.secondary">Address</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {property.address ? 
                        `${property.address.street}, ${property.address.city}, ${property.address.state} ${property.address.zipCode}` 
                        : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Editable Property Details */}
          {isManualProperty && (
            <Grid size={12}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Property Details
                {isEditing && (
                  <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
                    (Editing Mode)
                  </Typography>
                )}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      label="Property Name"
                      value={editData.propertyName}
                      onChange={(e) => setEditData(prev => ({ ...prev, propertyName: e.target.value }))}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">Property Name</Typography>
                      <Typography variant="body1">{property.propertyName}</Typography>
                    </>
                  )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      label="Monthly Rent"
                      type="number"
                      value={editData.monthlyRent}
                      onChange={(e) => setEditData(prev => ({ ...prev, monthlyRent: e.target.value }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">Monthly Rent</Typography>
                      <Typography variant="body1">{formatCurrency(property.monthlyRent)}</Typography>
                    </>
                  )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      label="Monthly Operating Expenses"
                      type="number"
                      value={editData.monthlyOperatingExpenses}
                      onChange={(e) => setEditData(prev => ({ ...prev, monthlyOperatingExpenses: e.target.value }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">Monthly Operating Expenses</Typography>
                      <Typography variant="body1">{formatCurrency(property.monthlyOperatingExpenses)}</Typography>
                    </>
                  )}
                </Grid>

                {/* Property Characteristics */}
                <Grid size={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                    Property Characteristics
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      label="Bedrooms"
                      type="number"
                      value={editData.bedrooms}
                      onChange={(e) => setEditData(prev => ({ ...prev, bedrooms: e.target.value }))}
                      inputProps={{ min: 0 }}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">Bedrooms</Typography>
                      <Typography variant="body1">{property.bedrooms || 'N/A'}</Typography>
                    </>
                  )}
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      label="Bathrooms"
                      type="number"
                      value={editData.bathrooms}
                      onChange={(e) => setEditData(prev => ({ ...prev, bathrooms: e.target.value }))}
                      inputProps={{ min: 0, step: 0.5 }}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">Bathrooms</Typography>
                      <Typography variant="body1">{property.bathrooms || 'N/A'}</Typography>
                    </>
                  )}
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      label="Square Feet"
                      type="number"
                      value={editData.squareFootage}
                      onChange={(e) => setEditData(prev => ({ ...prev, squareFootage: e.target.value }))}
                      inputProps={{ min: 0 }}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">Square Feet</Typography>
                      <Typography variant="body1">
                        {property.squareFootage ? property.squareFootage.toLocaleString() : 'N/A'}
                      </Typography>
                    </>
                  )}
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      label="Year Built"
                      type="number"
                      value={editData.yearBuilt}
                      onChange={(e) => setEditData(prev => ({ ...prev, yearBuilt: e.target.value }))}
                      inputProps={{ min: 1800, max: new Date().getFullYear() }}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">Year Built</Typography>
                      <Typography variant="body1">{property.yearBuilt || 'N/A'}</Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* Analysis Results (for analyzed properties) */}
          {!isManualProperty && property.analysis && (
            <Grid size={12}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Analysis Results
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body1">
                    This property was analyzed through our full analysis engine.
                    View complete analysis results in the Saved Properties section.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        {isEditing ? (
          <>
            <Button 
              onClick={handleCancel}
              variant="outlined"
              startIcon={<CancelIcon />}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PropertyDetailModal;