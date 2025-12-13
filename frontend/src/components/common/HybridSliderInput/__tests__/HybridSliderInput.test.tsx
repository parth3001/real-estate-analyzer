/**
 * HybridSliderInput Component Tests
 *
 * Testing Strategy:
 * 1. Slider and text input synchronization
 * 2. Out-of-range value handling (Josh's precision requirement)
 * 3. Currency vs percentage formatting
 * 4. Slider marks rendering
 * 5. Warning display for out-of-range values
 * 6. Keyboard input for text field
 * 7. Accessibility (ARIA labels, keyboard nav)
 * 8. Mobile interaction patterns
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../../test/utils/test-utils';
import { HybridSliderInput } from '../HybridSliderInput';

describe('HybridSliderInput Component', () => {
  const defaultProps = {
    label: 'Monthly Rent',
    value: 2000,
    onChange: vi.fn(),
    min: 500,
    max: 5000,
    step: 50,
    unit: 'currency' as const
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Phase 1: Universal Simple - Basic Rendering', () => {
    it('should render label and value correctly', () => {
      render(<HybridSliderInput {...defaultProps} />);

      expect(screen.getByText('Monthly Rent')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2000')).toBeInTheDocument();
    });

    it('should render slider and text input', () => {
      render(<HybridSliderInput {...defaultProps} />);

      const slider = screen.getByRole('slider');
      const textInput = screen.getByRole('spinbutton');

      expect(slider).toBeInTheDocument();
      expect(textInput).toBeInTheDocument();
    });

    it('should display currency adornments correctly', () => {
      render(<HybridSliderInput {...defaultProps} unit="currency" />);

      // Check for $ symbol and /mo
      expect(screen.getByText('$')).toBeInTheDocument();
      expect(screen.getByText('/mo')).toBeInTheDocument();
    });

    it('should display percentage adornments correctly', () => {
      render(<HybridSliderInput {...defaultProps} unit="percentage" value={5} />);

      expect(screen.getByText('%')).toBeInTheDocument();
    });

    it('should render optional helper text', () => {
      render(<HybridSliderInput {...defaultProps} helperText="Based on market average" />);

      expect(screen.getByText('Based on market average')).toBeInTheDocument();
    });

    it('should render slider marks when provided', () => {
      const marks = [
        { value: 500, label: '$500' },
        { value: 2500, label: 'Market Avg' },
        { value: 5000, label: '$5,000' }
      ];

      render(<HybridSliderInput {...defaultProps} marks={marks} />);

      expect(screen.getByText('$500')).toBeInTheDocument();
      expect(screen.getByText('Market Avg')).toBeInTheDocument();
      expect(screen.getByText('$5,000')).toBeInTheDocument();
    });
  });

  describe('Slider Interaction', () => {
    it('should call onChange when slider is moved', async () => {
      const onChange = vi.fn();
      render(<HybridSliderInput {...defaultProps} onChange={onChange} />);

      const slider = screen.getByRole('slider');

      // Simulate slider change
      slider.dispatchEvent(new Event('change', { bubbles: true }));

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });

    it('should update slider value when value prop changes', () => {
      const { rerender } = render(<HybridSliderInput {...defaultProps} value={2000} />);

      const slider = screen.getByRole('slider') as HTMLInputElement;
      expect(slider.value).toBe('2000');

      rerender(<HybridSliderInput {...defaultProps} value={3000} />);
      expect(slider.value).toBe('3000');
    });

    it('should respect min, max, and step props', () => {
      render(<HybridSliderInput {...defaultProps} min={100} max={1000} step={25} />);

      const slider = screen.getByRole('slider') as HTMLInputElement;
      expect(slider.min).toBe('100');
      expect(slider.max).toBe('1000');
      expect(slider.step).toBe('25');
    });
  });

  describe('Text Input Interaction', () => {
    it('should call onChange when text input value changes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<HybridSliderInput {...defaultProps} value={2000} onChange={onChange} />);

      const textInput = screen.getByRole('spinbutton');

      // Clear and type new value
      await user.clear(textInput);
      await user.type(textInput, '2500');

      expect(onChange).toHaveBeenCalledWith(2500);
    });

    it('should handle decimal input correctly', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<HybridSliderInput {...defaultProps} onChange={onChange} />);

      const textInput = screen.getByRole('spinbutton');

      await user.clear(textInput);
      await user.type(textInput, '2500.50');

      expect(onChange).toHaveBeenCalledWith(2500.5);
    });

    it('should ignore invalid input', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<HybridSliderInput {...defaultProps} onChange={onChange} />);

      const textInput = screen.getByRole('spinbutton');

      await user.clear(textInput);
      await user.type(textInput, 'invalid');

      // Should not call onChange with NaN
      expect(onChange).not.toHaveBeenCalledWith(NaN);
    });

    it('should have tabular-nums font for monospaced numbers', () => {
      render(<HybridSliderInput {...defaultProps} />);

      const textInput = screen.getByRole('spinbutton');
      const inputStyle = window.getComputedStyle(textInput);

      expect(inputStyle.fontVariantNumeric).toBe('tabular-nums');
    });
  });

  describe('Out-of-Range Value Handling (Josh\'s Requirement)', () => {
    it('should display warning when value is above max', () => {
      render(<HybridSliderInput {...defaultProps} value={6000} />); // Above max of 5000

      expect(screen.getByText(/outside typical range/i)).toBeInTheDocument();
      expect(screen.getByText(/\$6,000/)).toBeInTheDocument(); // Shows actual value
    });

    it('should display warning when value is below min', () => {
      render(<HybridSliderInput {...defaultProps} value={100} />); // Below min of 500

      expect(screen.getByText(/outside typical range/i)).toBeInTheDocument();
      expect(screen.getByText(/\$100/)).toBeInTheDocument();
    });

    it('should not display warning when value is within range', () => {
      render(<HybridSliderInput {...defaultProps} value={2000} />); // Within 500-5000

      expect(screen.queryByText(/outside typical range/i)).not.toBeInTheDocument();
    });

    it('should disable slider when value is out of range', () => {
      render(<HybridSliderInput {...defaultProps} value={6000} />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeDisabled();
    });

    it('should keep text input enabled when value is out of range', () => {
      render(<HybridSliderInput {...defaultProps} value={6000} />);

      const textInput = screen.getByRole('spinbutton');
      expect(textInput).not.toBeDisabled();
    });

    it('should allow user to input out-of-range values via text input', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<HybridSliderInput {...defaultProps} onChange={onChange} />);

      const textInput = screen.getByRole('spinbutton');

      // Input value above max
      await user.clear(textInput);
      await user.type(textInput, '10000');

      expect(onChange).toHaveBeenCalledWith(10000);
    });

    it('should show percentage format in warning message', () => {
      render(
        <HybridSliderInput
          {...defaultProps}
          unit="percentage"
          value={150}
          min={0}
          max={100}
        />
      );

      expect(screen.getByText(/150%/)).toBeInTheDocument();
      expect(screen.getByText(/0% - 100%/)).toBeInTheDocument();
    });
  });

  describe('Slider-Text Synchronization', () => {
    it('should sync text input when slider changes', async () => {
      const onChange = vi.fn();
      render(<HybridSliderInput {...defaultProps} onChange={onChange} />);

      const slider = screen.getByRole('slider');

      // Change slider value
      // Note: Actual slider interaction in tests is complex, testing callback
      slider.dispatchEvent(new Event('change', { bubbles: true }));

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });

    it('should keep slider at min value when text value is out of range', () => {
      render(<HybridSliderInput {...defaultProps} value={10000} />); // Above max

      const slider = screen.getByRole('slider') as HTMLInputElement;
      expect(slider.value).toBe(String(defaultProps.min)); // Should show min value
    });
  });

  describe('Disabled State', () => {
    it('should disable both slider and text input when disabled prop is true', () => {
      render(<HybridSliderInput {...defaultProps} disabled={true} />);

      const slider = screen.getByRole('slider');
      const textInput = screen.getByRole('spinbutton');

      expect(slider).toBeDisabled();
      expect(textInput).toBeDisabled();
    });

    it('should not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<HybridSliderInput {...defaultProps} disabled={true} onChange={onChange} />);

      const textInput = screen.getByRole('spinbutton');

      // Try to change value
      await user.clear(textInput);
      await user.type(textInput, '3000');

      // Should not have been called
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Apple Design System Compliance', () => {
    it('should use 12px border radius on text input', () => {
      render(<HybridSliderInput {...defaultProps} />);

      const textInput = screen.getByRole('spinbutton').closest('.MuiOutlinedInput-root');
      expect(textInput).toHaveStyle({ borderRadius: '12px' });
    });

    it('should use Apple color scheme for slider', () => {
      render(<HybridSliderInput {...defaultProps} />);

      const slider = screen.getByRole('slider');

      // Should use appleColors.primary[500] (#3B82F6)
      expect(slider.parentElement).toHaveStyle({ color: '#3B82F6' });
    });

    it('should have smooth transitions', () => {
      render(<HybridSliderInput {...defaultProps} />);

      const slider = screen.getByRole('slider').querySelector('.MuiSlider-thumb') as HTMLElement;

      // Should have transition with appleDurations.shorter (200ms)
      expect(slider).toHaveStyle({ transition: expect.stringContaining('200ms') });
    });

    it('should use warning color for out-of-range alert', () => {
      render(<HybridSliderInput {...defaultProps} value={10000} />);

      const alert = screen.getByText(/outside typical range/i).closest('.MuiAlert-root');

      // Should use orange color scheme
      expect(alert).toHaveStyle({ backgroundColor: expect.stringContaining('#FFF7ED') });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label for slider', () => {
      render(<HybridSliderInput {...defaultProps} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAccessibleName();
    });

    it('should have accessible label for text input', () => {
      render(<HybridSliderInput {...defaultProps} />);

      const textInput = screen.getByRole('spinbutton');
      expect(textInput).toHaveAccessibleName();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<HybridSliderInput {...defaultProps} />);

      // Tab to slider
      await user.tab();
      const slider = screen.getByRole('slider');
      expect(slider).toHaveFocus();

      // Tab to text input
      await user.tab();
      const textInput = screen.getByRole('spinbutton');
      expect(textInput).toHaveFocus();
    });

    it('should support arrow keys for slider navigation', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<HybridSliderInput {...defaultProps} onChange={onChange} />);

      const slider = screen.getByRole('slider');
      slider.focus();

      // Press arrow right
      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });
  });

  describe('Performance Tests', () => {
    it('should render quickly', () => {
      const startTime = performance.now();
      render(<HybridSliderInput {...defaultProps} />);
      const endTime = performance.now();

      // Should render in less than 50ms
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should handle rapid value changes without lag', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<HybridSliderInput {...defaultProps} onChange={onChange} />);

      const textInput = screen.getByRole('spinbutton');

      // Rapidly change values
      for (let i = 0; i < 10; i++) {
        await user.clear(textInput);
        await user.type(textInput, String(1000 + i * 100));
      }

      // Should handle all changes
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero value correctly', () => {
      render(<HybridSliderInput {...defaultProps} value={0} />);

      expect(screen.getByDisplayValue('0')).toBeInTheDocument();
    });

    it('should handle negative values in text input', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<HybridSliderInput {...defaultProps} onChange={onChange} />);

      const textInput = screen.getByRole('spinbutton');

      await user.clear(textInput);
      await user.type(textInput, '-100');

      // Should allow negative input (onChange will be called with -100)
      expect(onChange).toHaveBeenCalledWith(-100);
    });

    it('should handle very large numbers', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<HybridSliderInput {...defaultProps} onChange={onChange} />);

      const textInput = screen.getByRole('spinbutton');

      await user.clear(textInput);
      await user.type(textInput, '999999999');

      expect(onChange).toHaveBeenCalledWith(999999999);
    });

    it('should handle decimal step values', () => {
      render(<HybridSliderInput {...defaultProps} step={0.1} />);

      const slider = screen.getByRole('slider') as HTMLInputElement;
      expect(slider.step).toBe('0.1');
    });

    it('should show correct formatting with very small percentages', () => {
      render(
        <HybridSliderInput
          {...defaultProps}
          unit="percentage"
          value={0.5}
          min={0}
          max={10}
        />
      );

      expect(screen.getByDisplayValue('0.5')).toBeInTheDocument();
    });
  });
});
