import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  useTheme
} from '@mui/material';
import { ContactSupport, Email } from '@mui/icons-material';
import api from '../services/api';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const ContactPage: React.FC = () => {
  const theme = useTheme();
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subjectOptions = [
    'General Inquiry',
    'Technical Support',
    'Feature Request',
    'Bug Report',
    'Business Partnership',
    'Account Issue',
    'Other'
  ];

  const handleChange = (field: keyof ContactFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubjectChange = (event: any) => {
    setFormData(prev => ({
      ...prev,
      subject: event.target.value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/contact', formData);
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.email && formData.subject && formData.message.length >= 10;

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 3 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <ContactSupport sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom fontWeight={600}>
          Contact Us
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, margin: '0 auto' }}>
          Have questions about REanalyzr? Need technical support? We're here to help you succeed in real estate investing.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Contact Form */}
        <Paper sx={{ flex: 2, p: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
            Send us a message
          </Typography>

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Your message has been sent successfully! We'll get back to you soon.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Your Name"
                value={formData.name}
                onChange={handleChange('name')}
                required
              />
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                required
              />
            </Box>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Subject</InputLabel>
              <Select
                value={formData.subject}
                onChange={handleSubjectChange}
                required
              >
                {subjectOptions.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Message"
              multiline
              rows={6}
              value={formData.message}
              onChange={handleChange('message')}
              placeholder="Please describe your question or issue in detail..."
              required
              helperText={`${formData.message.length}/2000 characters (minimum 10)`}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading || !isFormValid}
              sx={{
                height: 56,
                borderRadius: 2,
                fontSize: '1.1rem',
                fontWeight: 600
              }}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </Paper>

        {/* Contact Info */}
        <Paper sx={{ flex: 1, p: 4, height: 'fit-content' }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
            Get in touch
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Email sx={{ mr: 2, color: theme.palette.primary.main }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  Email Support
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  support@reanalyzr.com
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ContactSupport sx={{ mr: 2, color: theme.palette.primary.main }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  Response Time
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Usually within 24 hours
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" component="h3" gutterBottom fontWeight={600}>
            Common Questions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Before reaching out, you might find answers in our Help & Documentation section.
          </Typography>

          <Button
            variant="outlined"
            fullWidth
            onClick={() => window.location.href = '/help'}
            sx={{ borderRadius: 2 }}
          >
            Browse Help Center
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default ContactPage;