// Apple-Style Input Component
// Rounded input fields with focus states

import React from 'react';
import { TextField, Box, Typography } from '@mui/material';

interface AppleInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  error?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const AppleInput: React.FC<AppleInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  required = false,
  disabled = false,
  fullWidth = true,
  multiline = false,
  rows = 4,
  startIcon,
  endIcon
}) => {
  return (
    <Box width={fullWidth ? '100%' : 'auto'}>
      {label && (
        <Typography 
          variant="body2" 
          fontWeight={600}
          color="text.primary"
          sx={{ mb: 1, fontSize: '14px' }}
        >
          {label}
          {required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
        </Typography>
      )}
      
      <TextField
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={!!error}
        helperText={error}
        disabled={disabled}
        fullWidth={fullWidth}
        multiline={multiline}
        rows={multiline ? rows : undefined}
        InputProps={{
          startAdornment: startIcon,
          endAdornment: endIcon
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'background.paper',
            fontSize: '16px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            
            '& fieldset': {
              borderColor: 'grey.200',
              borderWidth: '1px'
            },
            
            '&:hover fieldset': {
              borderColor: 'primary.300',
              borderWidth: '1px'
            },
            
            '&.Mui-focused fieldset': {
              borderColor: 'primary.500',
              borderWidth: '2px',
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
            },
            
            '&.Mui-error fieldset': {
              borderColor: 'error.500'
            }
          },
          
          '& .MuiInputBase-input': {
            padding: '14px 16px',
            fontSize: '16px',
            
            '&::placeholder': {
              color: 'grey.400',
              opacity: 1
            }
          }
        }}
      />
    </Box>
  );
};

export default AppleInput;