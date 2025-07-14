import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Divider,
  Switch,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaletteIcon from '@mui/icons-material/Palette';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../contexts/AuthContext';
import type { PasswordChangeData } from '../types/auth';

const SettingsPage: React.FC = () => {
  const { user, changePassword, error, isLoading, clearError } = useAuth();
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
  });
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Notification preferences (mock for now)
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    analysisComplete: true,
    marketAlerts: false,
    weeklyReports: true,
  });

  // Theme preferences (mock for now)
  const [preferences, setPreferences] = useState({
    darkMode: false,
    compactView: false,
    autoSave: true,
  });

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== confirmNewPassword) {
      // Handle password mismatch
      return;
    }

    try {
      await changePassword(passwordData);
      setPasswordData({ currentPassword: '', newPassword: '' });
      setConfirmNewPassword('');
      setShowPasswordSection(false);
    } catch (err) {
      // Error handled by auth context
    }
  };

  const handleNotificationChange = (key: keyof typeof notifications) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNotifications(prev => ({ ...prev, [key]: event.target.checked }));
  };

  const handlePreferenceChange = (key: keyof typeof preferences) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPreferences(prev => ({ ...prev, [key]: event.target.checked }));
  };

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings and preferences
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Security Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SecurityIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Security</Typography>
          </Box>
          
          <List>
            <ListItem>
              <ListItemText
                primary="Change Password"
                secondary="Update your account password"
              />
              <ListItemSecondaryAction>
                <Button
                  variant={showPasswordSection ? 'outlined' : 'contained'}
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                >
                  {showPasswordSection ? 'Cancel' : 'Change'}
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          </List>

          {showPasswordSection && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  helperText="Must be at least 8 characters with uppercase, lowercase, and number"
                />
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  error={confirmNewPassword !== '' && passwordData.newPassword !== confirmNewPassword}
                  helperText={confirmNewPassword !== '' && passwordData.newPassword !== confirmNewPassword ? 'Passwords do not match' : ''}
                />
                <Button
                  variant="contained"
                  onClick={handlePasswordChange}
                  disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== confirmNewPassword}
                >
                  Update Password
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <NotificationsIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Notifications</Typography>
          </Box>
          
          <List>
            <ListItem>
              <ListItemText
                primary="Email Updates"
                secondary="Receive general updates and announcements"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={notifications.emailUpdates}
                  onChange={handleNotificationChange('emailUpdates')}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Analysis Complete"
                secondary="Get notified when property analysis is finished"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={notifications.analysisComplete}
                  onChange={handleNotificationChange('analysisComplete')}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Market Alerts"
                secondary="Receive alerts about market changes"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={notifications.marketAlerts}
                  onChange={handleNotificationChange('marketAlerts')}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Weekly Reports"
                secondary="Get weekly portfolio performance reports"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={notifications.weeklyReports}
                  onChange={handleNotificationChange('weeklyReports')}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PaletteIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Display Preferences</Typography>
          </Box>
          
          <List>
            <ListItem>
              <ListItemText
                primary="Dark Mode"
                secondary="Use dark theme (coming soon)"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={preferences.darkMode}
                  onChange={handlePreferenceChange('darkMode')}
                  disabled
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Compact View"
                secondary="Show more content in less space"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={preferences.compactView}
                  onChange={handlePreferenceChange('compactView')}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Auto-save"
                secondary="Automatically save your analysis progress"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={preferences.autoSave}
                  onChange={handlePreferenceChange('autoSave')}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Account Danger Zone */}
      {user.role !== 'admin' && (
        <Card sx={{ border: '1px solid', borderColor: 'error.main' }}>
          <CardContent>
            <Typography variant="h6" color="error" gutterBottom>
              Danger Zone
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              These actions cannot be undone. Please proceed with caution.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              sx={{ mt: 2 }}
              disabled
            >
              Delete Account (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default SettingsPage;