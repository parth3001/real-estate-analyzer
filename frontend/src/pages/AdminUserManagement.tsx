import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import type { User } from '../types/auth';

interface UserWithStats extends User {
  totalDeals?: number;
  lastActivityAt?: string;
}

const AdminUserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: (() => void) | null;
  }>({ open: false, title: '', message: '', action: null });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: UserWithStats) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const action = async () => {
      try {
        await api.put(`/admin/users/${userId}/role`, { role: newRole });
        await fetchUsers();
        handleMenuClose();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to update user role');
      }
    };

    setConfirmDialog({
      open: true,
      title: `${currentRole === 'admin' ? 'Remove' : 'Grant'} Admin Access`,
      message: `Are you sure you want to ${currentRole === 'admin' ? 'remove admin access from' : 'grant admin access to'} this user?`,
      action,
    });
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const action = async () => {
      try {
        await api.put(`/admin/users/${userId}/status`, { isVerified: newStatus });
        await fetchUsers();
        handleMenuClose();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to update user status');
      }
    };

    setConfirmDialog({
      open: true,
      title: `${newStatus ? 'Verify' : 'Unverify'} User`,
      message: `Are you sure you want to ${newStatus ? 'verify' : 'unverify'} this user?`,
      action,
    });
  };

  const getUserInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ensure current user is not in the list or is clearly marked
  const sortedUsers = filteredUsers.sort((a, b) => {
    if (a.id === currentUser?.id) return -1;
    if (b.id === currentUser?.id) return 1;
    return a.email.localeCompare(b.email);
  });

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AdminPanelSettingsIcon color="primary" sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            User Management
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage user accounts, roles, and permissions
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {filteredUsers.length} users
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              disabled
            >
              Add User (Coming Soon)
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Properties</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Last Activity</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user.id} sx={{ backgroundColor: user.id === currentUser?.id ? 'action.hover' : 'inherit' }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: 'primary.main' 
                          }}
                        >
                          {getUserInitials(user.firstName, user.lastName)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {user.firstName} {user.lastName}
                            {user.id === currentUser?.id && (
                              <Chip label="You" size="small" color="primary" sx={{ ml: 1 }} />
                            )}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        color={user.role === 'admin' ? 'primary' : 'default'}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.isVerified ? 'Verified' : 'Unverified'} 
                        color={user.isVerified ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.totalDeals || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {user.id !== currentUser?.id && (
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, user)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* User Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedUser && (
          <>
            <MenuItem onClick={() => handleToggleRole(selectedUser.id, selectedUser.role)}>
              {selectedUser.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
            </MenuItem>
            <MenuItem onClick={() => handleToggleStatus(selectedUser.id, selectedUser.isVerified)}>
              {selectedUser.isVerified ? 'Unverify User' : 'Verify User'}
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, title: '', message: '', action: null })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, title: '', message: '', action: null })}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (confirmDialog.action) {
                confirmDialog.action();
              }
              setConfirmDialog({ open: false, title: '', message: '', action: null });
            }}
            color="primary"
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminUserManagement;