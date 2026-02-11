import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { appleColors, appleBorderRadius } from '../../theme/appleDesignSystem';

export type FAQItem = {
  question: string;
  answer: string;
};

interface PricingFAQProps {
  items: FAQItem[];
}

const PricingFAQ: React.FC<PricingFAQProps> = ({ items }) => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <Box sx={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      {items.map((item, index) => (
        <Accordion
          key={`faq-${index}`}
          expanded={expanded === `panel${index}`}
          onChange={handleChange(`panel${index}`)}
          sx={{
            mb: 2,
            borderRadius: appleBorderRadius.lg,
            border: `1px solid ${appleColors.gray[200]}`,
            boxShadow: 'none',
            '&:before': {
              display: 'none' // Remove default MUI accordion divider
            },
            '&.Mui-expanded': {
              margin: '0 0 16px 0'
            }
          }}
          disableGutters
        >
          <AccordionSummary
            expandIcon={
              <ExpandMoreIcon
                sx={{
                  color: appleColors.primary[600],
                  fontSize: '28px'
                }}
              />
            }
            sx={{
              px: { xs: 2, md: 3 },
              py: { xs: 1.5, md: 2 },
              minHeight: 'auto',
              '&.Mui-expanded': {
                minHeight: 'auto'
              },
              '& .MuiAccordionSummary-content': {
                margin: '12px 0',
                '&.Mui-expanded': {
                  margin: '12px 0'
                }
              }
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: '1rem', md: '1.125rem' },
                fontWeight: 600,
                color: appleColors.gray[900],
                lineHeight: 1.4
              }}
            >
              {item.question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              px: { xs: 2, md: 3 },
              pb: { xs: 2, md: 3 },
              pt: 0
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: '0.875rem', md: '1rem' },
                color: appleColors.gray[700],
                lineHeight: 1.6,
                whiteSpace: 'pre-line' // Preserve line breaks in answer text
              }}
            >
              {item.answer}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default PricingFAQ;
