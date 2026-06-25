/**
 * AuthModalContext — Issue #193 (#36 follow-on, 2026-06-24).
 *
 * Replaces full-page nav to /login or /register with an in-place modal
 * over whatever the user was looking at (chat, workspace, landing).
 *
 * Why a modal vs. a route:
 *   - During the "I want to save this deal!" moment, a page transition
 *     interrupts conversion. Anonymous-user CTAs are highest-intent
 *     surfaces; preserving visual context across auth is a measured
 *     conversion win.
 *   - Same backend, same magic-link, same pendingChatClaim flow — purely
 *     a frontend UX swap. /login + /register routes stay for direct
 *     links + bookmarks.
 *
 * Usage:
 *   const { open } = useAuthModal();
 *   open({ source: 'save-deal', ref: 'unlock' });
 *
 * Sources:
 *   - 'sign-in'      → header "Sign in" / inline lock-card "Sign in"
 *   - 'save-deal'    → "Save this deal" / "Add to my portfolio" CTAs
 *   - 'email-cta'    → Future: gated email-cta on free-tier limits
 *   - 'generic'      → catch-all
 *
 * The source is passed through to the modal so it can render
 * context-aware copy (e.g. "Sign up to save this deal" vs. "Welcome back").
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { AuthModal } from '../components/auth/AuthModal';

export type AuthModalSource =
  | 'sign-in'
  | 'save-deal'
  | 'email-cta'
  | 'generic';

export interface AuthModalOpenOptions {
  /** What CTA triggered the modal — drives copy. */
  source?: AuthModalSource;
  /** Optional ref tag for analytics + copy variants (mirrors LoginPage ?ref=). */
  ref?: 'unlock' | null;
}

interface AuthModalContextValue {
  open: (opts?: AuthModalOpenOptions) => void;
  close: () => void;
  isOpen: boolean;
}

const AuthModalContext = createContext<AuthModalContextValue | undefined>(
  undefined
);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [opts, setOpts] = useState<AuthModalOpenOptions>({});

  const open = useCallback((next?: AuthModalOpenOptions) => {
    setOpts(next ?? {});
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo<AuthModalContextValue>(
    () => ({ open, close, isOpen }),
    [open, close, isOpen]
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal
        open={isOpen}
        onClose={close}
        source={opts.source ?? 'generic'}
        refTag={opts.ref ?? null}
      />
    </AuthModalContext.Provider>
  );
};

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return ctx;
}
