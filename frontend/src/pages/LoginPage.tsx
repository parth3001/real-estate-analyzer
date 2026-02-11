import React, { useEffect } from 'react';
import LoginForm from '../components/auth/LoginForm';
import { analytics } from '../utils/analytics';

const LoginPage: React.FC = () => {
  // Track page view on mount
  useEffect(() => {
    analytics.trackPageView('login');
  }, []);

  return <LoginForm />;
};

export default LoginPage;