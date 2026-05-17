/**
 * AppPage — smoke tests covering the Phase 3+4 anon-vs-authed split.
 *
 * The component does only three things, all of which are easy to lock:
 *   1. Anonymous users: render ChatOverlay full-bleed, no sidebar.
 *      Preserves the hero-embed entry shape (W6-S2b).
 *   2. Authenticated users: render ChatOverlay wrapped in AppLayout
 *      (which contributes the AppSidebar).
 *   3. initialUserInput from location.state forwards to ChatOverlay
 *      so LandingPage's hero input still triggers turn 1 auto-submit.
 *
 * We mock ChatOverlay + AppLayout so the test stays a layout-contract
 * smoke test, NOT an end-to-end render of the chat or sidebar (those
 * have their own dedicated test files).
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AppPage from '../AppPage';

// Mock ChatOverlay — we just need to verify it mounts and receives the
// expected props.
vi.mock('../../components/Chat/ChatOverlay', () => ({
  ChatOverlay: (props: {
    initialUserInput?: string;
    currentUserFirstName?: string;
    currentUserIsAuthed?: boolean;
  }) => (
    <div
      data-testid="mock-chat-overlay"
      data-initial-user-input={props.initialUserInput ?? ''}
      data-authed={props.currentUserIsAuthed ? 'true' : 'false'}
      data-firstname={props.currentUserFirstName ?? ''}
    />
  ),
}));

// Mock AppLayout — preserves children but adds a marker we can assert.
vi.mock('../../components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-app-layout">{children}</div>
  ),
}));

// useAuth mock — flipped per test via the holder ref. Vitest doesn't
// let us reassign module-mock returns mid-test without `mockReturnValue`,
// so we use a mutable holder.
const authHolder: { user: { firstName: string; email: string } | null } = {
  user: null,
};
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: authHolder.user,
    isAuthenticated: authHolder.user !== null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    error: null,
  }),
}));

function renderAppPageAt(
  pathname: string,
  state?: { initialUserInput?: string }
) {
  return render(
    <MemoryRouter initialEntries={[{ pathname, state }]}>
      <Routes>
        <Route path="/app" element={<AppPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AppPage', () => {
  it('anonymous users get a full-bleed ChatOverlay with NO AppLayout sidebar', () => {
    authHolder.user = null;
    renderAppPageAt('/app');

    expect(screen.getByTestId('mock-chat-overlay')).toBeInTheDocument();
    // The sidebar wrapper should NOT mount for anon users.
    expect(screen.queryByTestId('mock-app-layout')).not.toBeInTheDocument();
  });

  it('authenticated users get ChatOverlay wrapped in AppLayout', () => {
    authHolder.user = { firstName: 'Parth', email: 'p@example.com' };
    renderAppPageAt('/app');

    expect(screen.getByTestId('mock-app-layout')).toBeInTheDocument();
    expect(screen.getByTestId('mock-chat-overlay')).toBeInTheDocument();
    // ChatOverlay should be a descendant of AppLayout (not sibling).
    const layout = screen.getByTestId('mock-app-layout');
    expect(
      layout.contains(screen.getByTestId('mock-chat-overlay'))
    ).toBe(true);
  });

  it('forwards initialUserInput from location.state to ChatOverlay', () => {
    authHolder.user = null;
    renderAppPageAt('/app', { initialUserInput: 'analyze 123 Main St' });

    const overlay = screen.getByTestId('mock-chat-overlay');
    expect(overlay.getAttribute('data-initial-user-input')).toBe(
      'analyze 123 Main St'
    );
  });

  it('passes the user firstName + isAuthed flag to ChatOverlay for empty-state personalization', () => {
    authHolder.user = { firstName: 'Parth', email: 'p@example.com' };
    renderAppPageAt('/app');

    const overlay = screen.getByTestId('mock-chat-overlay');
    expect(overlay.getAttribute('data-authed')).toBe('true');
    expect(overlay.getAttribute('data-firstname')).toBe('Parth');
  });
});
