import React from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, Divider, Paper } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const HelpPage: React.FC = () => {
  const faqs = [
    {
      question: 'What is the Real Estate Deal Analyzer?',
      answer: 'The Real Estate Deal Analyzer is a powerful tool designed to help real estate investors analyze potential property investments. It provides comprehensive financial analysis for both single-family and multi-family properties, including metrics like Cash on Cash Return, Cap Rate, IRR, and more.'
    },
    {
      question: 'How do I start a new property analysis?',
      answer: 'You can start a new analysis by clicking on either "SFR Analysis" for single-family properties or "MF Analysis" for multi-family properties in the navigation menu. Then fill out the property details form and click "Analyze" to get your results.'
    },
    {
      question: 'What financial metrics are calculated?',
      answer: 'The analyzer calculates a wide range of metrics including: Monthly Cash Flow, Cap Rate, Cash on Cash Return, Debt Service Coverage Ratio (DSCR), Internal Rate of Return (IRR), Total Return on Investment (ROI), and more. Each metric is accompanied by an explanation of what it means for your investment.'
    },
    {
      question: 'How accurate are the AI-powered insights?',
      answer: 'The AI insights are based on the financial data you provide and market trends. They should be used as one of many factors in your investment decision-making process, not as the sole determining factor. Always verify any recommendations with your own research.'
    },
    {
      question: 'Can I save my analyses for later?',
      answer: 'Yes, after analyzing a property you can save the analysis for future reference. All saved properties can be accessed through the "Saved Properties" section.'
    },
    {
      question: 'What is the difference between Cap Rate and Cash on Cash Return?',
      answer: "Cap Rate (Capitalization Rate) measures the potential return on a property regardless of how it's financed. It's calculated as Net Operating Income divided by Property Value. Cash on Cash Return measures the return specifically on the cash you've invested, calculated as Annual Cash Flow divided by Total Cash Invested."
    }
  ];

  return (
    <Box>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Help & Documentation
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to the Real Estate Deal Analyzer help page. Here you'll find answers to 
          common questions about using the analyzer and understanding the results.
        </Typography>
      </Paper>

      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Frequently Asked Questions
      </Typography>
      
      {faqs.map((faq, index) => (
        <Accordion key={index} sx={{ mb: 1 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`panel${index}-content`}
            id={`panel${index}-header`}
          >
            <Typography variant="subtitle1" fontWeight="medium">{faq.question}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1">{faq.answer}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Key Financial Metrics Explained
      </Typography>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Cap Rate</Typography>
        <Typography variant="body1">
          Cap Rate = Net Operating Income / Property Value × 100%
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          A measure of a property's potential return regardless of financing. Higher cap rates generally indicate 
          higher potential returns but may come with higher risk.
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Cash on Cash Return</Typography>
        <Typography variant="body1">
          Cash on Cash Return = Annual Cash Flow / Total Cash Invested × 100%
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Measures the return specifically on the cash you've invested, factoring in financing. It tells you how efficiently 
          your actual invested capital is working for you.
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Debt Service Coverage Ratio (DSCR)</Typography>
        <Typography variant="body1">
          DSCR = Net Operating Income / Annual Debt Service
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Measures a property's ability to cover its debt payments. A DSCR of 1.0 means the property generates just enough 
          income to cover its debt obligations. Lenders typically look for a DSCR of 1.25 or higher.
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Internal Rate of Return (IRR)</Typography>
        <Typography variant="body1">
          The discount rate that makes the net present value of all cash flows equal to zero.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          A comprehensive metric that accounts for the time value of money across all cash flows, including the initial investment, 
          ongoing cash flows, and eventual sale. Generally, a higher IRR indicates a more attractive investment.
        </Typography>
      </Paper>
    </Box>
  );
};

export default HelpPage; 