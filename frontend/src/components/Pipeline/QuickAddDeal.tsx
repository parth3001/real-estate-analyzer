import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  InputAdornment,
  Alert
} from '@mui/material';
import Grid from '@mui/system/Grid';
import type { 
  CreatePipelineDealRequest,
  PipelineDeal 
} from '../../types/pipeline';
import { 
  PropertyType, 
  PropertyStrategy, 
  DealSource
} from '../../types/pipeline';
import { pipelineApi } from '../../services/pipelineApi';

interface QuickAddDealProps {
  open: boolean;
  onClose: () => void;
  onDealCreated: (deal: PipelineDeal) => void;
}

export const QuickAddDeal: React.FC<QuickAddDealProps> = ({
  open,
  onClose,
  onDealCreated
}) => {
  const [formData, setFormData] = useState<CreatePipelineDealRequest>({
    dealName: '',
    propertyType: PropertyType.SFR,
    strategy: PropertyStrategy.BUY_HOLD,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    askingPrice: 0,
    sourceInfo: {
      channel: DealSource.MLS,
      referrer: '',
      notes: ''
    },
    propertyDetails: {},
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CreatePipelineDealRequest],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handlePropertyDetailsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      propertyDetails: {
        ...prev.propertyDetails,
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (!formData.dealName.trim()) {
        throw new Error('Deal name is required');
      }
      if (!formData.address.street.trim() || !formData.address.city.trim() || !formData.address.state.trim()) {
        throw new Error('Address is required');
      }
      if (formData.askingPrice <= 0) {
        throw new Error('Asking price must be greater than 0');
      }

      const newDeal = await pipelineApi.createDeal(formData);
      onDealCreated(newDeal);
      handleClose();
    } catch (err: any) {
      console.error('Error creating deal:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      dealName: '',
      propertyType: PropertyType.SFR,
      strategy: PropertyStrategy.BUY_HOLD,
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      askingPrice: 0,
      sourceInfo: {
        channel: DealSource.MLS,
        referrer: '',
        notes: ''
      },
      propertyDetails: {},
      notes: ''
    });
    setError(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Add New Deal
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Quickly add a property to your deal pipeline
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Basic Information
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              label="Deal Name"
              value={formData.dealName}
              onChange={(e) => handleInputChange('dealName', e.target.value)}
              placeholder="e.g., 123 Main St - Austin SFR"
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Asking Price"
              type="number"
              value={formData.askingPrice || ''}
              onChange={(e) => handleInputChange('askingPrice', Number(e.target.value))}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Property Type</InputLabel>
              <Select
                value={formData.propertyType}
                label="Property Type"
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
              >
                <MenuItem value={PropertyType.SFR}>Single Family</MenuItem>
                <MenuItem value={PropertyType.MF}>Multifamily (2-4 units)</MenuItem>
                <MenuItem value={PropertyType.APARTMENT}>Large Multifamily</MenuItem>
                <MenuItem value={PropertyType.CONDO}>Condo</MenuItem>
                <MenuItem value={PropertyType.TOWNHOUSE}>Townhouse</MenuItem>
                <MenuItem value={PropertyType.COMMERCIAL_RETAIL}>Commercial - Retail</MenuItem>
                <MenuItem value={PropertyType.COMMERCIAL_OFFICE}>Commercial - Office</MenuItem>
                <MenuItem value={PropertyType.COMMERCIAL_INDUSTRIAL}>Commercial - Industrial</MenuItem>
                <MenuItem value={PropertyType.SELF_STORAGE}>Self Storage</MenuItem>
                <MenuItem value={PropertyType.MOBILE_HOME_PARK}>Mobile Home Park</MenuItem>
                <MenuItem value={PropertyType.LAND}>Land</MenuItem>
                <MenuItem value={PropertyType.OTHER}>Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Strategy</InputLabel>
              <Select
                value={formData.strategy}
                label="Strategy"
                onChange={(e) => handleInputChange('strategy', e.target.value)}
              >
                <MenuItem value={PropertyStrategy.BUY_HOLD}>Buy & Hold</MenuItem>
                <MenuItem value={PropertyStrategy.BRRR}>BRRR</MenuItem>
                <MenuItem value={PropertyStrategy.FIX_FLIP}>Fix & Flip</MenuItem>
                <MenuItem value={PropertyStrategy.WHOLESALE}>Wholesale</MenuItem>
                <MenuItem value={PropertyStrategy.HOUSE_HACK}>House Hack</MenuItem>
                <MenuItem value={PropertyStrategy.VALUE_ADD}>Value Add</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Address */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Property Address
            </Typography>
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label="Street Address"
              value={formData.address.street}
              onChange={(e) => handleInputChange('address.street', e.target.value)}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="City"
              value={formData.address.city}
              onChange={(e) => handleInputChange('address.city', e.target.value)}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="State"
              value={formData.address.state}
              onChange={(e) => handleInputChange('address.state', e.target.value)}
              placeholder="TX"
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="ZIP Code"
              value={formData.address.zipCode}
              onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
              required
            />
          </Grid>

          {/* Property Details (conditional) */}
          {formData.propertyType === PropertyType.SFR && (
            <>
              <Grid size={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Property Details
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  fullWidth
                  label="Bedrooms"
                  type="number"
                  value={formData.propertyDetails?.bedrooms || ''}
                  onChange={(e) => handlePropertyDetailsChange('bedrooms', Number(e.target.value))}
                />
              </Grid>

              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  fullWidth
                  label="Bathrooms"
                  type="number"
                  value={formData.propertyDetails?.bathrooms || ''}
                  onChange={(e) => handlePropertyDetailsChange('bathrooms', Number(e.target.value))}
                  inputProps={{ step: 0.5 }}
                />
              </Grid>

              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  fullWidth
                  label="Square Feet"
                  type="number"
                  value={formData.propertyDetails?.squareFootage || ''}
                  onChange={(e) => handlePropertyDetailsChange('squareFootage', Number(e.target.value))}
                />
              </Grid>

              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  fullWidth
                  label="Year Built"
                  type="number"
                  value={formData.propertyDetails?.yearBuilt || ''}
                  onChange={(e) => handlePropertyDetailsChange('yearBuilt', Number(e.target.value))}
                />
              </Grid>
            </>
          )}

          {formData.propertyType === PropertyType.MF && (
            <>
              <Grid size={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Multifamily Details
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Number of Units"
                  type="number"
                  value={formData.propertyDetails?.units || ''}
                  onChange={(e) => handlePropertyDetailsChange('units', Number(e.target.value))}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Year Built"
                  type="number"
                  value={formData.propertyDetails?.yearBuilt || ''}
                  onChange={(e) => handlePropertyDetailsChange('yearBuilt', Number(e.target.value))}
                />
              </Grid>
            </>
          )}

          {/* Source Information */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Deal Source
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Source</InputLabel>
              <Select
                value={formData.sourceInfo.channel}
                label="Source"
                onChange={(e) => handleInputChange('sourceInfo.channel', e.target.value)}
              >
                <MenuItem value={DealSource.MLS}>MLS</MenuItem>
                <MenuItem value={DealSource.AGENT}>Agent</MenuItem>
                <MenuItem value={DealSource.DIRECT_MARKETING}>Direct Marketing</MenuItem>
                <MenuItem value={DealSource.ONLINE}>Online</MenuItem>
                <MenuItem value={DealSource.REFERRAL}>Referral</MenuItem>
                <MenuItem value={DealSource.COLD_CALLING}>Cold Calling</MenuItem>
                <MenuItem value={DealSource.OTHER}>Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Referrer / Agent"
              value={formData.sourceInfo.referrer}
              onChange={(e) => handleInputChange('sourceInfo.referrer', e.target.value)}
              placeholder="Agent name, website, etc."
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes about this deal..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Adding...' : 'Add Deal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};