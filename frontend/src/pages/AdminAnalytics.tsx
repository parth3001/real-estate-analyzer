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
  ButtonGroup,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { subDays, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalculateIcon from '@mui/icons-material/Calculate';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LoginIcon from '@mui/icons-material/Login';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SaveIcon from '@mui/icons-material/Save';
import { useAuth } from '../contexts/AuthContext';
import { fetchAnalyticsSummary } from '../services/analyticsApi';
import type { AnalyticsSummary } from '../types/analytics';

const AdminAnalytics: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(startOfDay(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfDay(new Date()));
  const [environment, setEnvironment] = useState<'all' | 'production' | 'development'>('production');
  const [refreshing, setRefreshing] = useState(false);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, environment]);

  const fetchData = async () => {
    // Validate date range before fetching
    const daysDiff = differenceInDays(endDate, startDate);

    if (daysDiff < 0) {
      setDateRangeError('End date must be after start date');
      return;
    }

    if (daysDiff > 365) {
      setDateRangeError('Date range cannot exceed 365 days');
      return;
    }

    setDateRangeError(null);

    try {
      setLoading(true);
      setError(null);
      const response = await fetchAnalyticsSummary(
        startDate,
        endDate,
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

  const handleQuickSelect = (type: 'today' | 'yesterday' | 'last7' | 'last30') => {
    const today = new Date();

    switch (type) {
      case 'today':
        setStartDate(startOfDay(today));
        setEndDate(endOfDay(today));
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setStartDate(startOfDay(yesterday));
        setEndDate(endOfDay(yesterday));
        break;
      case 'last7':
        setStartDate(startOfDay(subDays(today, 6)));
        setEndDate(endOfDay(today));
        break;
      case 'last30':
        setStartDate(startOfDay(subDays(today, 29)));
        setEndDate(endOfDay(today));
        break;
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

      {dateRangeError && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setDateRangeError(null)}>
          {dateRangeError}
        </Alert>
      )}

      {/* Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Quick Select Buttons */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Quick Select:
              </Typography>
              <ButtonGroup variant="outlined" size="small">
                <Button onClick={() => handleQuickSelect('today')}>Today</Button>
                <Button onClick={() => handleQuickSelect('yesterday')}>Yesterday</Button>
                <Button onClick={() => handleQuickSelect('last7')}>Last 7 days</Button>
                <Button onClick={() => handleQuickSelect('last30')}>Last 30 days</Button>
              </ButtonGroup>
            </Box>

            {/* Date Range Pickers */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newDate) => {
                  if (newDate) {
                    setStartDate(startOfDay(newDate));
                  }
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { minWidth: 200 }
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary">
                to
              </Typography>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newDate) => {
                  if (newDate) {
                    setEndDate(endOfDay(newDate));
                  }
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { minWidth: 200 }
                  }
                }}
              />
            </Box>

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

            {/* Refresh Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing || loading}
              >
                Refresh
              </Button>
            </Box>
          </Box>
        </LocalizationProvider>
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
