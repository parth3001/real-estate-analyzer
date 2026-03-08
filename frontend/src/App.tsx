import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { appleTheme } from './theme/appleTheme';
import AppleNavigation from './components/layout/AppleNavigation';

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
import Dashboard from './pages/Dashboard';
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
import CensusDataTestPage from './pages/CensusDataTestPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PasswordResetPage from './pages/PasswordResetPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminUserManagement from './pages/AdminUserManagement';
import MarketDataPage from './pages/MarketDataPage';
import AnalysisDetails from './pages/AnalysisDetails';
import BlogListPage from './pages/BlogListPage';
import BlogPostPage from './pages/BlogPostPage';
import BRRRRCalculatorPage from './pages/BRRRRCalculatorPage';
import CapRateCalculatorPage from './pages/CapRateCalculatorPage';
import RentalPropertyCalculatorPage from './pages/RentalPropertyCalculatorPage';

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

  // Redirect logged-in users to dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
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
                path="/register"
                element={
                  <GuestRoute>
                    <AuthLayout>
                      <RegisterPage />
                    </AuthLayout>
                  </GuestRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <GuestRoute>
                    <ForgotPasswordPage />
                  </GuestRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <GuestRoute>
                    <PasswordResetPage />
                  </GuestRoute>
                }
              />
              <Route
                path="/verify-email"
                element={
                  <GuestRoute>
                    <EmailVerificationPage />
                  </GuestRoute>
                }
              />
              <Route
                path="/terms"
                element={
                  <GuestRoute>
                    <TermsOfServicePage />
                  </GuestRoute>
                }
              />

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

              {/* Blog Routes - Public, No Auth Required */}
              <Route path="/blog" element={<BlogListPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />

              {/* Protected Routes (authentication required) */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppleNavigation />
                  </ProtectedRoute>
                }
              >
                {/* Main Dashboard */}
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Property Analysis Routes */}
                <Route path="/sfr-analysis" element={<SFRAnalysis />} />
                <Route path="/sfr-analysis/:mode" element={<SFRAnalysis />} />
                <Route path="/mf-analysis" element={<MFAnalysis />} />
                
                {/* Property Management */}
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
                
                {/* Market & Tools */}
                <Route path="/market-data" element={<MarketDataPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/census-test" element={<CensusDataTestPage />} />
                
                {/* User Management */}
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin/users" element={<AdminUserManagement />} />
                
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
