import { ReactNode } from 'react';
import { AlertColor } from '@mui/material';

// Common component props
export interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

// State interfaces
export interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

// Form interfaces
export interface FormFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  type?: 'text' | 'number' | 'email';
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// Error states
export interface ErrorState {
  hasError: boolean;
  message?: string;
} 