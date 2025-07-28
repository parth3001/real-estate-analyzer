import React from 'react';
import { Alert, Box, Typography, IconButton, Collapse } from '@mui/material';
import { 
  Info, 
  TrendingUp, 
  Assessment, 
  School,
  Close,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { useEducationalContent, useDualMode } from '../../contexts/DualModeContext';

interface NoviceGuidanceProps {
  section: 'input' | 'results' | 'metrics' | 'analysis';
  dismissible?: boolean;
}

const guidanceContent = {
  input: {
    icon: School,
    title: "Getting Started with Property Analysis",
    content: "Enter your property details to get a comprehensive investment analysis. Don't worry if you're not sure about some values - we'll provide smart defaults and explanations to help guide you.",
    tips: [
      "Start with the Property Wizard for guided input",
      "Use our suggested defaults for values you're unsure about",
      "Click the help icons (?) for explanations of any term",
      "Focus on accuracy for purchase price, rent, and major expenses"
    ]
  },
  results: {
    icon: TrendingUp,
    title: "Understanding Your Investment Analysis",
    content: "Your analysis results show whether this property could be a profitable investment. Green metrics indicate positive performance, yellow suggests areas to watch, and red highlights potential concerns.",
    tips: [
      "Look for positive monthly cash flow first",
      "Cap Rate shows your annual return on investment",
      "Cash-on-Cash Return measures return on your actual cash invested",
      "Pay attention to any risk alerts highlighted by our AI"
    ]
  },
  metrics: {
    icon: Assessment,
    title: "Key Investment Metrics Explained",
    content: "These metrics help you understand the financial performance of your investment. Focus on the most important ones first, then dive deeper as you learn.",
    tips: [
      "Monthly Cash Flow: Profit/loss each month after all expenses",
      "Cap Rate: Annual return as percentage of property value",
      "Cash-on-Cash Return: Annual return on your initial cash investment",
      "Total ROI: Overall return including appreciation and tax benefits"
    ]
  },
  analysis: {
    icon: Info,
    title: "AI-Powered Investment Insights",
    content: "Our AI analyzes your property against market data and investment best practices to provide personalized recommendations and identify potential opportunities or risks.",
    tips: [
      "Review the AI's key findings and recommendations",
      "Check for market intelligence about your area",
      "Look for suggested improvements or value-add opportunities",
      "Pay attention to risk factors and mitigation strategies"
    ]
  }
};

export const NoviceGuidance: React.FC<NoviceGuidanceProps> = ({ 
  section, 
  dismissible = true 
}) => {
  const { shouldShowGuidance } = useEducationalContent();
  const { mode } = useDualMode();
  const [dismissed, setDismissed] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  // Only show in novice mode
  if (mode !== 'novice' || !shouldShowGuidance || dismissed) {
    return null;
  }

  const guidance = guidanceContent[section];
  const IconComponent = guidance.icon;

  return (
    <Alert 
      icon={<IconComponent sx={{ fontSize: 20 }} />}
      severity="info" 
      sx={{ 
        mb: 3,
        backgroundColor: 'rgba(25, 118, 210, 0.04)',
        border: '1px solid rgba(25, 118, 210, 0.12)',
        borderRadius: 2,
        '& .MuiAlert-icon': {
          color: 'primary.main',
          mt: 0.5
        },
        '& .MuiAlert-message': {
          width: '100%'
        }
      }}
      action={
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          {guidance.tips && (
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ 
                color: 'primary.main',
                p: 0.5,
                mt: 0.25
              }}
              aria-label={expanded ? "Hide tips" : "Show tips"}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
          {dismissible && (
            <IconButton
              size="small"
              onClick={() => setDismissed(true)}
              sx={{ 
                color: 'primary.main',
                p: 0.5,
                mt: 0.25
              }}
              aria-label="Dismiss guidance"
            >
              <Close />
            </IconButton>
          )}
        </Box>
      }
    >
      <Box>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 'bold', 
            mb: 1,
            color: 'primary.main'
          }}
        >
          {guidance.title}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.primary',
            lineHeight: 1.5
          }}
        >
          {guidance.content}
        </Typography>
        
        {guidance.tips && (
          <Collapse in={expanded}>
            <Box sx={{ mt: 2 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 'bold',
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}
              >
                💡 Quick Tips
              </Typography>
              <Box component="ul" sx={{ 
                mt: 1, 
                pl: 2, 
                mb: 0,
                '& li': {
                  fontSize: '13px',
                  lineHeight: 1.4,
                  color: 'text.secondary',
                  mb: 0.5
                }
              }}>
                {guidance.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </Box>
            </Box>
          </Collapse>
        )}
      </Box>
    </Alert>
  );
};

// Convenience component for quick guidance cards
export const QuickTip: React.FC<{
  title: string;
  description: string;
  icon?: React.ElementType;
}> = ({ title, description, icon: IconComponent = Info }) => {
  const { shouldShowGuidance } = useEducationalContent();

  if (!shouldShowGuidance) return null;

  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: 'primary.50',
        border: '1px solid',
        borderColor: 'primary.100',
        borderRadius: 1,
        mb: 2,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5
      }}
    >
      <IconComponent 
        sx={{ 
          fontSize: 18, 
          color: 'primary.main',
          mt: 0.25,
          flexShrink: 0
        }} 
      />
      <Box>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600,
            color: 'primary.main',
            mb: 0.5
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'text.secondary',
            fontSize: '12px',
            lineHeight: 1.4
          }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  );
};