import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from './theme';
import MainLayout from './components/layout/MainLayout';

// Authentication
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute, { GuestRoute } from './components/auth/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import SFRAnalysis from './pages/SFRAnalysis';
import MFAnalysis from './pages/MFAnalysis';
import SavedProperties from './pages/SavedProperties';
import HelpPage from './pages/HelpPage';
import NotFound from './pages/NotFound';
import CensusDataTestPage from './pages/CensusDataTestPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminUserManagement from './pages/AdminUserManagement';

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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Guest Routes (no authentication required) */}
              <Route 
                path="/login" 
                element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <GuestRoute>
                    <RegisterPage />
                  </GuestRoute>
                } 
              />
              
              {/* Protected Routes (authentication required) */}
              <Route 
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/sfr-analysis" element={<SFRAnalysis />} />
                <Route path="/mf-analysis" element={<MFAnalysis />} />
                <Route path="/saved-properties" element={<SavedProperties />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/census-test" element={<CensusDataTestPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin/users" element={<AdminUserManagement />} />
              </Route>
              
              {/* Public Routes */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
