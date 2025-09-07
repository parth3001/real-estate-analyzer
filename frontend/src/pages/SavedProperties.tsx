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
import { pipelineApi } from '../services/pipelineApi';
import { formatCurrency, formatPercent, formatDate } from '../utils/formatters';
import AnalysisResults from '../components/SFRAnalysis/AnalysisResults';
import { ConfidenceIndicator, calculateConfidence } from '../components/ui/ConfidenceIndicator';

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
    };
    // Other analysis fields might be present
    [key: string]: any;
  };
  confidence?: {
    level: 1 | 2 | 3;
    dataSource: string;
    calculationMethod: string;
  };
  quickMetrics?: {
    cashFlow?: number;
    capRate?: number;
    cashOnCashReturn?: number;
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
  const [selectedDeal] = useState<any>(null);
  const [isImportingToPipeline, setIsImportingToPipeline] = useState<{[key: string]: boolean}>({});

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

  // Handle importing property to Pipeline
  const handleImportToPipeline = async (property: SavedProperty) => {
    setIsImportingToPipeline(prev => ({...prev, [property._id]: true}));
    setError(null);
    
    try {
      console.log('Importing property to Pipeline:', property._id);
      
      const result = await pipelineApi.convertAnalysisToPipeline(
        property._id,
        {
          channel: 'OTHER',
          contact: 'Imported from Saved Properties',
          notes: 'Converted from existing analysis'
        },
        `Imported saved property: ${property.propertyName || 'Unknown Property'}`
      );
      
      console.log('Successfully imported to Pipeline:', result);
      setSuccessMessage(`"${property.propertyName}" successfully added to Pipeline!`);
    } catch (err) {
      console.error('Error importing to Pipeline:', err);
      setError('Error importing to Pipeline: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsImportingToPipeline(prev => ({...prev, [property._id]: false}));
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

  // Property source detection logic (same as Portfolio dashboard)
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
    
    return 'manual'; // Default to manual for safety
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
                  <TableCell align="center">
                    <Tooltip 
                      title={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            Investment Insights
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                            ●○○ Basic Insights - Address, price, basic info
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                            ●●○ Good Insights - Cash flow and metrics calculated
                          </Typography>
                          <Typography variant="caption" display="block">
                            ●●● Complete Insights - Full analysis with AI recommendations
                          </Typography>
                        </Box>
                      }
                      placement="top"
                      arrow
                    >
                      <Typography component="span" sx={{ cursor: 'help', borderBottom: '1px dotted' }}>
                        Investment Insights
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Cap Rate</TableCell>
                  <TableCell align="right">CoC Return</TableCell>
                  <TableCell align="right">IRR</TableCell>
                  <TableCell align="right">
                    <Tooltip 
                      title={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            Investment Rating
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                            Our V3.0 Investment Engine's quality assessment:
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                            ●○○ Basic - Property info available
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                            ●●○ Good - Financial metrics calculated
                          </Typography>
                          <Typography variant="caption" display="block">
                            ●●● Excellent - Full professional analysis with deal quality score
                          </Typography>
                        </Box>
                      }
                      placement="top"
                      arrow
                    >
                      <Typography component="span" sx={{ cursor: 'help', borderBottom: '1px dotted' }}>
                        Investment Rating
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {properties.map((property) => {
                  if (!isValidProperty(property)) {
                    return (
                      <TableRow key={property._id || 'invalid-' + Math.random()}>
                        <TableCell colSpan={10}>
                          <Typography color="error">Invalid property data</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  const isManualProperty = getPropertySource(property) === 'manual';

                  return (
                    <TableRow 
                      key={property._id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
                            {property.propertyName || 'Unnamed Property'}
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip 
                              label={property.propertyType === 'SFR' ? 'SFR' : 'MF'} 
                              color={property.propertyType === 'SFR' ? 'primary' : 'secondary'} 
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {property.propertyAddress ? (
                          <Box>
                            <Typography variant="body2" sx={{ lineHeight: 1.3 }}>
                              {property.propertyAddress.street || 'Street not available'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                              {`${property.propertyAddress.city || ''}, ${property.propertyAddress.state || ''} ${property.propertyAddress.zipCode || ''}`.trim()}
                            </Typography>
                          </Box>
                        ) : (
                          'Address not available'
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {(() => {
                          // Calculate investment insights level
                          const insightsLevel = calculateConfidence(property);
                          
                          // Determine source for tooltip
                          const source = isManualProperty ? 'Manual Entry' : 'Full Analysis';
                          
                          return (
                            <ConfidenceIndicator 
                              level={insightsLevel} 
                              size="small" 
                              source={source}
                            />
                          );
                        })()}
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
                        {(() => {
                          const dealQuality = (property.analysis?.investmentDecision as any)?.professionalAssessment?.dealQuality;
                          const verdict = (property.analysis?.investmentDecision as any)?.verdict;
                          
                          if (typeof dealQuality === 'number') {
                            return (
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {dealQuality}/100
                                </Typography>
                                {verdict && (
                                  <Typography variant="caption" sx={{ 
                                    color: verdict === 'BUY' ? 'success.main' : 
                                           verdict === 'NEGOTIATE' ? 'warning.main' :
                                           verdict === 'CAUTION' ? 'info.main' : 'error.main',
                                    fontWeight: 500
                                  }}>
                                    {verdict}
                                  </Typography>
                                )}
                              </Box>
                            );
                          }
                          return 'N/A';
                        })()}
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
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleImportToPipeline(property)}
                          disabled={isImportingToPipeline[property._id]}
                          sx={{ 
                            minWidth: 'auto',
                            fontSize: '0.75rem',
                            px: 1.5,
                            py: 0.5,
                            textTransform: 'none'
                          }}
                        >
                          {isImportingToPipeline[property._id] ? 'Adding...' : 'Add to Pipeline'}
                        </Button>
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
          dealId={selectedDeal._id}
        />
      )}
    </Box>
  );
};

export default SavedProperties; 