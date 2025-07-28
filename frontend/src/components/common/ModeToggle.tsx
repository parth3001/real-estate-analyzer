import React from 'react';
import { 
  Box, 
  ToggleButton, 
  ToggleButtonGroup, 
  Typography
} from '@mui/material';
import { School, Speed } from '@mui/icons-material';
import { useDualMode, type UserMode } from '../../contexts/DualModeContext';

export const ModeToggle: React.FC = () => {
  // Try to use DualModeContext, fall back to local state
  const [localMode, setLocalMode] = React.useState<UserMode>('novice');
  let mode = localMode;
  let setMode: (mode: UserMode) => void = (newMode: UserMode) => setLocalMode(newMode);

  try {
    const dualModeContext = useDualMode();
    mode = dualModeContext.mode;
    setMode = dualModeContext.setMode;
    console.log('Using DualModeContext, mode:', mode);
  } catch (error) {
    console.warn('DualModeContext not available, using local state');
  }

  const handleModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: UserMode | null
  ) => {
    if (newMode !== null) {
      setMode(newMode);
      console.log('Mode changed to:', newMode);
    }
  };

  return (
    <ToggleButtonGroup
      value={mode}
      exclusive
      onChange={handleModeChange}
      aria-label="user mode"
      size="small"
      sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        borderRadius: 1,
        '& .MuiToggleButton-root': {
          color: 'text.secondary',
          border: 'none',
          px: 2,
          py: 0.5,
          transition: 'all 0.2s ease-in-out',
          '&.Mui-selected': {
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
          },
        },
      }}
    >
      <ToggleButton value="novice">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <School fontSize="small" />
          <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500 }}>
            Learning
          </Typography>
        </Box>
      </ToggleButton>
      <ToggleButton value="pro">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Speed fontSize="small" />
          <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500 }}>
            Pro
          </Typography>
        </Box>
      </ToggleButton>
    </ToggleButtonGroup>
  );
};