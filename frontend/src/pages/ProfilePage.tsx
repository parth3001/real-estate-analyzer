import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Divider,
  Avatar,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../contexts/AuthContext';
import type { ProfileUpdateData } from '../types/auth';

const ProfilePage: React.FC = () => {
  const { user, updateProfile, error, isLoading, clearError } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdateData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  const handleEdit = () => {
    setIsEditing(true);
    clearError();
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    });
    clearError();
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (err) {
      // Error handled by auth context
    }
  };

  const handleChange = (field: keyof ProfileUpdateData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const getUserInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.main',
              fontSize: '2rem',
              mr: 3
            }}
          >
            {getUserInitials(user.firstName, user.lastName)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              My Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your account information
            </Typography>
          </Box>
          {!isEditing && (
            <IconButton onClick={handleEdit} color="primary">
              <EditIcon />
            </IconButton>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              disabled={!isEditing}
              variant={isEditing ? 'outlined' : 'filled'}
            />
            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              disabled={!isEditing}
              variant={isEditing ? 'outlined' : 'filled'}
            />
          </Box>

          <TextField
            fullWidth
            label="Email Address"
            value={formData.email}
            onChange={handleChange('email')}
            disabled={!isEditing}
            variant={isEditing ? 'outlined' : 'filled'}
            type="email"
          />

          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Role
                </Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {user.role}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Account Status
                </Typography>
                <Typography variant="body1" color={user.isVerified ? 'success.main' : 'warning.main'}>
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Member Since
                </Typography>
                <Typography variant="body1">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last Login
                </Typography>
                <Typography variant="body1">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {isEditing && (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                startIcon={<CancelIcon />}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isLoading}
                startIcon={<SaveIcon />}
              >
                Save Changes
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfilePage;