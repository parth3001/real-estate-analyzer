/**
 * AppPage — the chat surface route (W6-S2 → Phase 3+4 chat-first IA).
 *
 * Phase 3+4 evolution (2026-05-16):
 *   For AUTHENTICATED users, /app is the post-login home. We wrap
 *   ChatOverlay in an AppLayout (left sidebar with thread history +
 *   platform nav). Picking a thread from the sidebar resets the active
 *   sessionId so ChatOverlay remounts against that thread.
 *
 *   For ANONYMOUS users (hero-embed entry from LandingPage), /app stays
 *   full-bleed — no sidebar, no chrome. Same surface, same overlay.
 *   They get the sidebar after magic-link claim (W6-S5).
 *
 * Hero-embed entry path (preserved from W6-S2b):
 *   LandingPage navigates here with `state: { initialUserInput }`. We
 *   forward it to ChatOverlay which auto-submits as turn 1.
 *
 * Thread-switching mechanics:
 *   - The "active thread" is the sessionId stored in sessionStorage
 *     (SESSION_STORAGE_KEY in ChatOverlay).
 *   - To switch threads OR start fresh, we rewrite sessionStorage and
 *     bump a React key on ChatOverlay so it remounts cleanly.
 *   - This is a Phase 3+4 stopgap — Phase 7+ moves thread state to a
 *     proper server-side list endpoint.
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { ChatOverlay } from '../components/Chat/ChatOverlay';
import { AppLayout } from '../components/layout/AppLayout';
import PublicHeader from '../components/common/PublicHeader';
import { useAuth } from '../contexts/AuthContext';

interface AppPageLocationState {
  initialUserInput?: string;
}

// Must match ChatOverlay's SESSION_STORAGE_KEY (intentionally duplicated
// — keeping that constant private to the chat surface). If you rename
// in one place rename in both; covered by the smoke test in Day 7.
const SESSION_STORAGE_KEY = 'reanalyzr.chat.sessionId';

function readActiveSessionId(): string | undefined {
  if (typeof sessionStorage === 'undefined') return undefined;
  return sessionStorage.getItem(SESSION_STORAGE_KEY) ?? undefined;
}

function writeActiveSessionId(id: string | undefined): void {
  if (typeof sessionStorage === 'undefined') return;
  if (id) sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  else sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export default function AppPage(): React.JSX.Element {
  const location = useLocation();
  const state = (location.state ?? {}) as AppPageLocationState;
  const { user } = useAuth();

  // ChatOverlay key — bumping this forces a remount with the
  // newly-active sessionId. Initial value tracks whatever's already in
  // sessionStorage so a page refresh preserves the thread.
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(
    () => readActiveSessionId()
  );

  // Keep our local active-id in sync with sessionStorage when the
  // overlay creates a fresh sessionId on first mount.
  useEffect(() => {
    if (!activeSessionId) {
      // Defer one frame so ChatOverlay's resolveSessionId() has run.
      const id = setTimeout(() => {
        const fromStorage = readActiveSessionId();
        if (fromStorage) setActiveSessionId(fromStorage);
      }, 0);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [activeSessionId]);

  const handleSelectThread = (id: string): void => {
    if (id === activeSessionId) return;
    writeActiveSessionId(id);
    setActiveSessionId(id);
  };

  const handleNewChat = (): void => {
    // Clear the session — ChatOverlay's resolveSessionId() will mint a
    // fresh UUID on next mount. Bumping activeSessionId to undefined
    // triggers a remount via the key prop below.
    writeActiveSessionId(undefined);
    setActiveSessionId(undefined);
    // Tick to a unique sentinel so React sees a key change even when
    // the prior value was already undefined.
    setActiveSessionId(`__pending-${Date.now()}`);
  };

  // Anonymous users (hero-embed entry from LandingPage): PublicHeader
  // on top + ChatOverlay below. The header preserves brand + nav to
  // Pricing/Blog/Sample Analysis/Log in — so anon users keep the same
  // acquisition surfaces they had on the landing page (Issue #110).
  // Authed users get AppLayout's sidebar branding instead — no
  // PublicHeader needed for them.
  if (!user) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
        data-testid="app-page"
      >
        <PublicHeader />
        <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <ChatOverlay initialUserInput={state.initialUserInput} />
        </Box>
      </Box>
    );
  }

  // Authenticated: sidebar + chat. ChatOverlay is keyed on
  // activeSessionId so thread switches and new-chat actions remount
  // cleanly, picking up the new sessionStorage value. We thread the
  // user's first name + auth flag into the overlay so the Day-5
  // empty-state chip generator can personalize the greeting + chips.
  return (
    <AppLayout
      activeThreadId={activeSessionId}
      onSelectThread={handleSelectThread}
      onNewChat={handleNewChat}
    >
      <ChatOverlay
        key={activeSessionId ?? 'initial'}
        initialUserInput={state.initialUserInput}
        currentUserFirstName={user.firstName}
        currentUserIsAuthed={true}
      />
    </AppLayout>
  );
}
