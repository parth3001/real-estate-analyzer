import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, CircularProgress, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { propertyApi } from '../services/api';
import AnalysisResults from '../components/SFRAnalysis/AnalysisResults';

const AnalysisDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No analysis ID provided');
      setLoading(false);
      return;
    }

    loadDeal();
  }, [id]);

  const loadDeal = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await propertyApi.getProperty(id!);
      if (response.status === 200 && response.data) {
        setDeal(response.data);
      } else {
        throw new Error('Failed to load analysis');
      }
    } catch (error: any) {
      console.error('Error loading deal:', error);
      setError(error.message || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
        </Button>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">Failed to Load Analysis</Typography>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadDeal}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!deal) {
    return (
      <Box sx={{ p: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
        </Button>
        <Alert severity="warning">
          Analysis not found
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: 'grey.50', minHeight: '100vh' }}>
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
        </Button>
      </Box>

      <AnalysisResults
        propertyData={deal.propertyData}
        analysis={deal.analysis}
        dealId={deal._id}
        onParameterChange={async () => {
          // Analysis is already saved, just log
          console.log('Analysis already saved');
        }}
      />
    </Box>
  );
};

export default AnalysisDetails;