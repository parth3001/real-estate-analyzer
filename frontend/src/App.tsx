import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { appleTheme } from './theme/appleTheme';
import AppleNavigation from './components/layout/AppleNavigation';
import NewAppShell from './components/layout/NewAppShell';

// Import global Apple styles
import './styles/appleGlobal.css';

// Authentication
import { AuthProvider } from './contexts/AuthContext';
import { PersonaProvider } from './contexts/PersonaContext';
import { DualModeProvider } from './contexts/DualModeContext';
import ProtectedRoute, { GuestRoute } from './components/auth/ProtectedRoute';

// Affiliate Context
import { AffiliateProvider, useAffiliate } from './contexts/AffiliateContext';

// Auth Context
import { useAuth } from './contexts/AuthContext';

// Lazy load affiliate landing page (code splitting)
const AffiliateLandingPage = React.lazy(() => import('./pages/AffiliateLandingPage'));

// Pages
// Dashboard.tsx is no longer routed (Phase 3+4 — /dashboard Navigate-redirects
// to /app). File kept on disk for one migration cycle in case we need to
// resurrect any sub-component; safe to delete once Phase 6 ships.
import SFRAnalysis from './pages/SFRAnalysis';
import MFAnalysis from './pages/MFAnalysis';
import SavedProperties from './pages/SavedProperties';
import HelpPage from './pages/HelpPage';
import WhatsNewPage from './pages/WhatsNewPage';
import ContactPage from './pages/ContactPage';
import SampleAnalysisPage from './pages/SampleAnalysisPage';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import NotFound from './pages/NotFound';
import LoginPage from './pages/LoginPage';
import CheckEmailPage from './pages/CheckEmailPage';
import MagicLinkVerifyPage from './pages/MagicLinkVerifyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminAnalytics from './pages/AdminAnalytics';
import AnalysisDetails from './pages/AnalysisDetails';
import BlogListPage from './pages/BlogListPage';
import BlogPostPage from './pages/BlogPostPage';
import BRRRRCalculatorPage from './pages/BRRRRCalculatorPage';
import CapRateCalculatorPage from './pages/CapRateCalculatorPage';
import RentalPropertyCalculatorPage from './pages/RentalPropertyCalculatorPage';
import AppPage from './pages/AppPage';

// Portfolio Components
import PortfolioDashboard from './pages/PortfolioDashboard';
import { ApplePortfolioWizard } from './components/Portfolio/ApplePortfolioWizard';

// Pipeline Components
import PipelinePage from './pages/PipelinePage';

// Calculator Components (Public - No Auth Required)
import { UniversalCalculator } from './components/Calculator';

// Analysis Details Component is now imported from pages

// Authentication Layout (for login/register pages)
const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: 'background.paper',
          borderRadius: '24px',
          padding: 4,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Conditional Home Route Selector (Affiliate vs Main Site)
const HomeRouteSelector: React.FC = () => {
  const { isAffiliateSite } = useAffiliate();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Phase 3+4 (2026-05-16) — post-login lands at /app (chat-first), not
  // /dashboard. Old /dashboard route Navigate-redirects to /app for any
  // bookmarked links during the migration window.
  React.useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  // If logged in, show nothing while redirecting
  if (user) {
    return <Box sx={{ p: 4, textAlign: 'center' }}>Redirecting...</Box>;
  }

  // Not logged in - show affiliate landing or calculator landing page
  if (isAffiliateSite) {
    return (
      <React.Suspense fallback={<Box sx={{ p: 4, textAlign: 'center' }}>Loading...</Box>}>
        <AffiliateLandingPage />
      </React.Suspense>
    );
  }

  return <LandingPage />;
};

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={appleTheme}>
          <CssBaseline />
          <BrowserRouter>
            <AffiliateProvider>
              <AuthProvider>
                <PersonaProvider>
                  <DualModeProvider>
                    <Routes>
              {/* Guest Routes (no authentication required) */}
              <Route 
                path="/login" 
                element={
                  <GuestRoute>
                    <AuthLayout>
                      <LoginPage />
                    </AuthLayout>
                  </GuestRoute>
                } 
              />
              <Route
                path="/auth/check-email"
                element={
                  <GuestRoute>
                    <CheckEmailPage />
                  </GuestRoute>
                }
              />
              <Route
                path="/auth/verify"
                element={<MagicLinkVerifyPage />}
              />
              {/* Legacy auth routes — magic-link replaces them. Redirect to /login. */}
              <Route path="/register" element={<Navigate to="/login" replace />} />
              <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
              <Route path="/reset-password" element={<Navigate to="/login" replace />} />
              <Route path="/verify-email" element={<Navigate to="/login" replace />} />
              <Route
                path="/terms"
                element={
                  <GuestRoute>
                    <TermsOfServicePage />
                  </GuestRoute>
                }
              />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />

              {/* Public Routes - No login required */}
              <Route path="/" element={<HomeRouteSelector />} />
              <Route path="/sample-analysis" element={<SampleAnalysisPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/whats-new" element={<WhatsNewPage />} />

              {/* Public Calculator Routes - No authentication required */}
              <Route path="/calculator" element={<UniversalCalculator />} />
              <Route path="/calculator/brrrr" element={<UniversalCalculator />} />
              <Route path="/calculator/buy-hold" element={<UniversalCalculator />} />
              <Route path="/brrrr-calculator" element={<BRRRRCalculatorPage />} />
              <Route path="/cap-rate-calculator" element={<CapRateCalculatorPage />} />
              <Route path="/rental-property-calculator" element={<RentalPropertyCalculatorPage />} />

              {/* W6-S2 — Standalone chat surface (public; auth gating in W6-S5) */}
              <Route path="/app" element={<AppPage />} />

              {/* Blog Routes - Public, No Auth Required */}
              <Route path="/blog" element={<BlogListPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />

              {/* Protected Routes — NEW SHELL (Phase 4, Issue #108).
                  Portfolio / Pipeline / Saved properties / Settings /
                  Profile / Analysis-details all render INSIDE the new
                  AppLayout sidebar shell, matching the chat-first IA
                  visible on /app. Clicking sidebar nav swaps the main
                  pane content without changing chrome — kills the "two
                  different apps" inconsistency users hit before. */}
              <Route
                element={
                  <ProtectedRoute>
                    <NewAppShell />
                  </ProtectedRoute>
                }
              >
                {/* Phase 3+4 — /dashboard 301-redirects to /app for the
                    migration window. */}
                <Route path="/dashboard" element={<Navigate to="/app" replace />} />

                {/* Property Management — saved deals + their detail view */}
                <Route path="/saved-properties" element={<SavedProperties />} />
                <Route path="/analysis/:id" element={<AnalysisDetails />} />

                {/* Portfolio Routes */}
                <Route path="/portfolio" element={<PortfolioDashboard />} />
                <Route path="/portfolio/create" element={
                  <Box sx={{ p: 3 }}>
                    <ApplePortfolioWizard />
                  </Box>
                } />
                <Route path="/portfolio/:id" element={<PortfolioDashboard />} />
                <Route path="/portfolio/:id/edit" element={
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h4">Edit Portfolio</Typography>
                    <Typography variant="body1">Portfolio editing will be implemented here</Typography>
                  </Box>
                } />

                {/* Pipeline Routes */}
                <Route path="/pipeline" element={<PipelinePage />} />

                {/* User Management — Settings/Profile sit alongside the
                    chat-first nav (Settings is in the AppLayout sidebar) */}
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* Protected Routes — LEGACY SHELL (AppleNavigation).
                  Routes that haven't migrated to the new IA yet. Per
                  Issue #100, the wizard (/sfr-analysis, /mf-analysis)
                  stays accessible but unlinked from the new sidebar.
                  Admin pages live here until they get their own
                  dedicated admin shell. */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppleNavigation />
                  </ProtectedRoute>
                }
              >
                {/* Property Analysis Routes (legacy wizard) */}
                <Route path="/sfr-analysis" element={<SFRAnalysis />} />
                <Route path="/sfr-analysis/:mode" element={<SFRAnalysis />} />
                <Route path="/mf-analysis" element={<MFAnalysis />} />

                {/* Contact (under auth gate for now) */}
                <Route path="/contact" element={<ContactPage />} />

                {/* Admin */}
                <Route path="/admin/users" element={<AdminUserManagement />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
              </Route>

              {/* Catch all - 404 Not Found */}
              <Route path="*" element={<NotFound />} />
                    </Routes>
                  </DualModeProvider>
                </PersonaProvider>
              </AuthProvider>
            </AffiliateProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
