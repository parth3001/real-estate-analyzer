/**
 * TaxEducationSummary - Educational Tax Content Component
 *
 * Displays educational tax information without optimization or recommendations
 * This replaces the old TaxImpactSummary component
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Link,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  School as LearnIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  AccountBalance as TaxIcon,
  ContactSupport as CPAIcon,
  OpenInNew as ExternalLinkIcon
} from '@mui/icons-material';

interface TaxEducationalContent {
  disclaimer: string;
  rateComparison: {
    shortTermExample: string;
    longTermExample: string;
    depreciationExample?: string;
    stateTaxExample?: string;
    note: string;
  };
  educationalConcepts: Array<{
    title: string;
    description: string;
    learnMoreUrl?: string;
  }>;
  cpaReferral: {
    message: string;
    questionsToAsk: string[];
    findCPAUrl: string;
  };
  examples: Array<{
    scenario: string;
    explanation: string;
    disclaimer: string;
  }>;
}

interface TaxEducationSummaryProps {
  purchasePrice?: number;
  propertyData?: any; // Full property data for contextual examples
}

const TaxEducationSummary: React.FC<TaxEducationSummaryProps> = ({ purchasePrice, propertyData }) => {
  const [educationalContent, setEducationalContent] = useState<TaxEducationalContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | false>('concepts');

  useEffect(() => {
    fetchEducationalContent();
  }, [propertyData]);

  const fetchEducationalContent = async () => {
    try {
      setLoading(true);

      // Use property-specific endpoint if we have property data
      if (propertyData) {
        const response = await fetch('/api/education/tax-context', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ propertyData })
        });

        if (!response.ok) {
          throw new Error('Failed to load educational content');
        }

        const data = await response.json();
        if (data.content) {
          setEducationalContent(data.content);
        }
      } else {
        // Fallback to generic education
        const response = await fetch('/api/education/tax-basics');

        if (!response.ok) {
          throw new Error('Failed to load educational content');
        }

        const data = await response.json();
        if (data.content) {
          setEducationalContent(data.content);
        }
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching tax education:', err);
      setError('Unable to load educational content. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!educationalContent) {
    return null;
  }

  return (
    <>
      {/* Rate Comparison Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: 'primary.50',
              border: '1px solid',
              borderColor: 'primary.200'
            }}>
              <TaxIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Tax Rate Comparison
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Understanding short-term vs long-term capital gains
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {educationalContent.rateComparison.shortTermExample}
              </Typography>
            </Alert>
            <Alert severity="success">
              <Typography variant="body2">
                {educationalContent.rateComparison.longTermExample}
              </Typography>
            </Alert>
          </Box>

          {educationalContent.rateComparison.depreciationExample && (
            <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                💡 <strong>Depreciation Benefit:</strong> {educationalContent.rateComparison.depreciationExample}
              </Typography>
            </Box>
          )}

          {educationalContent.rateComparison.stateTaxExample && (
            <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                🏠 <strong>State Tax Differences:</strong> {educationalContent.rateComparison.stateTaxExample}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="caption" color="text.secondary">
            <InfoIcon sx={{ fontSize: 14, verticalAlign: 'text-bottom', mr: 0.5 }} />
            {educationalContent.rateComparison.note}
          </Typography>
        </CardContent>
      </Card>

      {/* Educational Concepts Accordion */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 'success.50',
                border: '1px solid',
                borderColor: 'success.200'
              }}>
                <LearnIcon sx={{ color: 'success.main', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Tax Education Concepts
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Click to learn more about each concept
                </Typography>
              </Box>
            </Box>
          </Box>

          {educationalContent.educationalConcepts.map((concept, index) => (
            <Accordion
              key={index}
              expanded={expandedSection === `concept-${index}`}
              onChange={handleAccordionChange(`concept-${index}`)}
              elevation={0}
              sx={{
                '&:before': { display: 'none' },
                borderTop: '1px solid',
                borderColor: 'divider'
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ px: 3 }}
              >
                <Typography fontWeight={500}>{concept.title}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {concept.description}
                </Typography>
                {concept.learnMoreUrl && (
                  <Button
                    size="small"
                    startIcon={<ExternalLinkIcon />}
                    href={concept.learnMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn More at IRS.gov
                  </Button>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>

      {/* Examples Card */}
      {educationalContent.examples && educationalContent.examples.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              Real Estate Tax Examples
            </Typography>

            {educationalContent.examples.map((example, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  mb: 2,
                  backgroundColor: 'grey.50',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}
              >
                <Typography variant="subtitle2" fontWeight={600} color="primary" sx={{ mb: 1 }}>
                  {example.scenario}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {example.explanation}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ⚠️ {example.disclaimer}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* CPA Referral Card */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: 'warning.50',
              border: '1px solid',
              borderColor: 'warning.200'
            }}>
              <CPAIcon sx={{ color: 'warning.main', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Consult a Tax Professional
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Get personalized tax advice for your situation
              </Typography>
            </Box>
          </Box>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {educationalContent.cpaReferral.message}
            </Typography>
          </Alert>

          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
            Questions to Ask Your CPA:
          </Typography>

          <Box component="ul" sx={{ pl: 2, mb: 3 }}>
            {educationalContent.cpaReferral.questionsToAsk.map((question, index) => (
              <Typography key={index} component="li" variant="body2" sx={{ mb: 1 }}>
                {question}
              </Typography>
            ))}
          </Box>

          <Button
            variant="contained"
            fullWidth
            startIcon={<ExternalLinkIcon />}
            href={educationalContent.cpaReferral.findCPAUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Find a Qualified CPA
          </Button>
        </CardContent>
      </Card>
    </>
  );
};

export default TaxEducationSummary;