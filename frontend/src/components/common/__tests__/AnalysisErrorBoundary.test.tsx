/**
 * AnalysisErrorBoundary — behavior tests (D2 fix, Day 11a).
 *
 * Asserts the contract that prevents Issue D2 from recurring:
 *   1. Children render normally when no error
 *   2. Fallback renders + children unmount when a child throws
 *   3. resetKey change clears the error state and re-mounts children
 *   4. onError callback fires once per caught error (telemetry hook)
 *   5. The fallback has the expected testid + retry button
 *   6. Retry button re-mounts the children (and if the bug is still
 *      deterministic, falls back into the error state again — that's
 *      expected behavior)
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { AnalysisErrorBoundary } from '../AnalysisErrorBoundary';

// A child component we can selectively throw from. The error is
// generated DURING render (mirrors AnalysisResults's failure mode).
function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }): ReactElement {
  if (shouldThrow) {
    throw new Error('Test error from ThrowingChild');
  }
  return <div data-testid="child-content">Child rendered OK</div>;
}

// Suppress React's default uncaught-error console output during tests
// — we're intentionally throwing, and the noise drowns the actual
// failures. Restored after each test.
function silenceErrorConsole(): () => void {
  const originalError = console.error;
  console.error = vi.fn();
  return () => {
    console.error = originalError;
  };
}

describe('AnalysisErrorBoundary (D2 fix, Day 11a)', () => {
  // ===== 1. Children render normally =====

  it('renders children normally when no error is thrown', () => {
    render(
      <AnalysisErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </AnalysisErrorBoundary>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(
      screen.queryByTestId('analysis-error-boundary-fallback')
    ).not.toBeInTheDocument();
  });

  // ===== 2. Fallback renders when a child throws =====

  it('renders fallback when a child throws during render', () => {
    const restore = silenceErrorConsole();
    render(
      <AnalysisErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </AnalysisErrorBoundary>
    );
    expect(
      screen.getByTestId('analysis-error-boundary-fallback')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/detailed analysis tabs couldn't load/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
    restore();
  });

  // ===== 3. Reset on resetKey change =====

  it('resets when resetKey changes (e.g., user navigates to a different deal)', () => {
    const restore = silenceErrorConsole();

    // We need a parent harness that can BOTH change the resetKey AND
    // change the shouldThrow flag — otherwise even after the resetKey
    // change, the child immediately throws again and we never see the
    // children render.
    function Harness({
      resetKey,
      shouldThrow,
    }: {
      resetKey: string;
      shouldThrow: boolean;
    }): ReactElement {
      return (
        <AnalysisErrorBoundary resetKey={resetKey}>
          <ThrowingChild shouldThrow={shouldThrow} />
        </AnalysisErrorBoundary>
      );
    }

    const { rerender } = render(
      <Harness resetKey="deal-1" shouldThrow={true} />
    );
    expect(
      screen.getByTestId('analysis-error-boundary-fallback')
    ).toBeInTheDocument();

    // Navigate to a "different deal" — change BOTH resetKey + the
    // shouldThrow flag (the new deal renders cleanly). This is the
    // realistic scenario: a previously-broken deal-id might have data
    // the legacy tabs can't parse, while a different deal-id might be
    // fine.
    rerender(<Harness resetKey="deal-2" shouldThrow={false} />);
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(
      screen.queryByTestId('analysis-error-boundary-fallback')
    ).not.toBeInTheDocument();

    restore();
  });

  // ===== 4. onError telemetry hook =====

  it('invokes onError exactly once when a child throws', () => {
    const restore = silenceErrorConsole();
    const onError = vi.fn();
    render(
      <AnalysisErrorBoundary onError={onError}>
        <ThrowingChild shouldThrow={true} />
      </AnalysisErrorBoundary>
    );
    expect(onError).toHaveBeenCalledTimes(1);
    const [err, info] = onError.mock.calls[0];
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe('Test error from ThrowingChild');
    expect(info.componentStack).toBeDefined();
    restore();
  });

  // ===== 5. Retry button =====

  it('renders a Retry button in the fallback', () => {
    const restore = silenceErrorConsole();
    render(
      <AnalysisErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </AnalysisErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    restore();
  });

  it('Retry clears the error state — children re-mount when the bug is gone', async () => {
    const restore = silenceErrorConsole();
    const user = userEvent.setup();

    // Harness: a button outside the boundary toggles shouldThrow.
    // Lets us simulate "the bug was fixed in the meantime."
    function Harness(): ReactElement {
      const [shouldThrow, setShouldThrow] = useState(true);
      return (
        <>
          <button
            type="button"
            data-testid="harness-toggle"
            onClick={() => setShouldThrow(false)}
          >
            Fix the bug
          </button>
          <AnalysisErrorBoundary>
            <ThrowingChild shouldThrow={shouldThrow} />
          </AnalysisErrorBoundary>
        </>
      );
    }

    render(<Harness />);
    expect(
      screen.getByTestId('analysis-error-boundary-fallback')
    ).toBeInTheDocument();

    // Simulate "bug fixed" — then click Retry.
    await user.click(screen.getByTestId('harness-toggle'));
    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(
      screen.queryByTestId('analysis-error-boundary-fallback')
    ).not.toBeInTheDocument();
    restore();
  });
});
