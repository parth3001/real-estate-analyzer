/**
 * CheckoutReturnPage — landing pad after Stripe redirects the user
 * back from a successful $4.99 Payment Link purchase (Task #34,
 * 2026-07-14).
 *
 * Flow:
 *   1. User taps "Unlock · $4.99" in the workspace paywall.
 *   2. AnalysisDetails saves the dealId to localStorage under
 *      LS_KEY_PENDING_DEAL_ID and redirects to the Stripe Payment
 *      Link with client_reference_id + prefilled_email.
 *   3. User pays on Stripe.
 *   4. Stripe fires two things almost simultaneously:
 *        a. checkout.session.completed webhook  → our backend
 *           issues the DealLicense
 *        b. redirect back to /workspace/checkout-return?session_id=...
 *   5. This page reads the dealId from localStorage and polls
 *      GET /api/deals/:id/license every ~800ms for up to ~10s.
 *   6. On active license → navigate to /analysis/:dealId (unlocked
 *      workspace) and clear the localStorage sentinel.
 *   7. On timeout → show gentle "payment received, license
 *      activating" message with a manual retry button. This is a
 *      RARE case (webhook usually beats the redirect) but must not
 *      strand the user.
 *
 * Why localStorage instead of parsing session_id → dealId?
 *   Stripe's redirect URL only interpolates {CHECKOUT_SESSION_ID}.
 *   To go from session id → dealId requires a backend call to
 *   stripe.checkout.sessions.retrieve() with the secret key. Adding
 *   a whole endpoint for that is heavier than a one-line
 *   localStorage save on the outbound side. The trade-off is that
 *   a user who clears cookies between clicking Unlock and returning
 *   from Stripe loses the sentinel — the fallback state below
 *   surfaces a "which deal was this for?" message with a link to
 *   Saved Properties so they can find it themselves.
 */

import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { propertyApi } from '../services/api';

export const LS_KEY_PENDING_DEAL_ID = 'reanalyzr:pendingCheckoutDealId';

const POLL_INTERVAL_MS = 800;
const POLL_TIMEOUT_MS = 12_000;

type Status =
  | { kind: 'polling' }
  | { kind: 'activated'; dealId: string }
  | { kind: 'timeout'; dealId: string | null }
  | { kind: 'no-sentinel' };

export default function CheckoutReturnPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = React.useState<Status>({ kind: 'polling' });

  // Read the sentinel ONCE on mount. If it's absent, we can't
  // correlate the return to a specific deal — surface the fallback
  // state immediately rather than polling nothing.
  const initialDealId = React.useMemo<string | null>(() => {
    try {
      return localStorage.getItem(LS_KEY_PENDING_DEAL_ID);
    } catch {
      return null;
    }
  }, []);

  React.useEffect(() => {
    if (!initialDealId) {
      setStatus({ kind: 'no-sentinel' });
      return;
    }
    let cancelled = false;
    const startedAt = performance.now();
    async function poll(): Promise<void> {
      if (cancelled) return;
      try {
        const res = await propertyApi.getDealLicense(initialDealId as string);
        if (cancelled) return;
        if (res.data.status === 'active') {
          try {
            localStorage.removeItem(LS_KEY_PENDING_DEAL_ID);
          } catch {
            // Best-effort cleanup — a full localStorage or private
            // window that rejects writes shouldn't block navigation.
          }
          setStatus({ kind: 'activated', dealId: initialDealId as string });
          // Slight delay so the "unlocked" checkmark is visible for
          // a beat before the redirect fires — feels less abrupt.
          setTimeout(() => {
            if (!cancelled) navigate(`/analysis/${initialDealId}`, { replace: true });
          }, 700);
          return;
        }
      } catch {
        // Silent failure — keep polling. A single 5xx during the
        // race window is expected on cold-cache paths.
      }
      const elapsed = performance.now() - startedAt;
      if (elapsed >= POLL_TIMEOUT_MS) {
        if (!cancelled) setStatus({ kind: 'timeout', dealId: initialDealId as string });
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [initialDealId, navigate]);

  // Session id from the redirect (for ops correlation on the timeout
  // page — the user can share this with support to unblock).
  const sessionId = searchParams.get('session_id') ?? undefined;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        bgcolor: 'background.default',
      }}
    >
      <Stack spacing={3} sx={{ maxWidth: 480, textAlign: 'center' }}>
        {status.kind === 'polling' && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={40} thickness={4} />
            </Box>
            <Typography sx={{ fontSize: 20, fontWeight: 600 }}>
              Activating your workspace…
            </Typography>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.5 }}>
              Payment received. We're unlocking the full deal breakdown —
              usually takes a second or two.
            </Typography>
          </>
        )}

        {status.kind === 'activated' && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 56, color: 'success.main' }} />
            </Box>
            <Typography sx={{ fontSize: 20, fontWeight: 600 }}>
              Workspace unlocked.
            </Typography>
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
              Redirecting you to the full analysis…
            </Typography>
          </>
        )}

        {status.kind === 'timeout' && (
          <>
            <Typography sx={{ fontSize: 20, fontWeight: 600 }}>
              Payment received — license activating.
            </Typography>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.5 }}>
              This can occasionally take a minute if our systems are catching
              up. Your access is on the way and will remain in place for the
              full 180-day window.
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'center' }}>
              {status.dealId && (
                <Button
                  variant="contained"
                  onClick={() => window.location.reload()}
                  sx={{ textTransform: 'none' }}
                >
                  Try again
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={() => navigate('/saved-properties')}
                sx={{ textTransform: 'none' }}
              >
                Go to Saved Properties
              </Button>
            </Stack>
            {sessionId && (
              <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 2 }}>
                Reference: {sessionId}
              </Typography>
            )}
          </>
        )}

        {status.kind === 'no-sentinel' && (
          <>
            <Typography sx={{ fontSize: 20, fontWeight: 600 }}>
              Payment received.
            </Typography>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.5 }}>
              We couldn't automatically route you back to the deal — this
              can happen if browser storage was cleared between checkout
              and return. Your license is active; open it from Saved
              Properties.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/saved-properties')}
              sx={{ textTransform: 'none' }}
            >
              Open Saved Properties
            </Button>
            {sessionId && (
              <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 2 }}>
                Reference: {sessionId}
              </Typography>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}
