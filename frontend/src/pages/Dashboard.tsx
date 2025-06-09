import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Tooltip,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment';

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface SavedAnalysis {
  id: string;
  propertyName: string;
  propertyType: 'SFR' | 'MF';
  address: Address;
  purchasePrice: number;
  downPayment: number;
  monthlyRent: number;
  units: number;
  capRate: number;
  cashOnCash: number;
  noi: number;
  investmentScore?: number;
  dateCreated: string;
  rawData: Record<string, unknown>;
}

// Define a legacy deal type for backward compatibility
interface LegacyDeal {
  name: string;
  type: string;
  data: Record<string, unknown>;
  savedAt: string;
}

const Dashboard: React.FC = () => {
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadSavedAnalyses();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const loadSavedAnalyses = () => {
    try {
      // Try to load from saved analyses
      const analysesStr = localStorage.getItem('savedAnalyses');
      if (analysesStr) {
        console.log('Loading saved analyses from localStorage');
        const analyses = JSON.parse(analysesStr) as SavedAnalysis[];
        
        // Ensure all analyses have the required properties with basic validation
        const processedAnalyses = analyses
          .map(processAnalysisData)
          .filter(analysis => analysis.propertyName); // Filter out any invalid entries
        
        // Sort by date, newest first
        setSavedAnalyses(processedAnalyses.sort((a, b) => 
          new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
        ));
        return;
      }

      // Fallback to legacy format if needed
      const dealsStr = localStorage.getItem('savedDeals');
      if (dealsStr) {
        console.log('Loading legacy deals format');
        const deals = JSON.parse(dealsStr) as LegacyDeal[];
        
        // Map the old format to the new format
        const mappedAnalyses: SavedAnalysis[] = deals.map((deal: LegacyDeal) => {
          // Create a properly typed address
          const propertyAddress = deal.data.propertyAddress as Record<string, string> | undefined;
          const address: Address = {
            street: propertyAddress?.street || '',
            city: propertyAddress?.city || '',
            state: propertyAddress?.state || '',
            zipCode: propertyAddress?.zipCode || ''
          };

          const analysisResult = deal.data.analysisResult as Record<string, unknown> | undefined;
          
          // Try to extract AI investment score
          let investmentScore: number | undefined = undefined;
          if (deal.data.aiInsights) {
            investmentScore = Number((deal.data.aiInsights as Record<string, unknown>)?.investmentScore) || undefined;
          }
          
          return {
            id: `legacy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            propertyName: deal.name,
            propertyType: deal.type === 'multifamily' ? 'MF' : 'SFR' as 'SFR' | 'MF',
            address,
            purchasePrice: Number(deal.data.purchasePrice) || 0,
            downPayment: Number(deal.data.downPayment) || 0,
            monthlyRent: Number(deal.data.monthlyRent) || 0,
            units: Number(deal.data.totalUnits) || 1,
            capRate: analysisResult ? Number(analysisResult.capRate) || 0 : 0,
            cashOnCash: analysisResult ? Number(analysisResult.cashOnCashReturn) || 0 : 0,
            noi: analysisResult ? Number(analysisResult.annualNOI) || 0 : 0,
            investmentScore,
            dateCreated: deal.savedAt,
            rawData: deal.data
          };
        });
        
        // Process and normalize the mapped analyses
        const processedAnalyses = mappedAnalyses
          .map(processAnalysisData)
          .filter(analysis => analysis.propertyName); // Filter out any invalid entries
          
        setSavedAnalyses(processedAnalyses);
      }
    } catch (error) {
      console.error('Error loading saved analyses:', error);
    }
  };

  // Helper function to extract and normalize metrics from analysisData
  const processAnalysisData = (analysis: SavedAnalysis): SavedAnalysis => {
    // Create a copy of the analysis to avoid mutating the original
    const result = { ...analysis };
    
    // Ensure we have valid numeric values for all key fields
    result.purchasePrice = Number(result.purchasePrice) || 0;
    result.downPayment = Number(result.downPayment) || 0;
    result.monthlyRent = Number(result.monthlyRent) || 0;
    result.units = Number(result.units) || 1;
    result.capRate = Number(result.capRate) || 0;
    result.cashOnCash = Number(result.cashOnCash) || 0;
    result.noi = Number(result.noi) || 0;
    
    // Make sure we have at least a name and address
    if (!result.propertyName) {
      result.propertyName = 'Unnamed Property';
    }
    
    if (!result.address) {
      result.address = { street: '', city: '', state: '', zipCode: '' };
    }
    
    // Use rawData as a fallback for missing values
    if (result.rawData) {
      const rawData = result.rawData as Record<string, unknown>;
      const propertyDetails = rawData.propertyDetails as Record<string, unknown> || {};
      
      // Fallback for financial data
      if (result.purchasePrice <= 0 && propertyDetails.purchasePrice) {
        result.purchasePrice = Number(propertyDetails.purchasePrice) || 0;
      }
      
      if (result.downPayment <= 0 && propertyDetails.downPayment) {
        result.downPayment = Number(propertyDetails.downPayment) || 0;
      }
      
      if (result.monthlyRent <= 0 && propertyDetails.monthlyRent) {
        result.monthlyRent = Number(propertyDetails.monthlyRent) || 0;
      }
    }
    
    return result;
  };

  const handleDelete = (id: string) => {
    const updatedAnalyses = savedAnalyses.filter(analysis => analysis.id !== id);
    localStorage.setItem('savedAnalyses', JSON.stringify(updatedAnalyses));
    setSavedAnalyses(updatedAnalyses);
  };

  const handleEdit = (analysis: SavedAnalysis) => {
    console.log('Editing analysis:', analysis);
    
    // Store the ID of the analysis being edited in localStorage
    localStorage.setItem('currentEditAnalysisId', analysis.id);
    
    // Navigate to the analyze page
    navigate('/analyze');
  };

  const formatCurrency = (value?: number) => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value?: number) => {
    if (!value && value !== 0) return '-';
    return `${value.toFixed(2)}%`;
  };

  const getPropertyIdentifier = (analysis: SavedAnalysis) => {
    if (analysis.propertyName) {
      return analysis.propertyName;
    }
    
    const address = analysis.address;
    if (address) {
      return `${address.street || ''}, ${address.city || ''}, ${address.state || ''}`.trim();
    }
    
    return 'Unnamed Property';
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            Property Analysis Dashboard
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/analyze')}
            >
              New SFR Analysis
            </Button>
            <Button
              variant="contained"
              startIcon={<ApartmentIcon />}
              onClick={() => navigate('/analyze-multifamily')}
            >
              New MF Analysis
            </Button>
          </Stack>
        </Stack>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Property</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Units</TableCell>
                <TableCell align="right">Purchase Price</TableCell>
                <TableCell align="right">Down Payment</TableCell>
                <TableCell align="right">Monthly Rent</TableCell>
                <TableCell align="right">Cap Rate</TableCell>
                <TableCell align="right">Cash on Cash</TableCell>
                <TableCell align="right">NOI</TableCell>
                <TableCell align="right">AI Score</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {savedAnalyses.map((analysis) => (
                <TableRow key={analysis.id} hover>
                  <TableCell>{getPropertyIdentifier(analysis)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      icon={analysis.propertyType === 'MF' ? <ApartmentIcon /> : <HomeIcon />}
                      label={analysis.propertyType === 'MF' ? 'Multi-Family' : 'Single Family'}
                      color={analysis.propertyType === 'MF' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">{analysis.units}</TableCell>
                  <TableCell align="right">{formatCurrency(analysis.purchasePrice)}</TableCell>
                  <TableCell align="right">{formatCurrency(analysis.downPayment)}</TableCell>
                  <TableCell align="right">{formatCurrency(analysis.monthlyRent)}</TableCell>
                  <TableCell align="right">{formatPercent(analysis.capRate)}</TableCell>
                  <TableCell align="right">{formatPercent(analysis.cashOnCash)}</TableCell>
                  <TableCell align="right">{formatCurrency(analysis.noi)}</TableCell>
                  <TableCell align="right">
                    {analysis.investmentScore !== undefined ? 
                      <Chip 
                        label={`${Math.round(analysis.investmentScore)}/100`}
                        size="small"
                        color={
                          analysis.investmentScore >= 70 ? 'success' :
                          analysis.investmentScore >= 50 ? 'warning' : 'error'
                        }
                      /> : 
                      '-'
                    }
                  </TableCell>
                  <TableCell>{new Date(analysis.dateCreated).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit Analysis">
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={() => handleEdit(analysis)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(analysis.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {savedAnalyses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No deals analyzed yet. Start by creating a new analysis.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default Dashboard; 