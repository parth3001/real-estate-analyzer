import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalculateIcon from '@mui/icons-material/Calculate';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LoginIcon from '@mui/icons-material/Login';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SaveIcon from '@mui/icons-material/Save';
import { useAuth } from '../contexts/AuthContext';
import { fetchAnalyticsSummary } from '../services/analyticsApi';
import type { AnalyticsSummary, AnalyticsTimePeriod } from '../types/analytics';

const AdminAnalytics: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<AnalyticsTimePeriod>(7);
  const [environment, setEnvironment] = useState<'all' | 'production' | 'development'>('production');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [timePeriod, environment]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAnalyticsSummary(
        timePeriod,
        environment === 'all' ? undefined : environment
      );
      setSummary(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleTimePeriodChange = (_event: React.MouseEvent<HTMLElement>, newPeriod: AnalyticsTimePeriod | null) => {
    if (newPeriod !== null) {
      setTimePeriod(newPeriod);
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AssessmentIcon color="primary" sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Platform Analytics
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Track core metrics and platform usage
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Time Period Toggle */}
            <ToggleButtonGroup
              value={timePeriod}
              exclusive
              onChange={handleTimePeriodChange}
              aria-label="time period"
            >
              <ToggleButton value={7} aria-label="7 days">
                Last 7 days
              </ToggleButton>
              <ToggleButton value={30} aria-label="30 days">
                Last 30 days
              </ToggleButton>
              <ToggleButton value={90} aria-label="90 days">
                Last 90 days
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Environment Toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Environment:
              </Typography>
              <ToggleButtonGroup
                value={environment}
                exclusive
                onChange={(e, newEnv) => {
                  if (newEnv !== null) {
                    setEnvironment(newEnv);
                  }
                }}
                size="small"
                sx={{ height: 32 }}
              >
                <ToggleButton value="production" sx={{ px: 2 }}>
                  Production
                  <Chip
                    label="Live"
                    size="small"
                    color="success"
                    sx={{ ml: 1, height: 18, fontSize: '0.7rem' }}
                  />
                </ToggleButton>
                <ToggleButton value="development" sx={{ px: 2 }}>
                  Local
                  <Chip
                    label="Test"
                    size="small"
                    color="warning"
                    sx={{ ml: 1, height: 18, fontSize: '0.7rem' }}
                  />
                </ToggleButton>
                <ToggleButton value="all" sx={{ px: 2 }}>
                  All
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Analytics Cards */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : summary ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {/* Calculator Submissions */}
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalculateIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h2">
                    Calculator Submissions
                  </Typography>
                </Box>
                <Typography variant="h3" component="p" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {summary.calculatorSubmissions.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Single-page calculator
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Wizard Submissions */}
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AutoAwesomeIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h2">
                    Wizard Submissions
                  </Typography>
                </Box>
                <Typography variant="h3" component="p" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                  {summary.wizardSubmissions.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  4-step guided analysis
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* User Registrations */}
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonAddIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h2">
                    New Registrations
                  </Typography>
                </Box>
                <Typography variant="h3" component="p" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {summary.userRegistrations.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  New user accounts created
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* User Logins */}
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LoginIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h2">
                    User Logins
                  </Typography>
                </Box>
                <Typography variant="h3" component="p" sx={{ fontWeight: 700, color: 'info.main' }}>
                  {summary.userLogins.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Total login sessions
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Deals Analyzed */}
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AssessmentIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h2">
                    Deals Analyzed
                  </Typography>
                </Box>
                <Typography variant="h3" component="p" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {summary.dealsAnalyzed.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  By logged-in users
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Deals Saved */}
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SaveIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h2">
                    Deals Saved
                  </Typography>
                </Box>
                <Typography variant="h3" component="p" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                  {summary.dealsSaved.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Saved to database
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Conversion Rate */}
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h2">
                    Conversion Rate
                  </Typography>
                </Box>
                <Typography variant="h3" component="p" sx={{ fontWeight: 700 }}>
                  {summary.calculatorSubmissions > 0
                    ? ((summary.userRegistrations / summary.calculatorSubmissions) * 100).toFixed(1)
                    : '0.0'}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Calculator → Registration
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      ) : (
        <Alert severity="info">
          No analytics data available for the selected period.
        </Alert>
      )}

      {/* Period Info */}
      {summary && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Data from {new Date(summary.period.start).toLocaleDateString()} to{' '}
            {new Date(summary.period.end).toLocaleDateString()}
          </Typography>

          {/* Environment Indicator */}
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Showing data from:
            </Typography>
            <Chip
              label={
                summary.environment === 'all'
                  ? 'All Environments'
                  : summary.environment === 'production'
                  ? 'Production Only'
                  : 'Local Development Only'
              }
              size="small"
              color={
                summary.environment === 'production' ? 'success' :
                summary.environment === 'development' ? 'warning' :
                'default'
              }
              variant="outlined"
            />
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default AdminAnalytics;
