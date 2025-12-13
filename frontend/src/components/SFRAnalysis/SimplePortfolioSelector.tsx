import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  FormControl,
  Select,
  MenuItem,
  Button,
  Alert,
  Chip,
  Stack,
  Divider,
  CircularProgress
} from '@mui/material';
import { Add, Folder, CheckCircle } from '@mui/icons-material';
import { AppleCard, AppleButton } from '../ui/AppleComponents';
import { appleColors } from '../../theme/appleDesignSystem';
import { portfolioApi } from '../../services/api';
import type { PortfolioSummary } from '../../types/portfolio';

interface SimplePortfolioSelectorProps {
  dealId?: string;
  onPortfolioSelected?: (portfolioId: string | null) => void;
  selectedPortfolioId?: string | null;
  disabled?: boolean;
  compact?: boolean; // FIX Issue #26: Compact mode for minimal UI
}

export const SimplePortfolioSelector: React.FC<SimplePortfolioSelectorProps> = ({
  dealId,
  onPortfolioSelected,
  selectedPortfolioId,
  disabled = false,
  compact = false
}) => {
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Load available portfolios
  useEffect(() => {
    if (!disabled) {
      loadPortfolios();
    }
  }, [disabled]);

  const loadPortfolios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await portfolioApi.getAvailablePortfolios();
      if (response.status === 200 && response.data.success) {
        setPortfolios(response.data.portfolios || []);
      }
    } catch (err) {
      console.error('Error loading portfolios:', err);
      setError('Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioChange = (portfolioId: string) => {
    onPortfolioSelected?.(portfolioId === 'none' ? null : portfolioId);
  };

  const handleAddToPortfolio = async () => {
    if (!dealId || !selectedPortfolioId) return;
    
    setAdding(true);
    try {
      await portfolioApi.addPropertyToPortfolio(selectedPortfolioId, dealId);
      // Success handled by parent component
    } catch (err) {
      console.error('Error adding to portfolio:', err);
      setError('Failed to add property to portfolio');
    } finally {
      setAdding(false);
    }
  };

  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId);

  // FIX Issue #26: Compact mode renders minimal UI without card wrapper
  if (compact) {
    return (
      <Box>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <CircularProgress size={20} />
          </Box>
        ) : portfolios.length === 0 ? (
          <Typography variant="caption" sx={{ color: appleColors.gray[500], textAlign: 'center', display: 'block' }}>
            No portfolios available
          </Typography>
        ) : (
          <FormControl fullWidth size="small">
            <Select
              value={selectedPortfolioId || 'none'}
              onChange={(e) => handlePortfolioChange(e.target.value)}
              disabled={disabled}
              displayEmpty
              sx={{
                backgroundColor: 'white',
                borderRadius: '10px',
                fontSize: '0.875rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: appleColors.gray[300]
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: appleColors.primary[300]
                }
              }}
            >
              <MenuItem value="none">
                <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                  <Folder sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle', color: appleColors.gray[500] }} />
                  Analyze without portfolio context
                </Typography>
              </MenuItem>
              {portfolios.map((portfolio) => (
                <MenuItem key={portfolio.id} value={portfolio.id}>
                  <Typography variant="body2">
                    <Folder sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle', color: appleColors.primary[600] }} />
                    {portfolio.name}
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
    );
  }

  return (
    <AppleCard padding="large">
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Folder sx={{ color: appleColors.blue[600] }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: appleColors.gray[900],
              flex: 1
            }}
          >
            Portfolio Selection
          </Typography>
          {selectedPortfolioId && (
            <Chip
              icon={<CheckCircle />}
              label="Selected"
              color="success"
              size="small"
            />
          )}
        </Stack>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ mt: 1, color: appleColors.gray[600] }}>
              Loading portfolios...
            </Typography>
          </Box>
        ) : portfolios.length === 0 ? (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 3,
              backgroundColor: '#EFF6FF',
              border: `1px solid #BFDBFE`,
              borderRadius: '12px'
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              No Portfolios Found
            </Typography>
            <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
              Create your first portfolio to start tracking investments and get portfolio-aware analysis.
            </Typography>
          </Alert>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 2, color: appleColors.gray[700] }}>
              Choose a portfolio to analyze this property in context:
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <Select
                value={selectedPortfolioId || 'none'}
                onChange={(e) => handlePortfolioChange(e.target.value)}
                disabled={disabled}
                sx={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: appleColors.gray[300]
                  }
                }}
              >
                <MenuItem value="none">
                  <em>Analyze without portfolio context</em>
                </MenuItem>
                {portfolios.map((portfolio) => (
                  <MenuItem key={portfolio.id} value={portfolio.id}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {portfolio.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
                        {portfolio.primaryGoal?.replace('_', ' ')} • {portfolio.totalProperties || 0} properties
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedPortfolioId && selectedPortfolio && (
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: appleColors.gray[50], 
                  borderRadius: '12px',
                  border: `1px solid ${appleColors.gray[200]}`
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Selected Portfolio: {selectedPortfolio.name}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Chip 
                    label={selectedPortfolio.primaryGoal?.replace('_', ' ')}
                    size="small"
                    color="primary"
                  />
                  <Chip 
                    label={`${selectedPortfolio.totalProperties || 0} properties`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip 
                    label={`$${Math.round(selectedPortfolio.monthlyNetCashFlow || 0).toLocaleString()}/mo`}
                    size="small"
                    variant="outlined"
                    color={selectedPortfolio.monthlyNetCashFlow >= 0 ? 'success' : 'error'}
                  />
                </Stack>
              </Box>
            )}
          </>
        )}

        {dealId && selectedPortfolioId && (
          <>
            <Divider sx={{ my: 2 }} />
            <AppleButton
              variant="primary"
              onClick={handleAddToPortfolio}
              disabled={adding}
              fullWidth
            >
              <Add sx={{ mr: 1 }} />
              {adding ? 'Adding to Portfolio...' : 'Add Property to Portfolio'}
            </AppleButton>
          </>
        )}

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="text"
            size="small"
            onClick={() => window.open('/portfolios', '_blank')}
            sx={{ 
              color: appleColors.blue[600],
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Manage Portfolios →
          </Button>
        </Box>
      </Box>
    </AppleCard>
  );
};

export default SimplePortfolioSelector;