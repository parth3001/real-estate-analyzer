import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, CircularProgress, Button, Divider } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { propertyApi } from '../services/api';
import AnalysisResults from '../components/SFRAnalysis/AnalysisResults';
import { SavedDealHero } from '../components/AnalysisDetails/SavedDealHero';

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
          onClick={() => navigate('/saved-properties')}
          sx={{ mb: 3 }}
        >
          Back to Saved properties
        </Button>

        {/* Phase 4 / Issue #117 — chat-style summary card on top.
            Mirrors the DealScoreCard the user saw when they analyzed
            this property in chat; gives them the continuity moment +
            quick action chips to dig deeper. The legacy SFRAnalysis
            tabs below provide the depth (Tax Intelligence, Interactive
            Analysis, Deal Optimizer, etc.) — UX Designer call was to
            preserve those tabs as the deep-dive surface, not replace
            them. Polymorphic across SFR Buy-Hold / BRRRR / House Hack
            / Multi-Family per the variant config in
            ../components/AnalysisDetails/savedDealVariants.ts. */}
        <SavedDealHero deal={deal} />

        <Divider sx={{ my: 4 }} />

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: 11,
            mb: 2,
          }}
        >
          Deep dive
        </Typography>
      </Box>

      {/* Deep-dive dispatch by propertyType.
          - SFR: render the legacy AnalysisResults tabs (Overview /
            Financial Details / Long-term Analysis / Tax Intelligence /
            Interactive Analysis / Deal Optimizer). They're well-crafted
            and earn their keep as the depth surface beneath the hero.
          - MF: the legacy MF deep-dive page (/mf-analysis?id=X) has
            unit-level breakdowns + multi-family-specific tabs. For now
            we link out (MF deep-dive inline-rendering is follow-up
            work — Issue #117 follow-up). The SavedDealHero above
            already shows the chat-style summary for MF deals; the
            link sends the user to the legacy depth surface. */}
      {deal.propertyType === 'MF' ? (
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontSize: 15, color: 'text.secondary', mb: 2 }}>
              Detailed multi-family analysis — unit mix, per-unit metrics,
              GRM, BEO, debt yield — lives in the full MF view.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate(`/mf-analysis?id=${deal._id}`)}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              View detailed MF analysis →
            </Button>
          </Box>
        </Box>
      ) : (
        <AnalysisResults
          propertyData={deal.propertyData}
          analysis={deal.analysis}
          dealId={deal._id}
          onParameterChange={async () => {
            // Analysis is already saved, just log
            console.log('Analysis already saved');
          }}
        />
      )}
    </Box>
  );
};

export default AnalysisDetails;