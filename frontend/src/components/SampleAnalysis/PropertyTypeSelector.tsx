import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Home as HomeIcon, Apartment as ApartmentIcon } from '@mui/icons-material';
import { appleColors, appleShadows, appleBorderRadius } from '../../theme/appleDesignSystem';

type PropertyType = 'sfr' | 'mf';

interface PropertyTypeSelectorProps {
  selectedType: PropertyType;
  onTypeChange: (type: PropertyType) => void;
}

const PropertyTypeSelector: React.FC<PropertyTypeSelectorProps> = ({
  selectedType,
  onTypeChange
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="body1"
        sx={{
          mb: 2,
          color: appleColors.gray[700],
          fontSize: '0.938rem',
          fontWeight: 500,
          textAlign: 'center'
        }}
      >
        Choose Property Type:
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          justifyContent: 'center',
          alignItems: 'stretch'
        }}
      >
        {/* Single-Family Card */}
        <Card
          onClick={() => onTypeChange('sfr')}
          sx={{
            width: { xs: '100%', md: '240px' },
            height: { xs: '100px', md: '120px' },
            cursor: selectedType === 'sfr' ? 'default' : 'pointer',
            border: selectedType === 'sfr'
              ? `2px solid ${appleColors.primary[500]}`
              : `1px solid ${appleColors.gray[300]}`,
            backgroundColor: selectedType === 'sfr' ? 'white' : appleColors.gray[50],
            boxShadow: selectedType === 'sfr' ? appleShadows.md : 'none',
            borderRadius: appleBorderRadius.lg,
            transition: 'all 0.2s ease',
            '&:hover': selectedType !== 'sfr' ? {
              borderColor: appleColors.gray[400],
              boxShadow: appleShadows.sm
            } : {}
          }}
        >
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 2,
              '&:last-child': { pb: 2 }
            }}
          >
            <HomeIcon
              sx={{
                fontSize: '32px',
                color: selectedType === 'sfr' ? appleColors.primary[500] : appleColors.gray[400],
                mb: 1
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1rem', md: '1.125rem' },
                fontWeight: 600,
                color: selectedType === 'sfr' ? appleColors.gray[900] : appleColors.gray[600],
                textAlign: 'center'
              }}
            >
              Single-Family
            </Typography>
          </CardContent>
        </Card>

        {/* Multi-Family Card */}
        <Card
          onClick={() => onTypeChange('mf')}
          sx={{
            width: { xs: '100%', md: '240px' },
            height: { xs: '100px', md: '120px' },
            cursor: selectedType === 'mf' ? 'default' : 'pointer',
            border: selectedType === 'mf'
              ? `2px solid ${appleColors.primary[500]}`
              : `1px solid ${appleColors.gray[300]}`,
            backgroundColor: selectedType === 'mf' ? 'white' : appleColors.gray[50],
            boxShadow: selectedType === 'mf' ? appleShadows.md : 'none',
            borderRadius: appleBorderRadius.lg,
            transition: 'all 0.2s ease',
            '&:hover': selectedType !== 'mf' ? {
              borderColor: appleColors.gray[400],
              boxShadow: appleShadows.sm
            } : {}
          }}
        >
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 2,
              '&:last-child': { pb: 2 }
            }}
          >
            <ApartmentIcon
              sx={{
                fontSize: '32px',
                color: selectedType === 'mf' ? appleColors.primary[500] : appleColors.gray[400],
                mb: 1
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1rem', md: '1.125rem' },
                fontWeight: 600,
                color: selectedType === 'mf' ? appleColors.gray[900] : appleColors.gray[600],
                textAlign: 'center'
              }}
            >
              Multi-Family
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default PropertyTypeSelector;
