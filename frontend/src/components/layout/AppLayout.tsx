/**
 * AppLayout — chat-first shell for /app (Phase 3+4).
 *
 * Responsibilities:
 *   - Render the persistent left sidebar (AppSidebar) on desktop
 *   - Render a drawer-style sidebar on mobile, toggled by a hamburger
 *     button rendered by the host (or pulled into a top bar — for
 *     Phase 3 we keep it minimal: hamburger pinned top-left in the main
 *     pane when sidebar is closed)
 *   - Provide a main-pane slot that fills remaining viewport
 *   - Own the "active thread" + "new chat" intent and hand keys to the
 *     host so ChatOverlay can remount with fresh state
 *
 * Why a thread KEY (not lifted state):
 *   - ChatOverlay manages its own thread state internally (messages,
 *     turnNumber, sessionId via sessionStorage). The cleanest "reset"
 *     is to remount the component — React keys do this for free without
 *     touching ChatOverlay's internals.
 *   - When user clicks "+ New chat", we bump the key → ChatOverlay
 *     remounts with a fresh sessionId (after we clear the
 *     sessionStorage key — handled in AppPage so AppLayout stays pure
 *     layout).
 *
 * Why no top bar:
 *   - The sidebar already brands + nav. Adding a top AppBar would
 *     compete with chat content for vertical space (mobile is tight).
 *   - On mobile, a single hamburger button overlaying the chat suffices
 *     — it floats in the top-left, never blocks input or messages.
 */

import { useState } from 'react';
import { Box, Drawer, IconButton, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { AppSidebar, APP_SIDEBAR_WIDTH } from './AppSidebar';

export interface AppLayoutProps {
  /** Main pane content (typically ChatOverlay). */
  children: React.ReactNode;
  /** Active thread id — passed through to AppSidebar for selection state. */
  activeThreadId?: string;
  /** Called when user selects a thread row in the sidebar. */
  onSelectThread: (id: string) => void;
  /** Called when user hits "+ New chat" in the sidebar. */
  onNewChat: () => void;
}

export function AppLayout(props: AppLayoutProps): React.JSX.Element {
  const { children, activeThreadId, onSelectThread, onNewChat } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // <900px

  // Mobile drawer open state. Desktop sidebar is always visible.
  const [mobileOpen, setMobileOpen] = useState(false);

  // Wrap callbacks to auto-close the mobile drawer on action — keeps the
  // user's flow forward without a manual dismiss.
  const handleSelect = (id: string): void => {
    onSelectThread(id);
    if (isMobile) setMobileOpen(false);
  };
  const handleNew = (): void => {
    onNewChat();
    if (isMobile) setMobileOpen(false);
  };

  const sidebar = (
    <AppSidebar
      activeThreadId={activeThreadId}
      onSelectThread={handleSelect}
      onNewChat={handleNew}
    />
  );

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        bgcolor: 'background.default',
      }}
      data-testid="app-layout"
    >
      {/* ===== Desktop: persistent sidebar ===== */}
      {!isMobile && (
        <Box
          sx={{
            width: APP_SIDEBAR_WIDTH,
            flexShrink: 0,
            height: '100%',
          }}
        >
          {sidebar}
        </Box>
      )}

      {/* ===== Mobile: drawer sidebar =====
          Issue #124 (2026-05-19): keepMounted=true was leaving the
          MuiModal-hidden backdrop in the DOM after close, intercepting
          scroll events across the entire main pane on /analysis/:id —
          the saved-deal page couldn't scroll past the top of
          SavedDealHero. Switching to keepMounted=false fully unmounts
          the drawer on close, and disableScrollLock=true prevents
          MUI's body-scroll-lock from sticking past close even if the
          Modal hits an edge case during transition. The "sidebar isn't
          huge" perf argument doesn't outweigh a non-scrollable page. */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{
            keepMounted: false,
            disableScrollLock: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: APP_SIDEBAR_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {sidebar}
        </Drawer>
      )}

      {/* ===== Main pane =====
          Issue #124 (2026-05-19) part 2: added `overflow-y: auto`.
          height: 100% caps the main pane to viewport height; without
          overflow-y the content below the viewport is CLIPPED, not
          scrollable. This was the second half of the saved-deal-page-
          doesn't-scroll bug — combined with the Drawer keepMounted fix
          above, content longer than 100vh now scrolls cleanly. */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Mobile hamburger — overlays top-left of main pane. */}
        {isMobile && (
          <IconButton
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
            data-testid="app-layout-menu-button"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 10,
              bgcolor: 'background.paper',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        {children}
      </Box>
    </Box>
  );
}
