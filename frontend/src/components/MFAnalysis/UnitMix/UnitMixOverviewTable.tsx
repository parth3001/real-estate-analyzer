/**
 * Unit Mix Overview Table Component
 *
 * Displays detailed breakdown of unit types with current vs market rent comparison.
 * Responsive: Desktop shows full table, mobile shows card view.
 *
 * @component
 */

import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Chip,
  Box,
  Card,
  CardContent,
  Grid,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InfoIcon from '@mui/icons-material/Info';
import { formatCurrency } from '../../../utils/formatters';

export interface UnitTypeData {
  type: string;
  count: number;
  sqft: number;
  currentRent: number;
  marketRent?: number;
  rentGap: number;
  rentPerSqft: number;
  incomePercentage: number;
}

interface UnitMixOverviewTableProps {
  unitTypes: UnitTypeData[];
  totals: {
    count: number;
    sqft: number;
    currentRent: number;
    marketRent: number;
    rentGap: number;
    rentPerSqft: number;
  };
}

export const UnitMixOverviewTable: React.FC<UnitMixOverviewTableProps> = ({
  unitTypes,
  totals
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Mobile Card View
  if (isMobile) {
    return (
      <Stack spacing={2} sx={{ marginBottom: 3 }}>
        <Typography variant="h6" gutterBottom>
          Unit Mix Overview
        </Typography>

        {unitTypes.map((unit, index) => (
          <Card key={index} variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" marginBottom={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {index === 0 ? (
                    <HomeIcon fontSize="small" color="primary" />
                  ) : (
                    <ApartmentIcon fontSize="small" color="secondary" />
                  )}
                  <Typography variant="h6">{unit.type}</Typography>
                </Stack>
                <Chip label={`${unit.count} ${unit.count === 1 ? 'unit' : 'units'}`} size="small" />
              </Stack>

              <Divider sx={{ my: 1 }} />

              <Grid container spacing={1}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Avg Sqft
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {unit.sqft.toLocaleString()} sqft
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Rent/Sqft
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(unit.rentPerSqft)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Current Rent
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    {formatCurrency(unit.currentRent)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Market Rent
                  </Typography>
                  <Typography variant="body1">
                    {unit.marketRent ? formatCurrency(unit.marketRent) : 'N/A'}
                  </Typography>
                </Grid>

                {unit.marketRent && (
                  <Grid size={{ xs: 12 }}>
                    <Chip
                      label={`${unit.rentGap > 0 ? '+' : ''}${formatCurrency(unit.rentGap)} gap`}
                      color={unit.rentGap > 0 ? 'success' : unit.rentGap < 0 ? 'error' : 'default'}
                      size="small"
                      icon={unit.rentGap > 0 ? <TrendingUpIcon /> : unit.rentGap < 0 ? <TrendingDownIcon /> : undefined}
                      sx={{ marginTop: 1 }}
                    />
                  </Grid>
                )}

                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">
                    % of Total Income
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 0.5 }}>
                    <Box
                      sx={{
                        flex: 1,
                        height: 8,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        mr: 1
                      }}
                    >
                      <Box
                        sx={{
                          width: `${unit.incomePercentage}%`,
                          height: '100%',
                          bgcolor: index === 0 ? 'primary.main' : 'secondary.main',
                          borderRadius: 1
                        }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight="medium">
                      {unit.incomePercentage.toFixed(1)}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}

        {/* Totals Card */}
        <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              TOTAL
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Units
                  </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {totals.count} units
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Sqft
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {totals.sqft.toLocaleString()} sqft
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Monthly Rent
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {formatCurrency(totals.currentRent)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Avg Rent/Sqft
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatCurrency(totals.rentPerSqft)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Stack>
    );
  }

  // Desktop Table View
  return (
    <TableContainer component={Paper} sx={{ marginBottom: 3 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.100' }}>
          <TableRow>
            <TableCell>
              <Typography variant="body2" fontWeight="bold">
                Unit Type
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="body2" fontWeight="bold">
                Count
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="body2" fontWeight="bold">
                Avg Sqft
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="body2" fontWeight="bold">
                Current Rent
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="body2" fontWeight="bold">
                Market Rent
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="body2" fontWeight="bold">
                Gap
                <Tooltip title="Difference between current rent and market rent. Positive values indicate below-market pricing (value-add opportunity). Negative values indicate above-market pricing (pricing risk).">
                  <InfoIcon fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle', fontSize: '0.85rem' }} />
                </Tooltip>
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="body2" fontWeight="bold">
                Rent/Sqft
                <Tooltip title="Monthly rent per square foot. Higher values indicate better space utilization. Industry average varies by market and building class.">
                  <InfoIcon fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle', fontSize: '0.85rem' }} />
                </Tooltip>
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="body2" fontWeight="bold">
                % Income
                <Tooltip title="Percentage of total property income from this unit type. Used to calculate diversification (HHI). Higher concentration = higher risk if market for that unit type softens.">
                  <InfoIcon fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle', fontSize: '0.85rem' }} />
                </Tooltip>
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {unitTypes.map((unit, index) => (
            <TableRow key={index} hover>
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                  {index === 0 ? (
                    <HomeIcon fontSize="small" color="primary" />
                  ) : (
                    <ApartmentIcon fontSize="small" color="secondary" />
                  )}
                  <Typography variant="body2">{unit.type}</Typography>
                </Stack>
              </TableCell>

              <TableCell align="right">
                <Typography variant="body2">{unit.count} units</Typography>
              </TableCell>

              <TableCell align="right">
                <Typography variant="body2">{unit.sqft.toLocaleString()} sqft</Typography>
              </TableCell>

              <TableCell align="right">
                <Typography variant="body2" fontWeight="medium" color="primary.main">
                  {formatCurrency(unit.currentRent)}
                </Typography>
              </TableCell>

              <TableCell align="right">
                <Typography variant="body2">
                  {unit.marketRent ? formatCurrency(unit.marketRent) : 'N/A'}
                </Typography>
              </TableCell>

              <TableCell align="right">
                {unit.marketRent ? (
                  <Chip
                    label={`${unit.rentGap > 0 ? '+' : ''}${formatCurrency(unit.rentGap)}`}
                    color={unit.rentGap > 0 ? 'success' : unit.rentGap < 0 ? 'error' : 'default'}
                    size="small"
                    icon={
                      unit.rentGap > 0 ? (
                        <TrendingUpIcon />
                      ) : unit.rentGap < 0 ? (
                        <TrendingDownIcon />
                      ) : undefined
                    }
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    -
                  </Typography>
                )}
              </TableCell>

              <TableCell align="right">
                <Typography variant="body2">{formatCurrency(unit.rentPerSqft)}</Typography>
              </TableCell>

              <TableCell align="right">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 8,
                      bgcolor: 'grey.200',
                      borderRadius: 1,
                      mr: 1
                    }}
                  >
                    <Box
                      sx={{
                        width: `${unit.incomePercentage}%`,
                        height: '100%',
                        bgcolor: index === 0 ? 'primary.main' : 'secondary.main',
                        borderRadius: 1
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ minWidth: 45 }}>
                    {unit.incomePercentage.toFixed(1)}%
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ))}

          {/* Totals Row */}
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell>
              <Typography variant="body2" fontWeight="bold">
                TOTAL
              </Typography>
            </TableCell>

            <TableCell align="right">
              <Typography variant="body2" fontWeight="bold">
                {totals.count} units
              </Typography>
            </TableCell>

            <TableCell align="right">
              <Typography variant="body2" fontWeight="bold">
                {totals.sqft.toLocaleString()} sqft
              </Typography>
            </TableCell>

            <TableCell align="right">
              <Typography variant="body2" fontWeight="bold" color="primary.main">
                {formatCurrency(totals.currentRent)}
              </Typography>
            </TableCell>

            <TableCell align="right">
              <Typography variant="body2" fontWeight="bold">
                {totals.marketRent > 0 ? formatCurrency(totals.marketRent) : 'N/A'}
              </Typography>
            </TableCell>

            <TableCell align="right">
              {totals.marketRent > 0 && (
                <Chip
                  label={`${totals.rentGap > 0 ? '+' : ''}${formatCurrency(totals.rentGap)}`}
                  color={totals.rentGap > 0 ? 'success' : totals.rentGap < 0 ? 'error' : 'default'}
                />
              )}
            </TableCell>

            <TableCell align="right">
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(totals.rentPerSqft)}
              </Typography>
            </TableCell>

            <TableCell align="right">
              <Typography variant="body2" fontWeight="bold">
                100%
              </Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UnitMixOverviewTable;
