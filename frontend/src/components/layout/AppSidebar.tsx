/**
 * AppSidebar — chat-first IA for /app (Phase 3+4).
 *
 * UX Designer / Apple HIG lens:
 *
 *   Layout (top → bottom):
 *     1. Brand + collapse control     (16px, hairline divider below)
 *     2. "+ New chat" primary action  (full-width, 44pt tap target)
 *     3. RECENT threads, time-grouped (TODAY / YESTERDAY / THIS WEEK / EARLIER)
 *        - Each row: score-color dot + title (truncated 1-line)
 *        - Active thread: subtle surface tint, no chrome-heavy highlight
 *     4. Spacer (flex 1) — pushes nav block to the bottom
 *     5. PLATFORM nav: Portfolio · Pipeline · Saved · Settings (icons + labels)
 *     6. User block: avatar + first-name + logout (pinned bottom)
 *
 * Why threads at top, nav at bottom (vs reverse):
 *   - Threads are the user's CURRENT WORK — primacy of recall.
 *   - Platform nav is the SHELF — important but secondary; visible w/o scroll.
 *   - This mirrors Apple Notes, Linear, ChatGPT, Claude — the canonical
 *     chat-first sidebar pattern users already know how to operate.
 *
 * Why score-color dots (not score numbers):
 *   - At sidebar density (~24px row), tabular nums fight the title for
 *     attention. A 6px colored dot reads at a glance and lets the title
 *     have the row.
 *   - Color follows the platform's Deal Quality scale (green ≥80, yellow
 *     65-79, orange 50-64, red <50) — same legend everywhere.
 *
 * Per PRODUCT_CONTEXT.md (target = experienced investors):
 *   - No tutorial chrome, no "Welcome to your sidebar" coachmarks.
 *   - Empty state is one short line ("Your analyses will appear here") —
 *     dignified, not chatty.
 */

import { useEffect, useState, type ComponentType } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  // Task #23: inline-edit input for thread rename.
  InputBase,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PersonIcon from '@mui/icons-material/Person';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CampaignIcon from '@mui/icons-material/Campaign';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import {
  getThreads,
  groupByTime,
  renameThread,
  subscribe,
  type ThreadRecord,
} from '../../services/threadStore';
import { useAuth } from '../../contexts/AuthContext';

export interface AppSidebarProps {
  /** Active thread id (for visual selection). */
  activeThreadId?: string;
  /** Called when user clicks a thread row. */
  onSelectThread: (id: string) => void;
  /** Called when user hits "+ New chat" — host clears state and routes. */
  onNewChat: () => void;
}

const SIDEBAR_WIDTH = 280;

// Deal Quality color scale (matches investmentDecisionEngine.ts ranges).
// Returns a CSS color string for a 6px dot.
function scoreColor(score: number | undefined): string {
  if (score === undefined || Number.isNaN(score)) return '#C6C6C8'; // neutral
  if (score >= 80) return '#34C759'; // green — above professional standards
  if (score >= 65) return '#FFCC00'; // yellow — meets professional standards
  if (score >= 50) return '#FF9500'; // orange — requires optimization
  return '#FF3B30'; // red — below professional standards
}

// Platform-nav items — bottom block. Order matches the design rendering:
// Portfolio first (long-tail value), then Pipeline (active work),
// then Saved (deal archive), then Settings (terminal).
interface NavItem {
  label: string;
  icon: ComponentType;
  path: string;
}
const NAV_ITEMS: NavItem[] = [
  { label: 'Portfolio', icon: BusinessIcon, path: '/portfolio' },
  { label: 'Pipeline', icon: TrendingUpIcon, path: '/pipeline' },
  { label: 'Saved properties', icon: BookmarkBorderIcon, path: '/saved-properties' },
  { label: 'Settings', icon: SettingsIcon, path: '/settings' },
];

export function AppSidebar(props: AppSidebarProps): React.JSX.Element {
  const { activeThreadId, onSelectThread, onNewChat } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Subscribe to threadStore changes — re-render the RECENT list when
  // ChatOverlay upserts mid-stream.
  const [threads, setThreads] = useState<ThreadRecord[]>(() => getThreads());
  useEffect(() => {
    const unsub = subscribe(() => setThreads(getThreads()));
    return unsub;
  }, []);

  // Overflow-menu state — anchors the user-block "..." dropdown that
  // hosts orphaned legacy nav items (Profile, Help, What's New, Contact,
  // Admin, Sign out). Phase 4 nav-consolidation kept these routes
  // accessible but moved them out of the main sidebar so the chat-first
  // IA stays focused.
  const [overflowAnchor, setOverflowAnchor] = useState<HTMLElement | null>(
    null
  );
  const overflowOpen = Boolean(overflowAnchor);
  const closeOverflow = (): void => setOverflowAnchor(null);
  const navAndClose = (path: string): void => {
    closeOverflow();
    navigate(path);
  };
  const isAdmin = (user as { role?: string } | null | undefined)?.role === 'admin';

  const groups = groupByTime(threads);

  // Task #23: inline thread rename. Double-click a row to edit; Enter
  // commits, Esc cancels, blur commits. Editing state is scoped to the
  // sidebar — once committed, threadStore.renameThread persists. Only
  // ONE row can be editing at a time (single-instance edit pattern).
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  const commitRename = (): void => {
    if (editingThreadId === null) return;
    renameThread(editingThreadId, editingTitle);
    setEditingThreadId(null);
    setEditingTitle('');
  };

  const cancelRename = (): void => {
    setEditingThreadId(null);
    setEditingTitle('');
  };

  const beginRename = (t: ThreadRecord): void => {
    setEditingThreadId(t.id);
    setEditingTitle(t.title);
  };

  const renderGroup = (
    label: string,
    rows: ThreadRecord[]
  ): React.JSX.Element | null => {
    if (rows.length === 0) return null;
    return (
      <Box key={label} sx={{ mb: 2 }}>
        <Typography
          variant="caption"
          sx={{
            px: 2,
            color: 'text.secondary',
            textTransform: 'uppercase',
            fontSize: '11px',
            letterSpacing: '0.08em',
            fontWeight: 600,
            display: 'block',
            mb: 0.5,
          }}
        >
          {label}
        </Typography>
        {rows.map((t) => {
          const isActive = t.id === activeThreadId;
          const isEditing = t.id === editingThreadId;
          return (
            <Box
              key={t.id}
              onClick={() => {
                if (isEditing) return; // don't navigate while editing
                onSelectThread(t.id);
              }}
              // Task #23: double-click on the row enters rename mode.
              // Apple HIG: double-click to edit, single-click to select.
              onDoubleClick={(e) => {
                e.stopPropagation();
                beginRename(t);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                px: 2,
                py: 1,
                cursor: isEditing ? 'text' : 'pointer',
                bgcolor: isActive ? 'action.selected' : 'transparent',
                '&:hover': {
                  bgcolor: isActive ? 'action.selected' : 'action.hover',
                },
                minHeight: 36,
              }}
              data-testid={`sidebar-thread-${t.id}`}
              title={isEditing ? undefined : 'Double-click to rename'}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: scoreColor(t.dealQualityScore),
                  flexShrink: 0,
                }}
                aria-label={
                  t.dealQualityScore !== undefined
                    ? `Deal quality ${Math.round(t.dealQualityScore)}`
                    : 'No score yet'
                }
              />
              {isEditing ? (
                <InputBase
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitRename();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelRename();
                    }
                  }}
                  onBlur={commitRename}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  inputProps={{
                    'aria-label': 'Rename thread',
                    maxLength: 80,
                    'data-testid': `sidebar-thread-rename-input-${t.id}`,
                  }}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: '14px',
                    color: 'text.primary',
                  }}
                />
              ) : (
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    color: 'text.primary',
                    fontSize: '14px',
                  }}
                >
                  {t.title}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  const noThreads = threads.length === 0;

  return (
    <Box
      component="nav"
      aria-label="Chat sidebar"
      data-testid="app-sidebar"
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* ===== 1. Brand row ===== */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          minHeight: 56,
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}
        >
          REanalyzr
        </Typography>
      </Box>
      <Divider />

      {/* ===== 2. + New chat ===== */}
      <Box sx={{ p: 1.5 }}>
        <Box
          onClick={onNewChat}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNewChat();
            }
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1.5,
            py: 1.25,
            borderRadius: '12px',
            cursor: 'pointer',
            border: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
            transition: 'background-color 120ms ease',
            '&:hover': { bgcolor: 'action.hover' },
            minHeight: 44, // 44pt touch target
          }}
          data-testid="sidebar-new-chat"
        >
          <AddIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            New chat
          </Typography>
        </Box>
      </Box>

      {/* ===== 3. RECENT threads (scrollable) ===== */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          py: 0.5,
        }}
      >
        {noThreads ? (
          <Box sx={{ px: 2, py: 4, textAlign: 'left' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Your analyses will appear here.
            </Typography>
          </Box>
        ) : (
          <>
            {renderGroup('Today', groups.today)}
            {renderGroup('Yesterday', groups.yesterday)}
            {renderGroup('This week', groups.thisWeek)}
            {renderGroup('Earlier', groups.earlier)}
          </>
        )}
      </Box>

      {/* ===== 4. Platform nav ===== */}
      <Divider />
      <Box sx={{ py: 1 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          // Prefix-match so /portfolio/create + /portfolio/:id still
          // highlight "Portfolio" in the sidebar — without it, the nested
          // routes would deselect the parent. Exact equality (===) was
          // wrong for the route migration in Issue #108.
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + '/');
          return (
            <Box
              key={item.path}
              onClick={() => navigate(item.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(item.path);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1,
                cursor: 'pointer',
                bgcolor: isActive ? 'action.selected' : 'transparent',
                '&:hover': {
                  bgcolor: isActive ? 'action.selected' : 'action.hover',
                },
                minHeight: 40,
                color: 'text.primary',
              }}
              data-testid={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Box sx={{ display: 'flex', color: 'text.secondary' }}>
                <Icon />
              </Box>
              <Typography variant="body2" sx={{ fontSize: '14px' }}>
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* ===== 5. User block ===== */}
      <Divider />
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          minHeight: 56,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '13px',
            flexShrink: 0,
          }}
          aria-hidden
        >
          {(user?.firstName?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            noWrap
            sx={{ fontWeight: 500, fontSize: '13px' }}
          >
            {user?.firstName ?? user?.email ?? 'Signed in'}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={(e) => setOverflowAnchor(e.currentTarget)}
          aria-label="More account options"
          aria-haspopup="menu"
          aria-expanded={overflowOpen}
          data-testid="sidebar-overflow"
        >
          <MoreHorizIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Overflow menu — surfaces routes that aren't in the primary
          sidebar nav. Without this, Help / What's New / Contact /
          Admin were orphaned after the Phase 4 nav consolidation
          (Issue #108). User flagged on 2026-05-17 testing. */}
      <Menu
        anchorEl={overflowAnchor}
        open={overflowOpen}
        onClose={closeOverflow}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        slotProps={{
          paper: { sx: { minWidth: 200, borderRadius: 2 } },
        }}
      >
        <MenuItem
          onClick={() => navAndClose('/profile')}
          data-testid="sidebar-overflow-profile"
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </MenuItem>
        <MenuItem
          onClick={() => navAndClose('/help')}
          data-testid="sidebar-overflow-help"
        >
          <ListItemIcon>
            <HelpOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Help & docs" />
        </MenuItem>
        <MenuItem
          onClick={() => navAndClose('/whats-new')}
          data-testid="sidebar-overflow-whatsnew"
        >
          <ListItemIcon>
            <CampaignIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="What's new" />
        </MenuItem>
        <MenuItem
          onClick={() => navAndClose('/contact')}
          data-testid="sidebar-overflow-contact"
        >
          <ListItemIcon>
            <ContactSupportIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Contact us" />
        </MenuItem>
        {isAdmin && [
          <Divider key="admin-divider" />,
          <MenuItem
            key="admin-users"
            onClick={() => navAndClose('/admin/users')}
            data-testid="sidebar-overflow-admin-users"
          >
            <ListItemIcon>
              <AdminPanelSettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Admin · users" />
          </MenuItem>,
          <MenuItem
            key="admin-analytics"
            onClick={() => navAndClose('/admin/analytics')}
            data-testid="sidebar-overflow-admin-analytics"
          >
            <ListItemIcon>
              <AdminPanelSettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Admin · analytics" />
          </MenuItem>,
        ]}
        <Divider />
        <MenuItem
          onClick={() => {
            closeOverflow();
            void logout();
            navigate('/');
          }}
          data-testid="sidebar-overflow-logout"
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sign out" />
        </MenuItem>
      </Menu>
    </Box>
  );
}

export const APP_SIDEBAR_WIDTH = SIDEBAR_WIDTH;
