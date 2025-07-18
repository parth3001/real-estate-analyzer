// Apple Components Demo Page
// This page demonstrates all Apple components and tests compatibility

import React, { useState } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { Home, TrendingUp, Assessment, ShowChart } from '@mui/icons-material';
import {
  AppleMetricCard,
  AppleButton,
  AppleInput,
  AppleProgressIndicator,
  AppleCard,
  AppleStatusBadge,
  AppleLoadingSpinner,
  AppleCashFlowCard,
  AppleCapRateCard,
  AppleCoCReturnCard,
  AppleROICard
} from '../ui';

const AppleComponentsDemo: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [currentStep, setCurrentStep] = useState('2');

  // Sample data for testing
  const sampleAnalysis = {
    cashFlow: 1247,
    capRate: 7.2,
    cashOnCash: 12.5,
    totalROI: 156.7
  };

  return (
    <Box sx={{ p: 4, backgroundColor: 'grey.50', minHeight: '100vh' }}>
      <Typography variant="h3" fontWeight={700} mb={1}>
        Apple Components Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Testing all Apple-style components with PropTech data
      </Typography>

      {/* Hero Metric Cards with Real Estate Data */}
      <Typography variant="h5" fontWeight={600} mb={3}>
        Real Estate Metrics (Apple Style)
      </Typography>
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(280px, 1fr))" gap={3} mb={6}>
        <AppleCashFlowCard 
          value={sampleAnalysis.cashFlow}
          size="large"
          trend={12.5}
          subtitle="First year average"
        />
        <AppleCapRateCard 
          value={sampleAnalysis.capRate}
          size="large"
          trend={-0.8}
          subtitle="Based on purchase price"
        />
        <AppleCoCReturnCard 
          value={sampleAnalysis.cashOnCash}
          size="large"
          trend={3.2}
          subtitle="Annual return on cash"
        />
        <AppleROICard 
          value={sampleAnalysis.totalROI}
          size="large"
          trend={15.7}
          subtitle="10 year projection"
        />
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Custom Metric Cards */}
      <Typography variant="h5" fontWeight={600} mb={3}>
        Custom Property Metrics
      </Typography>
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={3} mb={6}>
        <AppleMetricCard 
          label="Price per Sq Ft"
          value={185}
          format="currency"
          icon={<Home />}
          highlight
        />
        <AppleMetricCard 
          label="Rent-to-Price Ratio"
          value={0.8}
          format="percent"
          trend={5.2}
          icon={<TrendingUp />}
        />
        <AppleMetricCard 
          label="DSCR"
          value={1.35}
          format="number"
          icon={<Assessment />}
        />
        <AppleMetricCard 
          label="10-Year IRR"
          value={14.2}
          format="percent"
          icon={<ShowChart />}
          trend={2.1}
        />
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Action Buttons */}
      <Typography variant="h5" fontWeight={600} mb={3}>
        Action Buttons
      </Typography>
      <Box display="flex" gap={2} flexWrap="wrap" mb={6}>
        <AppleButton variant="primary" size="large">
          Analyze New Property
        </AppleButton>
        <AppleButton variant="secondary" size="large">
          Load Sample Data
        </AppleButton>
        <AppleButton variant="ghost" size="large">
          View All Properties
        </AppleButton>
        <AppleButton variant="primary" size="medium" loading>
          Processing Analysis...
        </AppleButton>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Property Input Form */}
      <Typography variant="h5" fontWeight={600} mb={3}>
        Property Input Form
      </Typography>
      <Box maxWidth={600} mb={6}>
        <Box display="grid" gap={3}>
          <AppleInput 
            label="Property Address"
            placeholder="Enter property address..."
            value={inputValue}
            onChange={setInputValue}
            required
          />
          <AppleInput 
            label="Purchase Price"
            placeholder="$0"
            value=""
            onChange={() => {}}
            type="number"
          />
          <AppleInput 
            label="Property Description"
            placeholder="Describe the property..."
            value=""
            onChange={() => {}}
            multiline
            rows={3}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Analysis Progress */}
      <Typography variant="h5" fontWeight={600} mb={3}>
        Analysis Progress
      </Typography>
      <Box mb={6}>
        <AppleProgressIndicator 
          steps={[
            { id: '1', title: 'Property Details', subtitle: 'Address, price, specifications' },
            { id: '2', title: 'Financial Data', subtitle: 'Financing and assumptions' },
            { id: '3', title: 'Market Analysis', subtitle: 'Comparables and trends' },
            { id: '4', title: 'Results', subtitle: 'Analysis complete' }
          ]}
          currentStep={currentStep}
          completedSteps={['1']}
          onStepClick={setCurrentStep}
        />
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Status Indicators */}
      <Typography variant="h5" fontWeight={600} mb={3}>
        Investment Status Indicators
      </Typography>
      <Box display="flex" gap={2} flexWrap="wrap" mb={6}>
        <AppleStatusBadge status="success" size="medium">
          Excellent Deal
        </AppleStatusBadge>
        <AppleStatusBadge status="info" size="medium">
          Good Investment
        </AppleStatusBadge>
        <AppleStatusBadge status="warning" size="medium">
          Proceed with Caution
        </AppleStatusBadge>
        <AppleStatusBadge status="error" size="medium">
          Poor Investment
        </AppleStatusBadge>
        <AppleStatusBadge status="neutral" variant="outlined" size="medium">
          Under Review
        </AppleStatusBadge>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Property Analysis Card */}
      <Typography variant="h5" fontWeight={600} mb={3}>
        Property Analysis Summary
      </Typography>
      <Box maxWidth={800}>
        <AppleCard 
          title="1234 Main Street Investment Analysis"
          subtitle="San Francisco, CA • Last updated: Today at 3:45 PM"
          actions={
            <Box display="flex" gap={2}>
              <AppleButton variant="ghost" size="small">
                Edit Details
              </AppleButton>
              <AppleButton variant="primary" size="small">
                View Full Report
              </AppleButton>
            </Box>
          }
          highlight
        >
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={3} mb={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Cash Flow Status
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <AppleStatusBadge status="success" size="small">Positive</AppleStatusBadge>
                <Typography variant="body2">$1,247/month</Typography>
              </Box>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Market Position
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <AppleStatusBadge status="info" size="small">Competitive</AppleStatusBadge>
                <Typography variant="body2">7.2% Cap Rate</Typography>
              </Box>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            This property demonstrates strong investment fundamentals with positive cash flow 
            from day one and competitive returns in the San Francisco market. The analysis 
            shows potential for long-term appreciation and steady rental income.
          </Typography>
        </AppleCard>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Loading States */}
      <Typography variant="h5" fontWeight={600} mb={3}>
        Loading States
      </Typography>
      <Box display="flex" alignItems="center" gap={4} mb={6}>
        <Box textAlign="center">
          <AppleLoadingSpinner size="small" />
          <Typography variant="caption" display="block" mt={1}>Small</Typography>
        </Box>
        <Box textAlign="center">
          <AppleLoadingSpinner size="medium" />
          <Typography variant="caption" display="block" mt={1}>Medium</Typography>
        </Box>
        <Box textAlign="center">
          <AppleLoadingSpinner size="large" />
          <Typography variant="caption" display="block" mt={1}>Large</Typography>
        </Box>
      </Box>

    </Box>
  );
};

export default AppleComponentsDemo;