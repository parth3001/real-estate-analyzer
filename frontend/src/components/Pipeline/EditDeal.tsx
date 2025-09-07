import React, { useState, useEffect } from 'react';
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
  UpdatePipelineDealRequest,
  PipelineDeal 
} from '../../types/pipeline';
import { 
  PropertyType, 
  PropertyStrategy
} from '../../types/pipeline';
import { pipelineApi } from '../../services/pipelineApi';

interface EditDealProps {
  open: boolean;
  onClose: () => void;
  deal: PipelineDeal;
  onDealUpdated: (deal: PipelineDeal) => void;
}

export const EditDeal: React.FC<EditDealProps> = ({
  open,
  onClose,
  deal,
  onDealUpdated
}) => {
  const [formData, setFormData] = useState<UpdatePipelineDealRequest>({
    dealName: '',
    askingPrice: 0,
    propertyDetails: {},
    notes: '',
    strategy: PropertyStrategy.BUY_HOLD
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when deal changes
  useEffect(() => {
    if (deal) {
      setFormData({
        dealName: deal.dealName,
        askingPrice: deal.askingPrice,
        strategy: deal.strategy,
        propertyDetails: deal.propertyDetails || {},
        notes: deal.notes || ''
      });
    }
  }, [deal]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
      if (!formData.dealName?.trim()) {
        throw new Error('Deal name is required');
      }
      if (!formData.askingPrice || formData.askingPrice <= 0) {
        throw new Error('Asking price must be greater than 0');
      }

      const updatedDeal = await pipelineApi.updateDeal(deal._id, formData);
      onDealUpdated(updatedDeal);
      handleClose();
    } catch (err: any) {
      console.error('Error updating deal:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update deal');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
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
          Edit Deal
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Update deal information
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
              Deal Information
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              label="Deal Name"
              value={formData.dealName}
              onChange={(e) => handleInputChange('dealName', e.target.value)}
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

          {/* Property Details (conditional based on property type) */}
          {deal.propertyType === PropertyType.SFR && (
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

          {deal.propertyType === PropertyType.MF && (
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

          {/* Notes */}
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
          {loading ? 'Updating...' : 'Update Deal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};