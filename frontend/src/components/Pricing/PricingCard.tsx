import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { appleColors, appleShadows, appleBorderRadius } from '../../theme/appleDesignSystem';

interface PricingCardProps {
  tier: 'beta' | 'post-launch';
  title: string;
  price: string;
  priceUnit: string;
  badge?: string;
  features: string[];
  ctaLabel: string;
  ctaAction: () => void;
  isPrimary?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  tier,
  title,
  price,
  priceUnit,
  badge,
  features,
  ctaLabel,
  ctaAction,
  isPrimary = false
}) => {
  const isBeta = tier === 'beta';

  // Beta card gets green treatment, post-launch gets neutral
  const cardStyles = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    border: isBeta
      ? `2px solid ${appleColors.green[500]}`
      : `1px solid ${appleColors.gray[200]}`,
    borderRadius: appleBorderRadius.xl,
    boxShadow: isBeta ? appleShadows.lg : appleShadows.md,
    transition: 'all 0.3s ease',
    position: 'relative',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: isBeta ? appleShadows.xl : appleShadows.lg
    }
  };

  const priceColor = isBeta ? appleColors.green[600] : appleColors.gray[900];
  const ctaStyles = isBeta
    ? {
        backgroundColor: appleColors.green[500],
        color: 'white',
        '&:hover': {
          backgroundColor: appleColors.green[600]
        }
      }
    : {
        variant: 'outlined' as const,
        borderColor: appleColors.primary[500],
        color: appleColors.primary[600],
        borderWidth: '2px',
        '&:hover': {
          backgroundColor: appleColors.primary[50],
          borderColor: appleColors.primary[600],
          borderWidth: '2px'
        }
      };

  return (
    <Card sx={cardStyles}>
      <CardContent sx={{ p: { xs: 3, md: 4 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Badge */}
        {badge && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <Chip
              label={badge}
              sx={{
                backgroundColor: isBeta ? appleColors.green[100] : appleColors.primary[100],
                color: isBeta ? appleColors.green[700] : appleColors.primary[700],
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
                height: '24px'
              }}
            />
          </Box>
        )}

        {/* Title */}
        <Typography
          variant="h4"
          sx={{
            textAlign: 'center',
            fontWeight: 600,
            color: appleColors.gray[900],
            mb: 3,
            fontSize: { xs: '1.5rem', md: '1.75rem' }
          }}
        >
          {title}
        </Typography>

        {/* Price */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h2"
            component="div"
            sx={{
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              fontWeight: 700,
              color: priceColor,
              lineHeight: 1,
              mb: 0.5
            }}
          >
            {price}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1rem', md: '1.125rem' },
              color: appleColors.gray[600],
              fontWeight: 400
            }}
          >
            {priceUnit}
          </Typography>
        </Box>

        {/* Features List */}
        <List sx={{ mb: 3, flex: 1 }}>
          {features.map((feature, index) => (
            <ListItem
              key={index}
              sx={{
                px: 0,
                py: 1,
                alignItems: 'flex-start'
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                <CheckCircleIcon
                  sx={{
                    color: isBeta ? appleColors.green[500] : appleColors.primary[500],
                    fontSize: '20px'
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={feature}
                primaryTypographyProps={{
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  color: appleColors.gray[700],
                  lineHeight: 1.5
                }}
              />
            </ListItem>
          ))}
        </List>

        {/* CTA Button */}
        <Button
          variant={isBeta ? 'contained' : 'outlined'}
          fullWidth
          onClick={ctaAction}
          sx={{
            py: { xs: 1.5, md: 2 },
            fontSize: { xs: '1rem', md: '1.125rem' },
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '12px',
            ...ctaStyles
          }}
        >
          {ctaLabel}
        </Button>

        {/* Fine Print (Beta only) */}
        {isBeta && (
          <Typography
            variant="caption"
            sx={{
              textAlign: 'center',
              color: appleColors.gray[500],
              fontSize: '0.75rem',
              mt: 2,
              lineHeight: 1.4
            }}
          >
            Join now and lock in $0/month forever. Same features, zero cost.
            No credit card required.
          </Typography>
        )}

        {/* Fine Print (Post-launch) */}
        {!isBeta && (
          <Typography
            variant="caption"
            sx={{
              textAlign: 'center',
              color: appleColors.gray[500],
              fontSize: '0.75rem',
              mt: 2,
              lineHeight: 1.4
            }}
          >
            Same features as Beta. New users after Q2 2026 pay $14.99/month.
            Join beta to lock in free access.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingCard;
