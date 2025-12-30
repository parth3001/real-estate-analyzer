/**
 * Error Boundary Component
 *
 * Catches React rendering errors and displays fallback UI instead of crashing.
 * Used to isolate tab components so errors don't break the entire application.
 *
 * NOTE: Must be a class component - React does not support
 * error boundaries as functional components (as of React 19).
 *
 * See: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 *
 * @author FSE from CLAUDE.md
 * @date December 22, 2025
 */

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console for debugging
    console.error('🚨🚨🚨 ERROR BOUNDARY CAUGHT AN ERROR 🚨🚨🚨');
    console.error('Error:', error);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('🚨🚨🚨 END ERROR BOUNDARY LOG 🚨🚨🚨');

    // TODO: Send to error logging service (Sentry, Datadog, etc.)
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
