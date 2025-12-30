/**
 * Projections Table Component
 *
 * 10-year financial projections table for BRRRR properties
 * Displays year-by-year property value, equity, cash flow, and key metrics
 *
 * Design: Apple-inspired table with tabular numbers, alternating row colors
 *
 * @author FSE from CLAUDE.md
 * @date December 28, 2025
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
} from '@mui/material';
import { brrrColors } from '../../../theme/brrrDesignTokens';
import type { ProjectionRow, ProjectionsTableProps } from './types';

// Re-export types for convenience
export type { ProjectionRow, ProjectionsTableProps };

export const ProjectionsTable: React.FC<ProjectionsTableProps> = ({
  projections,
  compact = false,
  highlightYear,
}) => {
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow
            sx={{
              backgroundColor: brrrColors.neutral.light,
            }}
          >
            <TableCell sx={{ fontWeight: 600, fontSize: '13px' }}>Year</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '13px' }}>
              Property Value
            </TableCell>
            {!compact && (
              <>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '13px' }}>
                  Loan Balance
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '13px' }}>
                  Equity
                </TableCell>
              </>
            )}
            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '13px' }}>
              Annual Cash Flow
            </TableCell>
            {!compact && (
              <>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '13px' }}>
                  NOI
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '13px' }}>
                  Appreciation Gain
                </TableCell>
              </>
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {projections.map((projection, index) => {
            const isHighlighted = highlightYear && projection.year === highlightYear;
            const equity = projection.equity !== undefined
              ? projection.equity
              : projection.propertyValue - (projection.loanBalance || 0);

            return (
              <TableRow
                key={projection.year}
                sx={{
                  backgroundColor: isHighlighted
                    ? brrrColors.postRefinance.light
                    : index % 2 === 0
                    ? 'transparent'
                    : brrrColors.neutral.light,
                  '&:hover': {
                    backgroundColor: brrrColors.postRefinance.light,
                  },
                  borderLeft: isHighlighted
                    ? `4px solid ${brrrColors.postRefinance.primary}`
                    : 'none',
                }}
              >
                {/* Year */}
                <TableCell
                  sx={{
                    fontWeight: isHighlighted ? 700 : 600,
                    fontSize: '14px',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {projection.year}
                  {isHighlighted && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        ml: 1,
                        color: brrrColors.postRefinance.primary,
                        fontWeight: 600,
                      }}
                    >
                      (Exit)
                    </Typography>
                  )}
                </TableCell>

                {/* Property Value */}
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    fontSize: '14px',
                    fontVariantNumeric: 'tabular-nums',
                    color: isHighlighted ? brrrColors.postRefinance.dark : 'text.primary',
                  }}
                >
                  {formatCurrency(projection.propertyValue)}
                </TableCell>

                {/* Loan Balance */}
                {!compact && (
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: '14px',
                      fontVariantNumeric: 'tabular-nums',
                      color: 'text.secondary',
                    }}
                  >
                    {formatCurrency(projection.loanBalance)}
                  </TableCell>
                )}

                {/* Equity */}
                {!compact && (
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      fontSize: '14px',
                      fontVariantNumeric: 'tabular-nums',
                      color: brrrColors.capitalRecovery.dark,
                    }}
                  >
                    {formatCurrency(equity)}
                  </TableCell>
                )}

                {/* Annual Cash Flow */}
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    fontSize: '14px',
                    fontVariantNumeric: 'tabular-nums',
                    color:
                      (projection.cashFlow || 0) >= 0
                        ? brrrColors.capitalRecovery.dark
                        : brrrColors.negative.dark,
                  }}
                >
                  {formatCurrency(projection.cashFlow)}
                </TableCell>

                {/* NOI */}
                {!compact && (
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: '14px',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatCurrency(projection.noi)}
                  </TableCell>
                )}

                {/* Appreciation Gain */}
                {!compact && (
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: '14px',
                      fontVariantNumeric: 'tabular-nums',
                      color: brrrColors.capitalRecovery.dark,
                    }}
                  >
                    {projection.appreciationGain !== undefined
                      ? `+${formatCurrency(projection.appreciationGain)}`
                      : '-'}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Table Footer Summary */}
      <Box
        sx={{
          mt: 2,
          p: 2,
          backgroundColor: brrrColors.neutral.light,
          borderRadius: '8px',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          <strong>Note:</strong> Projections assume {((projections[1]?.propertyValue / projections[0]?.propertyValue - 1) * 100).toFixed(1)}% annual appreciation,
          consistent rent growth, and steady operating expenses. Actual results may vary based on market conditions.
        </Typography>
      </Box>
    </TableContainer>
  );
};

export default ProjectionsTable;
