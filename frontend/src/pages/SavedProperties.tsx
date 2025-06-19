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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';
import { Link } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { propertyApi } from '../services/api';
import { formatCurrency, formatPercent, formatDate } from '../utils/formatters';
import AnalysisResults from '../components/SFRAnalysis/AnalysisResults';

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
    // Other analysis fields might be present
    [key: string]: any;
  };
  // Allow other fields that might be in the response
  [key: string]: any;
}

const SavedProperties: React.FC = () => {
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);

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

  // Add a function to check if property has valid structure
  const isValidProperty = (property: any): boolean => {
    if (!property || typeof property !== 'object') return false;
    if (!property._id) return false;
    if (!property.propertyName) return false;
    if (!property.propertyType) return false;
    return true;
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
            component={Link}
            to="/sfr-analysis"
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
              component={Link}
              to="/sfr-analysis"
              sx={{ mt: 2 }}
            >
              Analyze New Property
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="properties table">
              <TableHead>
                <TableRow>
                  <TableCell>Property Name</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Cap Rate</TableCell>
                  <TableCell align="right">CoC Return</TableCell>
                  <TableCell align="right">IRR</TableCell>
                  <TableCell align="right">AI Score</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {properties.map((property) => {
                  if (!isValidProperty(property)) {
                    return (
                      <TableRow key={property._id || 'invalid-' + Math.random()}>
                        <TableCell colSpan={9}>
                          <Typography color="error">Invalid property data</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return (
                    <TableRow 
                      key={property._id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {property.propertyName || 'Unnamed Property'}
                        <Chip 
                          label={property.propertyType === 'SFR' ? 'SFR' : 'MF'} 
                          color={property.propertyType === 'SFR' ? 'primary' : 'secondary'} 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      </TableCell>
                      <TableCell>
                        {property.propertyAddress ? 
                          `${property.propertyAddress.street || ''}, ${property.propertyAddress.city || ''}, ${property.propertyAddress.state || ''} ${property.propertyAddress.zipCode || ''}` : 
                          'Address not available'
                        }
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(property.purchasePrice)}
                      </TableCell>
                      <TableCell align="right">
                        {property.analysis?.keyMetrics?.capRate ? 
                          formatPercent(property.analysis.keyMetrics.capRate) : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell align="right">
                        {property.analysis?.keyMetrics?.cashOnCashReturn ? 
                          formatPercent(property.analysis.keyMetrics.cashOnCashReturn) : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell align="right">
                        {property.analysis?.longTermAnalysis?.returns?.irr ? 
                          formatPercent(property.analysis.longTermAnalysis.returns.irr) : 
                          '0.00%'
                        }
                      </TableCell>
                      <TableCell align="right">
                        {property.analysis?.aiInsights?.investmentScore ? 
                          `${property.analysis.aiInsights.investmentScore}/100` : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        {formatDate(property.updatedAt)}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton 
                            color="primary"
                            component={Link}
                            to={`/${property.propertyType.toLowerCase()}-analysis?id=${property._id}`}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            color="error" 
                            onClick={() => openDeleteDialog(property._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
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

      {selectedDeal && (
        <AnalysisResults 
          analysis={selectedDeal.analysis} 
          propertyData={selectedDeal.propertyData}
          setAnalysis={(updatedAnalysis) => {
            // Update the selected deal with the new analysis
            setSelectedDeal((prev: SavedProperty | null) => {
              if (!prev) return prev;
              return {
                ...prev,
                analysis: updatedAnalysis
              };
            });
          }}
        />
      )}
    </Box>
  );
};

export default SavedProperties; 