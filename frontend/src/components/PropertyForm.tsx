import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Divider,
  InputAdornment
} from '@mui/material';
import { PropertyData } from '../services/simpleApi';

interface PropertyFormProps {
  onSubmit: (propertyData: PropertyData) => void;
  isLoading: boolean;
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

const PropertyForm: React.FC<PropertyFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<PropertyData>(defaultPropertyData);

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
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="Property Name"
                  name="propertyName"
                  value={formData.propertyName}
                  onChange={handleChange}
                  required
                />
              </Box>
              
              <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="Street Address"
                  name="address.street"
                  value={formData.propertyAddress.street}
                  onChange={handleChange}
                  required
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <Box sx={{ flex: '1 1 30%', minWidth: '150px' }}>
                <TextField
                  fullWidth
                  label="City"
                  name="address.city"
                  value={formData.propertyAddress.city}
                  onChange={handleChange}
                  required
                />
              </Box>
              
              <Box sx={{ flex: '1 1 30%', minWidth: '100px' }}>
                <TextField
                  fullWidth
                  label="State"
                  name="address.state"
                  value={formData.propertyAddress.state}
                  onChange={handleChange}
                  required
                />
              </Box>
              
              <Box sx={{ flex: '1 1 30%', minWidth: '100px' }}>
                <TextField
                  fullWidth
                  label="Zip Code"
                  name="address.zipCode"
                  value={formData.propertyAddress.zipCode}
                  onChange={handleChange}
                  required
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <Box sx={{ flex: '1 1 22%', minWidth: '100px' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  required
                />
              </Box>
              
              <Box sx={{ flex: '1 1 22%', minWidth: '100px' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  required
                />
              </Box>
              
              <Box sx={{ flex: '1 1 22%', minWidth: '100px' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Square Footage"
                  name="squareFootage"
                  value={formData.squareFootage}
                  onChange={handleChange}
                  required
                />
              </Box>
              
              <Box sx={{ flex: '1 1 22%', minWidth: '100px' }}>
                <TextField
                  fullWidth
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
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                <TextField
                  fullWidth
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
              </Box>
              
              <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                <TextField
                  fullWidth
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
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <Box sx={{ flex: '1 1 30%', minWidth: '100px' }}>
                <TextField
                  fullWidth
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
              </Box>
              
              <Box sx={{ flex: '1 1 30%', minWidth: '100px' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Loan Term (Years)"
                  name="loanTerm"
                  value={formData.loanTerm}
                  onChange={handleChange}
                  required
                />
              </Box>
              
              <Box sx={{ flex: '1 1 30%', minWidth: '100px' }}>
                <TextField
                  fullWidth
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
          </Box>
          
          {/* Expenses Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Operating Expenses
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 22%', minWidth: '100px' }}>
                <TextField
                  fullWidth
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
              </Box>
              
              <Box sx={{ flex: '1 1 22%', minWidth: '100px' }}>
                <TextField
                  fullWidth
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
              
              <Box sx={{ flex: '1 1 22%', minWidth: '100px' }}>
                <TextField
                  fullWidth
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
              </Box>
              
              <Box sx={{ flex: '1 1 22%', minWidth: '100px' }}>
                <TextField
                  fullWidth
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
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <Box sx={{ flex: '1 1 30%', minWidth: '100px' }}>
                <TextField
                  fullWidth
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
              </Box>
              
              <Box sx={{ flex: '1 1 30%', minWidth: '100px' }}>
                <TextField
                  fullWidth
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
              
              <Box sx={{ flex: '1 1 30%', minWidth: '100px' }}>
                <TextField
                  fullWidth
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
          </Box>
          
          {/* Long Term Assumptions Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Long Term Assumptions
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 30%', minWidth: '100px' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Annual Rent Increase"
                  name="annualRentIncrease"
                  value={formData.annualRentIncrease || 2}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Box>
              
              <Box sx={{ flex: '1 1 30%', minWidth: '100px' }}>
                <TextField
                  fullWidth
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
              
              <Box sx={{ flex: '1 1 30%', minWidth: '100px' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Selling Costs"
                  name="sellingCostsPercentage"
                  value={formData.sellingCostsPercentage || 6}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <Box sx={{ flex: '1 1 30%', minWidth: '100px' }}>
                <TextField
                  fullWidth
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
              
              <Box sx={{ flex: '1 1 30%', minWidth: '100px' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Projection Years"
                  name="projectionYears"
                  value={formData.projectionYears || 10}
                  onChange={handleChange}
                />
              </Box>
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
              {isLoading ? 'Analyzing...' : 'Analyze Property'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PropertyForm; 