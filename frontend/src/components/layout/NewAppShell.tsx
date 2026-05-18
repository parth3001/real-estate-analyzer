/**
 * NewAppShell — chat-first-IA wrapper for non-chat protected routes.
 *
 * Phase 4 nav consolidation (Issue #108, 2026-05-17).
 *
 * Why this exists:
 *   Phase 3+4 introduced AppLayout (sidebar + main pane) for `/app`. But
 *   the protected sidebar-nav routes — /portfolio, /pipeline,
 *   /saved-properties, /settings — were still wrapped in the legacy
 *   AppleNavigation via the existing protected-route Outlet pattern.
 *   Result: clicking "Portfolio" in /app's sidebar JARRINGLY dropped the
 *   user into the OLD navigation experience with the OLD IA. User saw
 *   "two different apps glued together."
 *
 *   NewAppShell mounts the SAME AppLayout used on /app, with the route's
 *   <Outlet /> in the main pane. Now /portfolio / /pipeline /
 *   /saved-properties / /settings all render INSIDE the new sidebar
 *   shell. Clicking the sidebar nav swaps the main pane without
 *   changing the chrome. Same product, different content area.
 *
 * Thread interaction from non-chat routes:
 *   A user on /portfolio who clicks a recent thread in the sidebar
 *   expects to GO to chat with that thread loaded. Similarly for "+ New
 *   chat" — that should take them to /app with a fresh session.
 *   `handleSelectThread` and `handleNewChat` write sessionStorage and
 *   navigate to /app. The sessionId persistence is the same primitive
 *   AppPage uses for thread switching within /app.
 *
 * No props — Shell is mounted by routing, route content arrives via Outlet.
 */

import { useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { AppLayout } from './AppLayout';

// Must match ChatOverlay's SESSION_STORAGE_KEY (intentionally duplicated
// — same constant lives in AppPage.tsx for the same reason). If this
// constant ever moves, update all three sites.
const SESSION_STORAGE_KEY = 'reanalyzr.chat.sessionId';

function writeActiveSessionId(id: string | undefined): void {
  if (typeof sessionStorage === 'undefined') return;
  if (id) sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  else sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export default function NewAppShell(): React.JSX.Element {
  const navigate = useNavigate();

  /**
   * Sidebar thread click from a non-chat route: write the selected
   * sessionId into storage so ChatOverlay's resolveSessionId() picks
   * it up on /app mount, then navigate. The route swap is what
   * triggers the AppPage mount (with the persisted sessionId already
   * in storage).
   */
  const handleSelectThread = (id: string): void => {
    writeActiveSessionId(id);
    navigate('/app');
  };

  /**
   * "+ New chat" from a non-chat route: clear any persisted session
   * so ChatOverlay mints a fresh one on mount, then navigate.
   */
  const handleNewChat = (): void => {
    writeActiveSessionId(undefined);
    navigate('/app');
  };

  return (
    <AppLayout
      // No activeThreadId — we're not on /app, so no thread is "current."
      // The sidebar's nav items (Portfolio, Pipeline, Saved properties,
      // Settings) get their active highlight from location.pathname.
      onSelectThread={handleSelectThread}
      onNewChat={handleNewChat}
    >
      {/* Route content renders here — Portfolio, Pipeline, Saved
          properties, Settings, etc. */}
      <Outlet />
    </AppLayout>
  );
}
