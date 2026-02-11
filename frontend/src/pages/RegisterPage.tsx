import React, { useEffect } from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import { analytics } from '../utils/analytics';

const RegisterPage: React.FC = () => {
  // Track page view on mount
  useEffect(() => {
    analytics.trackPageView('register');
  }, []);

  return <RegisterForm />;
};

export default RegisterPage;