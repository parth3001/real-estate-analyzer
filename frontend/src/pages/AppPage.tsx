/**
 * AppPage — the standalone chat surface route (W6-S2).
 *
 * UX Designer lens (Apple HIG):
 *   - Full-viewport chat surface, no extraneous chrome competing with content
 *     (matches the Apple Notes / Messages full-screen pattern).
 *   - The ChatOverlay handles its own ThemeProvider + max-width centering,
 *     so this page is intentionally minimal — it's the page-level mount
 *     point and nothing more.
 *
 * Hero-embed entry path (W6-S2b — next commit):
 *   - LandingPage will navigate here with `state: { initialUserInput }`.
 *   - We read it off useLocation() and forward it to the overlay, which
 *     auto-submits as turn 1.
 *
 * NOTE: this route is intentionally public (mounted outside ProtectedRoute)
 * for W6 — we want hero-embed users to land in the chat *before* signup
 * (W6-S5 will gate paid features behind auth, free turns stay open).
 */

import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { ChatOverlay } from '../components/Chat/ChatOverlay';

interface AppPageLocationState {
  initialUserInput?: string;
}

export default function AppPage(): React.JSX.Element {
  const location = useLocation();
  const state = (location.state ?? {}) as AppPageLocationState;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        bgcolor: 'background.default',
      }}
      data-testid="app-page"
    >
      <ChatOverlay initialUserInput={state.initialUserInput} />
    </Box>
  );
}
