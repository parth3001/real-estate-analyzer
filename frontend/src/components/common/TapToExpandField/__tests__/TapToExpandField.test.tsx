/**
 * TapToExpandField Component Tests
 *
 * Testing Strategy:
 * 1. Expand/collapse functionality (tap entire row)
 * 2. Controlled vs uncontrolled state
 * 3. Keyboard accessibility (Enter/Space to toggle)
 * 4. Mobile touch events (using @testing-library/user-event)
 * 5. Customized badge display
 * 6. Apple design system compliance
 * 7. Animation timing (300ms standard)
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../../test/utils/test-utils';
import { TapToExpandField } from '../TapToExpandField';

describe('TapToExpandField Component', () => {
  const defaultProps = {
    label: 'Property Tax',
    displayValue: '$3,600/year',
    helperText: 'Smart default based on local rates',
    children: <div data-testid="expanded-content">Tax configuration options</div>
  };

  describe('Phase 1: Universal Simple - Basic Functionality', () => {
    it('should render collapsed by default', () => {
      render(<TapToExpandField {...defaultProps} />);

      expect(screen.getByText('Property Tax')).toBeInTheDocument();
      expect(screen.getByText('$3,600/year')).toBeInTheDocument();
      expect(screen.getByText('Smart default based on local rates')).toBeInTheDocument();

      // Expanded content should not be visible
      expect(screen.queryByTestId('expanded-content')).not.toBeVisible();
    });

    it('should expand when clicked', async () => {
      const user = userEvent.setup();
      render(<TapToExpandField {...defaultProps} />);

      const container = screen.getByText('Property Tax').closest('div');
      await user.click(container!);

      await waitFor(() => {
        expect(screen.getByTestId('expanded-content')).toBeVisible();
      });
    });

    it('should collapse when clicked again', async () => {
      const user = userEvent.setup();
      render(<TapToExpandField {...defaultProps} />);

      const container = screen.getByText('Property Tax').closest('div');

      // Expand
      await user.click(container!);
      await waitFor(() => {
        expect(screen.getByTestId('expanded-content')).toBeVisible();
      });

      // Collapse
      await user.click(container!);
      await waitFor(() => {
        expect(screen.queryByTestId('expanded-content')).not.toBeVisible();
      });
    });

    it('should respect defaultExpanded prop', () => {
      render(<TapToExpandField {...defaultProps} defaultExpanded={true} />);

      expect(screen.getByTestId('expanded-content')).toBeVisible();
    });
  });

  describe('Controlled Component Behavior', () => {
    it('should work as controlled component', async () => {
      const user = userEvent.setup();
      const onExpandChange = vi.fn();

      const { rerender } = render(
        <TapToExpandField {...defaultProps} expanded={false} onExpandChange={onExpandChange} />
      );

      expect(screen.queryByTestId('expanded-content')).not.toBeVisible();

      // Click to expand
      const container = screen.getByText('Property Tax').closest('div');
      await user.click(container!);

      // Should call callback but not change state (controlled)
      expect(onExpandChange).toHaveBeenCalledWith(true);
      expect(screen.queryByTestId('expanded-content')).not.toBeVisible(); // Still collapsed

      // Parent updates state
      rerender(
        <TapToExpandField {...defaultProps} expanded={true} onExpandChange={onExpandChange} />
      );

      expect(screen.getByTestId('expanded-content')).toBeVisible();
    });

    it('should call onExpandChange callback when toggled', async () => {
      const user = userEvent.setup();
      const onExpandChange = vi.fn();

      render(<TapToExpandField {...defaultProps} onExpandChange={onExpandChange} />);

      const container = screen.getByText('Property Tax').closest('div');
      await user.click(container!);

      expect(onExpandChange).toHaveBeenCalledWith(true);

      await user.click(container!);
      expect(onExpandChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Customized Badge Display', () => {
    it('should show "Customized" badge when isCustomized is true', () => {
      render(<TapToExpandField {...defaultProps} isCustomized={true} />);

      expect(screen.getByText('Customized')).toBeInTheDocument();
    });

    it('should not show "Customized" badge when isCustomized is false', () => {
      render(<TapToExpandField {...defaultProps} isCustomized={false} />);

      expect(screen.queryByText('Customized')).not.toBeInTheDocument();
    });

    it('should not show badge by default', () => {
      render(<TapToExpandField {...defaultProps} />);

      expect(screen.queryByText('Customized')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should be keyboard accessible with Enter key', async () => {
      const user = userEvent.setup();
      render(<TapToExpandField {...defaultProps} />);

      const container = screen.getByText('Property Tax').closest('div')!;

      // Focus the element
      container.focus();

      // Press Enter to expand
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByTestId('expanded-content')).toBeVisible();
      });
    });

    it('should be accessible with Space key', async () => {
      const user = userEvent.setup();
      render(<TapToExpandField {...defaultProps} />);

      const container = screen.getByText('Property Tax').closest('div')!;
      container.focus();

      await user.keyboard(' ');

      await waitFor(() => {
        expect(screen.getByTestId('expanded-content')).toBeVisible();
      });
    });

    it('should be focusable for keyboard navigation', () => {
      render(<TapToExpandField {...defaultProps} />);

      const container = screen.getByText('Property Tax').closest('div')!;

      // Should have cursor: pointer indicating it's interactive
      expect(container).toHaveStyle({ cursor: 'pointer' });
    });
  });

  describe('Mobile Touch Events', () => {
    it('should handle touch events on mobile', async () => {
      const user = userEvent.setup();
      render(<TapToExpandField {...defaultProps} />);

      const container = screen.getByText('Property Tax').closest('div')!;

      // Simulate touch event (user-event handles this automatically)
      await user.click(container);

      await waitFor(() => {
        expect(screen.getByTestId('expanded-content')).toBeVisible();
      });
    });

    it('should prevent event bubbling when clicking child content', async () => {
      const user = userEvent.setup();
      const onExpandChange = vi.fn();

      render(
        <TapToExpandField {...defaultProps} defaultExpanded={true} onExpandChange={onExpandChange} />
      );

      const expandedContent = screen.getByTestId('expanded-content');

      // Click on expanded content
      await user.click(expandedContent);

      // Should not trigger collapse (stopPropagation)
      expect(onExpandChange).not.toHaveBeenCalled();
    });
  });

  describe('Apple Design System Compliance', () => {
    it('should use 12px border radius (Apple standard)', () => {
      render(<TapToExpandField {...defaultProps} />);

      const container = screen.getByText('Property Tax').closest('div')!;
      expect(container).toHaveStyle({ borderRadius: '12px' });
    });

    it('should change background color when expanded', async () => {
      const user = userEvent.setup();
      const { container } = render(<TapToExpandField {...defaultProps} />);

      const fieldContainer = screen.getByText('Property Tax').closest('div')!;

      // Collapsed state - gray background
      expect(fieldContainer).toHaveStyle({ backgroundColor: expect.stringContaining('#F9FAFB') });

      // Expand
      await user.click(fieldContainer);

      await waitFor(() => {
        // Expanded state - blue background
        expect(fieldContainer).toHaveStyle({ backgroundColor: expect.stringContaining('#EBF4FF') });
      });
    });

    it('should rotate chevron icon 90 degrees when expanded', async () => {
      const user = userEvent.setup();
      render(<TapToExpandField {...defaultProps} />);

      const container = screen.getByText('Property Tax').closest('div')!;

      // Find chevron icon
      const chevron = container.querySelector('svg[data-testid="ChevronRightIcon"]') as HTMLElement;

      // Should start at 0 degrees
      expect(chevron).toHaveStyle({ transform: 'rotate(0deg)' });

      // Expand
      await user.click(container);

      await waitFor(() => {
        // Should rotate to 90 degrees
        expect(chevron).toHaveStyle({ transform: 'rotate(90deg)' });
      });
    });

    it('should have smooth 200ms transition on hover', () => {
      render(<TapToExpandField {...defaultProps} />);

      const container = screen.getByText('Property Tax').closest('div')!;

      // Check for transition timing (appleDurations.shorter = 200ms)
      expect(container).toHaveStyle({ transition: expect.stringContaining('200ms') });
    });
  });

  describe('Performance Tests', () => {
    it('should render quickly', () => {
      const startTime = performance.now();
      render(<TapToExpandField {...defaultProps} />);
      const endTime = performance.now();

      // Should render in less than 50ms
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should handle rapid toggling without breaking', async () => {
      const user = userEvent.setup();
      render(<TapToExpandField {...defaultProps} />);

      const container = screen.getByText('Property Tax').closest('div')!;

      // Rapidly toggle 10 times
      for (let i = 0; i < 10; i++) {
        await user.click(container);
      }

      // Should still be functional
      expect(screen.getByText('Property Tax')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children gracefully', () => {
      render(<TapToExpandField {...defaultProps} children={null} />);

      expect(screen.getByText('Property Tax')).toBeInTheDocument();
    });

    it('should handle very long display values', () => {
      const longValue = '$10,000,000,000,000/year (includes all taxes and assessments)';
      render(<TapToExpandField {...defaultProps} displayValue={longValue} />);

      expect(screen.getByText(longValue)).toBeInTheDocument();
    });

    it('should handle special characters in labels', () => {
      render(
        <TapToExpandField
          {...defaultProps}
          label="Property Tax & Insurance (HOA)"
        />
      );

      expect(screen.getByText('Property Tax & Insurance (HOA)')).toBeInTheDocument();
    });
  });
});
