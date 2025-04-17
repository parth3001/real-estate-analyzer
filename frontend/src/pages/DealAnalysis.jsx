import React, { useState } from 'react';
import { Box, Container, Paper, Stepper, Step, StepLabel, Typography } from '@mui/material';
import DealForm from '../components/DealAnalysis/DealForm';
import AnalysisResults from '../components/DealAnalysis/AnalysisResults';

const steps = ['Enter Deal Details', 'Review Analysis'];

const DealAnalysis = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [analysis, setAnalysis] = useState(null);

  const handleDealSubmit = async (dealData) => {
    try {
      const response = await fetch('/api/deals/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dealData),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze deal');
      }

      const analysisResult = await response.json();
      setAnalysis(analysisResult);
      setActiveStep(1);
    } catch (error) {
      console.error('Error analyzing deal:', error);
      // TODO: Add error handling UI
    }
  };

  const handleBack = () => {
    setActiveStep(0);
  };

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Single Family Residential Deal Analysis
        </Typography>

        <Box mb={4}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Paper>
          {activeStep === 0 ? (
            <DealForm onSubmit={handleDealSubmit} />
          ) : (
            <Box p={3}>
              <AnalysisResults analysis={analysis} />
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default DealAnalysis; 