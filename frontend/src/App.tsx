import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { appleTheme } from './theme/appleTheme';
import AppleNavigation from './components/layout/AppleNavigation';

// Import global Apple styles
import './styles/appleGlobal.css';

// Authentication
import { AuthProvider } from './contexts/AuthContext';
import { PersonaProvider } from './contexts/PersonaContext';
import { DualModeProvider } from './contexts/DualModeContext';
import ProtectedRoute, { GuestRoute } from './components/auth/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import SFRAnalysis from './pages/SFRAnalysis';
import MFAnalysis from './pages/MFAnalysis';
import SavedProperties from './pages/SavedProperties';
import HelpPage from './pages/HelpPage';
import ContactPage from './pages/ContactPage';
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

// Portfolio Components
import PortfolioDashboard from './pages/PortfolioDashboard';
import { ApplePortfolioWizard } from './components/Portfolio/ApplePortfolioWizard';

// Pipeline Components
import PipelinePage from './pages/PipelinePage';

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={appleTheme}>
        <CssBaseline />
        <BrowserRouter>
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

              {/* Protected Routes (authentication required) */}
              <Route 
                element={
                  <ProtectedRoute>
                    <AppleNavigation />
                  </ProtectedRoute>
                }
              >
                {/* Main Dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
                <Route path="/help" element={<HelpPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/census-test" element={<CensusDataTestPage />} />
                
                {/* User Management */}
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin/users" element={<AdminUserManagement />} />
                
                {/* Catch all for protected routes */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
              
              {/* Public Routes */}
              <Route path="*" element={<NotFound />} />
                </Routes>
              </DualModeProvider>
            </PersonaProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
