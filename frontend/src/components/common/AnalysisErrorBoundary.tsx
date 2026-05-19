/**
 * AnalysisErrorBoundary — localized error containment for the
 * `/analysis/:id` surface (D2 fix, Day 11a, 2026-05-18).
 *
 * WHY THIS EXISTS
 * ───────────────
 *
 * Issue D2 from the Day 10 test session: a runtime error in the legacy
 * `AnalysisResults` component (TypeError on `propertyData.strategy`)
 * caused React 19 to unmount the ENTIRE component tree on `/analysis/:id`
 * — taking down the NEW SavedDealHero (CritiqueCard, LicenseStatusBadge,
 * DealScoreCard) along with it. The page rendered blank.
 *
 * That blast radius is the architectural problem. Even when we fix the
 * specific `.strategy` read (D1), the next legacy regression would
 * cascade the same way. The CLAUDE.md principle "content over chrome /
 * graceful degradation" requires LOCALIZED failure: when one component
 * breaks, others stay visible.
 *
 * DESIGN
 * ──────
 *
 * - Class component (only way React lets you implement error
 *   boundaries — hooks-based equivalents don't exist yet)
 * - Renders a clean fallback ("Deep-dive analysis tabs couldn't load")
 *   that visually matches the rest of `/analysis/:id` rather than a
 *   shouty red error block
 * - Logs the error to console with full stack trace so dev / production
 *   diagnostics still surface
 * - Optional `onError` callback for telemetry hookup
 * - Reset key support: parent can pass a `resetKey` (e.g., the dealId)
 *   so navigating to a different deal re-mounts the children cleanly
 *
 * USAGE
 * ─────
 *
 * ```tsx
 * <AnalysisErrorBoundary resetKey={dealId}>
 *   <AnalysisResults {...legacyProps} />
 * </AnalysisErrorBoundary>
 * ```
 *
 * Renders children normally. If they throw, the fallback renders in
 * the same slot — SavedDealHero above stays visible.
 */

import { Component, type ReactNode } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface AnalysisErrorBoundaryProps {
  children: ReactNode;
  /**
   * When this value changes (e.g., dealId), the boundary resets its
   * error state and re-renders children. Without this, navigating
   * between deals would keep showing the fallback even when the new
   * deal would render fine.
   */
  resetKey?: string;
  /** Optional telemetry hook. Called once per caught error. */
  onError?: (error: Error, info: { componentStack: string }) => void;
}

interface AnalysisErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  /** Tracked so getDerivedStateFromProps can detect resetKey changes. */
  lastResetKey: string | undefined;
}

export class AnalysisErrorBoundary extends Component<
  AnalysisErrorBoundaryProps,
  AnalysisErrorBoundaryState
> {
  constructor(props: AnalysisErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      lastResetKey: props.resetKey,
    };
  }

  /**
   * React calls this when a child throws. Returning new state triggers
   * the fallback render.
   */
  static getDerivedStateFromError(error: Error): Partial<AnalysisErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   * Detects parent-driven reset. When the caller changes resetKey
   * (e.g., user navigates to a different deal), we drop the error
   * state and try rendering children again.
   */
  static getDerivedStateFromProps(
    props: AnalysisErrorBoundaryProps,
    state: AnalysisErrorBoundaryState
  ): Partial<AnalysisErrorBoundaryState> | null {
    if (props.resetKey !== state.lastResetKey) {
      return {
        hasError: false,
        error: null,
        lastResetKey: props.resetKey,
      };
    }
    return null;
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    // Log loudly so the error is visible in dev console AND in any
    // production error tracker that hooks console.error.
    // eslint-disable-next-line no-console
    console.error(
      '[AnalysisErrorBoundary] Caught error in legacy analysis tabs:',
      error,
      info.componentStack
    );
    this.props.onError?.(error, info);
  }

  handleRetry = (): void => {
    // Manual reset — clears the error state and re-mounts children.
    // If the underlying bug is deterministic, this just shows the
    // same error again; that's fine — it's an explicit user action.
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            mt: 3,
            p: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
          data-testid="analysis-error-boundary-fallback"
        >
          <Stack spacing={1.5} alignItems="flex-start">
            <Typography
              variant="caption"
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
                color: 'text.secondary',
                fontSize: 11,
              }}
            >
              Deep-dive analysis
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'text.primary', fontSize: 14 }}
            >
              The detailed analysis tabs couldn't load for this deal.
              The summary above is still complete — you can keep working
              from there, or refresh to retry.
            </Typography>
            {/* In dev / non-production, surface a short error message
                for fast debugging. Production builds redact the message
                so we don't leak stack content to end users. */}
            {import.meta.env.MODE !== 'production' && this.state.error && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.disabled',
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 11,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {this.state.error.message}
              </Typography>
            )}
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
              onClick={this.handleRetry}
              sx={{ textTransform: 'none', fontSize: 13 }}
            >
              Retry
            </Button>
          </Stack>
        </Box>
      );
    }
    return this.props.children;
  }
}
