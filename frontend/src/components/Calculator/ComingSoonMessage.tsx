/**
 * Coming Soon Message Component
 *
 * Placeholder for future calculator strategies (Multi-Family, House Hacking)
 * Follows Apple UX principle: don't show disabled tabs, show coming soon instead
 */

import React from 'react';
import { Box, Paper, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

interface ComingSoonMessageProps {
  strategyName: string;
  description: string;
  expectedLaunch?: string;
}

export const ComingSoonMessage: React.FC<ComingSoonMessageProps> = ({
  strategyName,
  description,
  expectedLaunch = 'Q2 2026',
}) => {
  const navigate = useNavigate();

  const handleNotifyMe = () => {
    // TODO: Implement email notification signup
    console.log('User wants to be notified about', strategyName);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 4,
        textAlign: 'center',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={3} alignItems="center">
        {/* Icon */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'primary.50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RocketLaunchIcon sx={{ fontSize: 48, color: 'primary.main' }} />
        </Box>

        {/* Headline */}
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            {strategyName} Calculator
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 500 }}>
            Coming {expectedLaunch}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            {description}
          </Typography>
        </Box>

        {/* Current Options */}
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, width: '100%', maxWidth: 400 }}>
          <Typography variant="subtitle2" gutterBottom>
            Available Now:
          </Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography variant="body2">✅ BRRRR Strategy Calculator</Typography>
            <Typography variant="body2">✅ Buy & Hold Calculator</Typography>
          </Stack>
        </Box>

        {/* CTA Buttons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%', maxWidth: 400 }}>
          <Button
            variant="outlined"
            size="large"
            fullWidth
            startIcon={<NotificationsActiveIcon />}
            onClick={handleNotifyMe}
          >
            Notify Me at Launch
          </Button>
        </Stack>

        {/* Additional Info */}
        <Typography variant="caption" color="text.secondary">
          Want early access? Create a free account to get beta invites.
        </Typography>
      </Stack>
    </Paper>
  );
};
