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
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
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
  createdAt: string;
  updatedAt: string;
  analysis?: {
    keyMetrics?: {
      capRate?: number;
      cashOnCashReturn?: number;
      dscr?: number;
    };
    // Other analysis fields might be present
    [key: string]: any;
  };
  // Allow other fields that might be in the response
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

  // Fetch saved properties on component mount
  useEffect(() => {
    fetchProperties();
  }, []);

  // Add useEffect to clear success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000); // Clear after 5 seconds
      
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
      
      console.log('API response status:', response.status);
      console.log('API response type:', typeof response.data);
      
      if (response.status === 200) {
        if (!Array.isArray(response.data)) {
          console.error('Expected array but received:', response.data);
          setError('Invalid data format returned from the server');
          setProperties([]);
          return;
        }
        
        console.log('Properties fetched successfully:', response.data.length, 'items');
        
        try {
          // Examine each property to check for required fields
          response.data.forEach((prop: any, index) => {
            console.log(`Property ${index} structure check:`, {
              hasId: Boolean(prop._id),
              hasName: Boolean(prop.propertyName),
              hasType: Boolean(prop.propertyType),
              hasAnalysis: Boolean(prop.analysis),
              hasKeyMetrics: Boolean(prop.analysis && prop.analysis.keyMetrics),
            });
          });
          
          // Cast the data to the SavedProperty type
          const savedProperties = response.data as unknown as SavedProperty[];
          console.log('First property sample:', savedProperties[0] || 'No properties');
          setProperties(savedProperties);
        } catch (parseErr) {
          console.error('Error parsing property data:', parseErr);
          setError('Error parsing property data: ' + (parseErr instanceof Error ? parseErr.message : 'Unknown error'));
          setProperties([]);
        }
      } else {
        console.error('Failed to load saved properties:', response);
        setError('Failed to load saved properties: ' + (response.message || 'Unknown error'));
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
      
      // Check for a successful response status (could be 200, 202, 204)
      if (response.status >= 200 && response.status < 300) {
        // Remove the deleted property from the state
        setProperties(prevProperties => 
          prevProperties.filter(property => property._id !== propertyToDelete)
        );
        setDeleteDialogOpen(false);
        // Add a success message
        setSuccessMessage('Property deleted successfully');
        console.log('Property deleted successfully');
      } else {
        console.error('Delete response:', response);
        setError('Failed to delete property: ' + (response.data?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting property:', err);
      // Even if there's an error, check if the property was actually deleted
      // by refreshing the properties list
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
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPropertyToDelete(null);
  };

  // Navigate to property details
  const viewPropertyDetails = (id: string) => {
    // Find the property in our current state
    const property = properties.find(p => p._id === id);
    
    if (!property) {
      console.error('Property not found:', id);
      return;
    }
    
    console.log('Viewing property details for:', property.propertyName);
    
    // Navigate to the appropriate analysis page based on property type
    if (property.propertyType === 'SFR') {
      navigate(`/sfr-analysis?id=${id}`);
    } else if (property.propertyType === 'MF') {
      navigate(`/mf-analysis?id=${id}`);
    } else {
      console.error('Unknown property type:', property.propertyType);
    }
  };

  // Add a function to check if property has valid structure
  const isValidProperty = (property: any): boolean => {
    if (!property || typeof property !== 'object') return false;
    if (!property._id) return false;
    if (!property.propertyName) return false;
    if (!property.propertyType) return false;
    return true;
  };

  // Add a CardErrorBoundary component
  const PropertyCard: React.FC<{ property: SavedProperty, onDelete: (id: string) => void, onView: (id: string) => void }> = ({ 
    property, 
    onDelete, 
    onView 
  }) => {
    try {
      return (
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                {property.propertyName || 'Unnamed Property'}
              </Typography>
              <Chip 
                label={property.propertyType || 'Unknown'} 
                color={property.propertyType === 'SFR' ? 'primary' : 'secondary'} 
                size="small" 
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {property.propertyAddress ? 
                `${property.propertyAddress.street || ''}, ${property.propertyAddress.city || ''}, ${property.propertyAddress.state || ''} ${property.propertyAddress.zipCode || ''}` : 
                'Address not available'
              }
            </Typography>
            
            <Typography variant="h6" color="text.primary" sx={{ mt: 2 }}>
              {formatCurrency(property.purchasePrice)}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              {property.analysis && property.analysis.keyMetrics?.capRate && (
                <Chip 
                  label={`Cap Rate: ${formatPercent(property.analysis.keyMetrics.capRate)}`} 
                  variant="outlined" 
                  size="small" 
                />
              )}
              
              {property.analysis && property.analysis.keyMetrics?.cashOnCashReturn && (
                <Chip 
                  label={`CoC: ${formatPercent(property.analysis.keyMetrics.cashOnCashReturn)}`} 
                  variant="outlined" 
                  size="small" 
                />
              )}
            </Box>
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Last updated: {formatDate(property.updatedAt)}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <IconButton 
                edge="end" 
                aria-label="view"
                onClick={() => onView(property._id)}
                sx={{ mr: 1 }}
              >
                <VisibilityIcon />
              </IconButton>
              <IconButton 
                edge="end" 
                aria-label="delete"
                onClick={() => onDelete(property._id)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      );
    } catch (error) {
      console.error('Error rendering property card:', error, property);
      return (
        <Card variant="outlined">
          <CardContent>
            <Typography color="error">Error displaying property</Typography>
            <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify({ id: property._id, error: String(error) }, null, 2)}
            </Typography>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Saved Properties
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={fetchProperties}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            {loading ? 'Loading...' : 'Refresh List'}
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

      <Paper sx={{ p: 3, mb: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : properties.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" gutterBottom>
              No saved properties yet
            </Typography>
            <Typography variant="body1" paragraph>
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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {properties.map(property => {
              if (!isValidProperty(property)) {
                console.error('Invalid property structure:', property);
                return (
                  <Box 
                    key={property._id || 'invalid-' + Math.random()}
                    sx={{ 
                      width: { xs: '100%', md: 'calc(50% - 16px)', lg: 'calc(33.333% - 16px)' },
                      minWidth: '280px',
                      flexGrow: 1
                    }}
                  >
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="error">Invalid property data</Typography>
                        <pre>{JSON.stringify(property, null, 2).substring(0, 200) + '...'}</pre>
                      </CardContent>
                    </Card>
                  </Box>
                );
              }

              return (
                <Box 
                  key={property._id}
                  sx={{ 
                    width: { xs: '100%', md: 'calc(50% - 16px)', lg: 'calc(33.333% - 16px)' },
                    minWidth: '280px',
                    flexGrow: 1
                  }}
                >
                  <PropertyCard 
                    property={property} 
                    onDelete={openDeleteDialog} 
                    onView={viewPropertyDetails} 
                  />
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

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