import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { PropertyData } from '../services/simpleApi';

interface PropertyFormProps {
  onSubmit: (propertyData: PropertyData) => void;
  isLoading?: boolean;
}

// Default values for the form
const defaultPropertyData: PropertyData = {
  propertyName: 'Sample Property',
  propertyAddress: {
    street: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94103'
  },
  purchasePrice: 500000,
  downPayment: 100000,
  interestRate: 4.5,
  loanTerm: 30,
  monthlyRent: 3000,
  propertyTaxRate: 1.2,
  insuranceRate: 0.5,
  maintenanceCost: 200,
  propertyManagementRate: 8,
  vacancyRate: 5,
  closingCosts: 5000,
  repairCosts: 10000,
  squareFootage: 1200,
  bedrooms: 3,
  bathrooms: 2,
  yearBuilt: 1995,
  // Long term assumptions
  annualRentIncrease: 3,
  annualPropertyValueIncrease: 4,
  sellingCostsPercentage: 6,
  inflationRate: 2.5,
  projectionYears: 10
};

const PropertyForm: React.FC<PropertyFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<PropertyData>(defaultPropertyData);

  useEffect(() => {
    // Check if we're editing an existing analysis
    const editAnalysisId = localStorage.getItem('currentEditAnalysisId');
    if (!editAnalysisId) {
      // Not editing - just use the default data which is already set in useState
      return;
    }
    
    try {
      // Get all saved analyses
      const savedAnalysesStr = localStorage.getItem('savedAnalyses');
      if (!savedAnalysesStr) {
        console.error('No saved analyses found in localStorage');
        return;
      }
      
      // Parse the saved analyses
      const savedAnalyses = JSON.parse(savedAnalysesStr);
      console.log('All saved analyses:', savedAnalyses);
      
      // Find the analysis we want to edit
      const analysisToEdit = savedAnalyses.find((analysis: Record<string, unknown>) => 
        analysis.id === editAnalysisId
      );
      
      if (!analysisToEdit) {
        console.error('Analysis not found with ID:', editAnalysisId);
        return;
      }
      
      console.log('Found analysis to edit:', analysisToEdit);
      
      // Get data from the raw stored analysis if available
      const rawData = analysisToEdit.rawData || {};
      console.log('Raw analysis data:', rawData);
      
      // Extract property details from raw data or top-level fields
      const propertyDetails = rawData.propertyDetails || {};
      console.log('Property details:', propertyDetails);
      
      // Extract property address
      let propertyAddress = analysisToEdit.address || propertyDetails.propertyAddress || {};
      if (typeof propertyAddress !== 'object') {
        propertyAddress = {}; // Fallback if address is not an object
      }
      
      // Create a new property data object with data from saved analysis
      const propertyData: PropertyData = {
        // Start with defaults to ensure all fields have values
        ...defaultPropertyData,
        
        // Basic property info
        propertyName: analysisToEdit.propertyName || propertyDetails.propertyName || defaultPropertyData.propertyName,
        
        // Address info
        propertyAddress: {
          street: propertyAddress.street || defaultPropertyData.propertyAddress.street,
          city: propertyAddress.city || defaultPropertyData.propertyAddress.city,
          state: propertyAddress.state || defaultPropertyData.propertyAddress.state,
          zipCode: propertyAddress.zipCode || defaultPropertyData.propertyAddress.zipCode
        },
        
        // Financial info - try both locations
        purchasePrice: Number(analysisToEdit.purchasePrice) || Number(propertyDetails.purchasePrice) || defaultPropertyData.purchasePrice,
        downPayment: Number(analysisToEdit.downPayment) || Number(propertyDetails.downPayment) || defaultPropertyData.downPayment,
        monthlyRent: Number(analysisToEdit.monthlyRent) || Number(propertyDetails.monthlyRent) || defaultPropertyData.monthlyRent,
        
        // Loan details
        interestRate: Number(propertyDetails.interestRate) || defaultPropertyData.interestRate,
        loanTerm: Number(propertyDetails.loanTerm) || defaultPropertyData.loanTerm,
        
        // Expense ratios
        propertyTaxRate: Number(propertyDetails.propertyTaxRate) || defaultPropertyData.propertyTaxRate,
        insuranceRate: Number(propertyDetails.insuranceRate) || defaultPropertyData.insuranceRate,
        maintenanceCost: Number(propertyDetails.maintenanceCost) || defaultPropertyData.maintenanceCost,
        propertyManagementRate: Number(propertyDetails.propertyManagementRate) || defaultPropertyData.propertyManagementRate,
        vacancyRate: Number(propertyDetails.vacancyRate) || defaultPropertyData.vacancyRate,
        
        // Additional costs
        closingCosts: Number(propertyDetails.closingCosts) || defaultPropertyData.closingCosts,
        repairCosts: Number(propertyDetails.repairCosts) || defaultPropertyData.repairCosts,
        
        // Property characteristics
        squareFootage: Number(propertyDetails.squareFootage) || defaultPropertyData.squareFootage,
        bedrooms: Number(propertyDetails.bedrooms) || defaultPropertyData.bedrooms,
        bathrooms: Number(propertyDetails.bathrooms) || defaultPropertyData.bathrooms,
        yearBuilt: Number(propertyDetails.yearBuilt) || defaultPropertyData.yearBuilt,
      };
      
      // Get long-term assumptions if available
      const longTermAssumptions = propertyDetails.longTermAssumptions || rawData.longTermAssumptions;
      if (longTermAssumptions) {
        propertyData.annualRentIncrease = Number(longTermAssumptions.annualRentIncrease) || defaultPropertyData.annualRentIncrease;
        propertyData.annualPropertyValueIncrease = Number(longTermAssumptions.annualPropertyValueIncrease) || defaultPropertyData.annualPropertyValueIncrease;
        propertyData.projectionYears = Number(longTermAssumptions.projectionYears) || defaultPropertyData.projectionYears;
        propertyData.inflationRate = Number(longTermAssumptions.inflationRate) || defaultPropertyData.inflationRate;
        propertyData.sellingCostsPercentage = Number(longTermAssumptions.sellingCostsPercentage) || defaultPropertyData.sellingCostsPercentage;
      }
      
      console.log('Loaded property data for editing:', propertyData);
      
      // Update the form with the loaded data
      setFormData(propertyData);
    } catch (error) {
      console.error('Error loading analysis for editing:', error);
      // Clean up localStorage items to avoid future issues
      localStorage.removeItem('currentEditAnalysisId');
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle nested address fields
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        propertyAddress: {
          ...formData.propertyAddress,
          [addressField]: value
        }
      });
    } else {
      // Convert to number if the field is not a string type
      const isStringField = [
        'propertyName', 
        'propertyAddress.street', 
        'propertyAddress.city', 
        'propertyAddress.state', 
        'propertyAddress.zipCode'
      ].includes(name);
      
      setFormData({
        ...formData,
        [name]: isStringField ? value : Number(value)
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any edit-related localStorage items after submission
    localStorage.removeItem('currentEditAnalysisId');
    localStorage.removeItem('currentEditAnalysisData');
    
    // Submit the form data
    onSubmit(formData);
  };

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Property Analysis Form
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Box component="form" onSubmit={handleSubmit}>
          {/* Property Details Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Property Details
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Property Name"
                name="propertyName"
                value={formData.propertyName}
                onChange={handleChange}
                required
              />
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  label="Street Address"
                  name="address.street"
                  value={formData.propertyAddress.street}
                  onChange={handleChange}
                  required
                />
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  label="City"
                  name="address.city"
                  value={formData.propertyAddress.city}
                  onChange={handleChange}
                  required
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  label="State"
                  name="address.state"
                  value={formData.propertyAddress.state}
                  onChange={handleChange}
                  required
                />
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  label="Zip Code"
                  name="address.zipCode"
                  value={formData.propertyAddress.zipCode}
                  onChange={handleChange}
                  required
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  required
                />
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  required
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Square Footage"
                  name="squareFootage"
                  value={formData.squareFootage}
                  onChange={handleChange}
                  required
                />
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Year Built"
                  name="yearBuilt"
                  value={formData.yearBuilt}
                  onChange={handleChange}
                  required
                />
              </Box>
            </Box>
          </Box>
          
          {/* Financial Details Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Financial Details
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Purchase Price"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Down Payment"
                  name="downPayment"
                  value={formData.downPayment}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Interest Rate"
                  name="interestRate"
                  value={formData.interestRate}
                  onChange={handleChange}
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Loan Term (Years)"
                  name="loanTerm"
                  value={formData.loanTerm}
                  onChange={handleChange}
                  required
                />
              </Box>
              
              <TextField
                sx={{ flex: '1 1 45%', minWidth: 200 }}
                type="number"
                label="Monthly Rent"
                name="monthlyRent"
                value={formData.monthlyRent}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Box>
          </Box>
          
          {/* Expenses Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Operating Expenses
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Property Tax Rate"
                  name="propertyTaxRate"
                  value={formData.propertyTaxRate}
                  onChange={handleChange}
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Insurance Rate"
                  name="insuranceRate"
                  value={formData.insuranceRate}
                  onChange={handleChange}
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Monthly Maintenance"
                  name="maintenanceCost"
                  value={formData.maintenanceCost}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Property Management"
                  name="propertyManagementRate"
                  value={formData.propertyManagementRate}
                  onChange={handleChange}
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Vacancy Rate"
                  name="vacancyRate"
                  value={formData.vacancyRate}
                  onChange={handleChange}
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Closing Costs"
                  name="closingCosts"
                  value={formData.closingCosts}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Box>
              
              <TextField
                type="number"
                label="Repair Costs"
                name="repairCosts"
                value={formData.repairCosts}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Box>
          </Box>
          
          {/* Long Term Assumptions Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Long Term Assumptions
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Annual Rent Increase"
                  name="annualRentIncrease"
                  value={formData.annualRentIncrease || 2}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Annual Property Value Increase"
                  name="annualPropertyValueIncrease"
                  value={formData.annualPropertyValueIncrease || 3}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Selling Costs"
                  name="sellingCostsPercentage"
                  value={formData.sellingCostsPercentage || 6}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
                <TextField
                  sx={{ flex: '1 1 45%', minWidth: 200 }}
                  type="number"
                  label="Inflation Rate"
                  name="inflationRate"
                  value={formData.inflationRate || 2}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Box>
              
              <TextField
                sx={{ flex: '1 1 45%', minWidth: 200 }}
                type="number"
                label="Projection Years"
                name="projectionYears"
                value={formData.projectionYears || 10}
                onChange={handleChange}
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button 
              variant="contained" 
              color="primary" 
              type="submit"
              disabled={isLoading}
              size="large"
            >
              {isLoading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Analyzing...
                </>
              ) : (
                'Analyze Property'
              )}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PropertyForm; 