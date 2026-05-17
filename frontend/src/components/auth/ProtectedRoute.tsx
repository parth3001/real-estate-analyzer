import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  roles?: Array<'user' | 'admin'>;
  fallback?: React.ReactNode;
}

/**
 * ProtectedRoute component that handles authentication and authorization
 * 
 * @param children - The components to render if access is granted
 * @param requireAuth - Whether authentication is required (default: true)
 * @param redirectTo - Where to redirect if access is denied (default: '/login')
 * @param roles - Required user roles for access
 * @param fallback - Component to show while loading
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/login',
  roles,
  fallback,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while auth is being initialized
  if (isLoading) {
    return (
      fallback || (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: 2,
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body1" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      )
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // If specific roles are required, check user's role
  if (roles && roles.length > 0 && user) {
    const hasRequiredRole = roles.includes(user.role);
    
    if (!hasRequiredRole) {
      // User doesn't have required role - redirect to unauthorized page or dashboard
      return (
        <Navigate 
          to="/unauthorized" 
          state={{ from: location.pathname, requiredRoles: roles }} 
          replace 
        />
      );
    }
  }

  // If authentication is not required (public route)
  if (!requireAuth) {
    return <>{children}</>;
  }

  // All checks passed - render children
  return <>{children}</>;
};

/**
 * Higher-order component for creating protected routes
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) => {
  return (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

/**
 * Component for admin-only routes
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute roles={['admin']} redirectTo="/unauthorized">
    {children}
  </ProtectedRoute>
);

/**
 * Component for user routes (both user and admin can access)
 */
export const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute roles={['user', 'admin']}>
    {children}
  </ProtectedRoute>
);

/**
 * Component for public routes (no authentication required)
 */
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={false}>
    {children}
  </ProtectedRoute>
);

/**
 * Component for guest routes (redirect to /app if already authenticated).
 * Phase 3+4 — /app replaced /dashboard as the post-login home.
 */
export const GuestRoute: React.FC<{
  children: React.ReactNode;
  redirectTo?: string;
}> = ({ children, redirectTo = '/app' }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Not authenticated - show guest content
  return <>{children}</>;
};

export default ProtectedRoute;