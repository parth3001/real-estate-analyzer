/**
 * WorkspaceSection — the shared section shell for the scenario workspace
 * (Task #19 polish, 2026-05-21).
 *
 * Every section on /analysis/:id (Compare scenarios, Stress test, Details)
 * was independently repeating the same "uppercase eyebrow label + bordered
 * paper card" markup. Three copies meant three chances to drift. This
 * extracts the one true treatment so the whole page reads as a single,
 * coherent surface (Apple: consistency + deference — the chrome is identical
 * everywhere so the DATA is what varies, not the frame).
 *
 *   <WorkspaceSection label="Compare scenarios"> ...card content... </WorkspaceSection>
 *
 * `card={false}` drops the paper frame for sections that manage their own
 * container conditionally (e.g. Stress test renders just a button until run).
 */

import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

export interface WorkspaceSectionProps {
  /** Uppercase eyebrow label above the card. */
  label: string;
  /** Wrap children in the standard paper card. Default true. */
  card?: boolean;
  children: React.ReactNode;
  /** Extra styles merged onto the outer wrapper. */
  sx?: SxProps<Theme>;
}

/** The uppercase eyebrow label — exported for one-off reuse. */
export function SectionEyebrow({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: 600,
        color: 'text.secondary',
        fontSize: 11,
        mb: 1,
      }}
    >
      {children}
    </Typography>
  );
}

/** The standard bordered paper card — exported for one-off reuse. */
export function SectionCard({
  children,
  sx,
}: {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}): React.JSX.Element {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

export function WorkspaceSection({
  label,
  card = true,
  children,
  sx,
}: WorkspaceSectionProps): React.JSX.Element {
  return (
    <Box sx={{ mb: 4, ...sx }}>
      <SectionEyebrow>{label}</SectionEyebrow>
      {card ? <SectionCard>{children}</SectionCard> : children}
    </Box>
  );
}
