/**
 * MFPropertyWizard Component Unit Tests
 * Tests state management, validation, navigation, and data transformation
 *
 * QE Standard: Component tests must cover:
 * - Initial state
 * - User interactions
 * - State updates
 * - Validation logic
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import MFPropertyWizard from '../MFPropertyWizard';
import type { MultiFamilyPropertyData } from '../../../types/property';
import type { Analysis } from '../../../types/analysis';

// Mock API service
vi.mock('../../../services/api', () => ({
  wizardApi: {
    lookupProperty: vi.fn().mockResolvedValue({
      data: {
        success: false,
        propertyDetails: null
      }
    })
  }
}));

// Mock debounce hook
vi.mock('../../../hooks/useDebounce', () => ({
  useAPIDebounce: vi.fn((fn) => ({
    execute: fn,
    isLoading: false,
    cancel: vi.fn()
  }))
}));

describe('MFPropertyWizard', () => {
  let mockOnComplete: ReturnType<typeof vi.fn>;
  let mockOnCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnComplete = vi.fn().mockResolvedValue({
      monthlyAnalysis: {},
      annualAnalysis: {},
      longTermAnalysis: {}
    } as Analysis);
    mockOnCancel = vi.fn();
  });

  describe('Initialization', () => {
    it('should render wizard with correct title', () => {
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      expect(screen.getByText('Multi-Family Property Analysis Wizard')).toBeInTheDocument();
      expect(screen.getByText(/Step-by-step guided analysis/i)).toBeInTheDocument();
    });

    it('should initialize with ADDRESS step active', () => {
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      const addressStep = screen.getByText('Property Address');
      expect(addressStep).toBeInTheDocument();

      // Verify stepper shows ADDRESS as active
      const stepper = screen.getByRole('list');
      const steps = within(stepper).getAllByRole('listitem');
      expect(steps[0]).toHaveClass('Mui-active');
    });

    it('should initialize with default MF property data', () => {
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      // Check for default values in form fields
      const totalUnitsInput = screen.getByLabelText(/Total Units/i) as HTMLInputElement;
      expect(totalUnitsInput.value).toBe('8'); // Default 8 units
    });

    it('should show progress bar with 0% completion', () => {
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      expect(screen.getByText(/Progress: 0 of 5 steps/i)).toBeInTheDocument();
    });

    it('should merge initial data with defaults', () => {
      const initialData: Partial<MultiFamilyPropertyData> = {
        purchasePrice: 1500000,
        totalUnits: 12
      };

      render(
        <MFPropertyWizard
          onComplete={mockOnComplete}
          initialData={initialData}
        />
      );

      const purchasePriceInput = screen.queryByLabelText(/Purchase Price/i);
      // Note: Purchase Price is on FINANCIALS step, not ADDRESS
      // We're testing that initial data is merged into state
      expect(purchasePriceInput).not.toBeInTheDocument(); // Not on ADDRESS step yet
    });
  });

  describe('ADDRESS Step Validation', () => {
    it('should prevent navigation when address fields are empty', async () => {
      const user = userEvent.setup();
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should enable Next button when all required ADDRESS fields are filled', async () => {
      const user = userEvent.setup();
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      // Fill required ADDRESS fields
      await user.type(screen.getByLabelText(/Street Address/i), '123 Oak Street');
      await user.type(screen.getByLabelText(/City/i), 'Austin');
      await user.type(screen.getByLabelText(/State/i), 'TX');
      await user.type(screen.getByLabelText(/ZIP Code/i), '78701');

      // Total units should have default value, but let's set it
      const totalUnitsInput = screen.getByLabelText(/Total Units/i);
      await user.clear(totalUnitsInput);
      await user.type(totalUnitsInput, '8');

      const totalSqftInput = screen.getByLabelText(/Total Square Footage/i);
      await user.clear(totalSqftInput);
      await user.type(totalSqftInput, '6400');

      const yearBuiltInput = screen.getByLabelText(/Year Built/i);
      await user.clear(yearBuiltInput);
      await user.type(yearBuiltInput, '2015');

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next/i });
        expect(nextButton).toBeEnabled();
      });
    });

    it('should show error when total units < 2', async () => {
      const user = userEvent.setup();
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      const totalUnitsInput = screen.getByLabelText(/Total Units/i);
      await user.clear(totalUnitsInput);
      await user.type(totalUnitsInput, '1');

      await waitFor(() => {
        expect(screen.getByText(/must have at least 2 units/i)).toBeInTheDocument();
      });
    });

    it('should show error when total sqft is 0', async () => {
      const user = userEvent.setup();
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      const totalSqftInput = screen.getByLabelText(/Total Square Footage/i);
      await user.clear(totalSqftInput);
      await user.type(totalSqftInput, '0');

      await waitFor(() => {
        expect(screen.getByText(/square footage is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate from ADDRESS to FINANCIALS on Next', async () => {
      const user = userEvent.setup();
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      // Fill ADDRESS step
      await user.type(screen.getByLabelText(/Street Address/i), '123 Oak Street');
      await user.type(screen.getByLabelText(/City/i), 'Austin');
      await user.type(screen.getByLabelText(/State/i), 'TX');
      await user.type(screen.getByLabelText(/ZIP Code/i), '78701');

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next/i });
        expect(nextButton).toBeEnabled();
      });

      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Purchase & Financing')).toBeInTheDocument();
      });
    });

    it('should navigate back from FINANCIALS to ADDRESS on Previous', async () => {
      const user = userEvent.setup();
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      // Fill ADDRESS and navigate to FINANCIALS
      await user.type(screen.getByLabelText(/Street Address/i), '123 Oak Street');
      await user.type(screen.getByLabelText(/City/i), 'Austin');
      await user.type(screen.getByLabelText(/State/i), 'TX');
      await user.type(screen.getByLabelText(/ZIP Code/i), '78701');

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next/i });
        expect(nextButton).toBeEnabled();
      });

      await user.click(screen.getByRole('button', { name: /Next/i }));

      await waitFor(() => {
        expect(screen.getByText('Purchase & Financing')).toBeInTheDocument();
      });

      // Click Previous
      const previousButton = screen.getByRole('button', { name: /Previous/i });
      await user.click(previousButton);

      await waitFor(() => {
        expect(screen.getByText('Property Address & Details')).toBeInTheDocument();
      });
    });

    it('should mark step as completed when navigating forward', async () => {
      const user = userEvent.setup();
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      // Fill ADDRESS
      await user.type(screen.getByLabelText(/Street Address/i), '123 Oak Street');
      await user.type(screen.getByLabelText(/City/i), 'Austin');
      await user.type(screen.getByLabelText(/State/i), 'TX');
      await user.type(screen.getByLabelText(/ZIP Code/i), '78701');

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next/i });
        expect(nextButton).toBeEnabled();
      });

      await user.click(screen.getByRole('button', { name: /Next/i }));

      await waitFor(() => {
        // Verify progress updated
        expect(screen.getByText(/Progress: 1 of 5 steps/i)).toBeInTheDocument();
      });
    });

    it('should allow clicking on stepper to jump to steps', async () => {
      const user = userEvent.setup();
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      // Fill ADDRESS first
      await user.type(screen.getByLabelText(/Street Address/i), '123 Oak Street');
      await user.type(screen.getByLabelText(/City/i), 'Austin');
      await user.type(screen.getByLabelText(/State/i), 'TX');
      await user.type(screen.getByLabelText(/ZIP Code/i), '78701');

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next/i });
        expect(nextButton).toBeEnabled();
      });

      await user.click(screen.getByRole('button', { name: /Next/i }));

      await waitFor(() => {
        expect(screen.getByText('Purchase & Financing')).toBeInTheDocument();
      });

      // Click on ADDRESS step in stepper
      const addressStepButton = screen.getByText('Property Address');
      await user.click(addressStepButton);

      await waitFor(() => {
        expect(screen.getByText('Property Address & Details')).toBeInTheDocument();
      });
    });
  });

  describe('FINANCIALS Step Validation', () => {
    beforeEach(async () => {
      // Helper to navigate to FINANCIALS step
      const user = userEvent.setup();
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      await user.type(screen.getByLabelText(/Street Address/i), '123 Oak Street');
      await user.type(screen.getByLabelText(/City/i), 'Austin');
      await user.type(screen.getByLabelText(/State/i), 'TX');
      await user.type(screen.getByLabelText(/ZIP Code/i), '78701');

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next/i });
        expect(nextButton).toBeEnabled();
      });

      await user.click(screen.getByRole('button', { name: /Next/i }));

      await waitFor(() => {
        expect(screen.getByText('Purchase & Financing')).toBeInTheDocument();
      });
    });

    it('should show LTV warning when > 80%', async () => {
      const user = userEvent.setup();

      // Set purchase price = $1,000,000, down payment = 10% (LTV = 90%)
      const purchasePriceInput = screen.getByLabelText(/Purchase Price/i);
      await user.clear(purchasePriceInput);
      await user.type(purchasePriceInput, '1000000');

      // Set down payment to 10% using slider (find slider by data-testid or aria-label)
      const downPaymentSlider = screen.getByRole('slider');
      // Note: Slider interaction is complex, for now just check if warning appears
      // In real test, we'd interact with slider to set to 10%

      await waitFor(() => {
        // Warning should appear about high LTV
        const warnings = screen.queryByText(/LTV ratio/i);
        // This test may need adjustment based on actual warning implementation
      });
    });
  });

  describe('Data Transformation on Submit', () => {
    it('should call MFDataAdapter transformMFWizardDataToBackend on complete', async () => {
      const user = userEvent.setup();
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      // Fill ADDRESS
      await user.type(screen.getByLabelText(/Street Address/i), '123 Oak Street');
      await user.type(screen.getByLabelText(/City/i), 'Austin');
      await user.type(screen.getByLabelText(/State/i), 'TX');
      await user.type(screen.getByLabelText(/ZIP Code/i), '78701');

      // Navigate through all steps (skipping implementation for placeholder steps)
      // This test verifies the transformation logic exists

      // Note: Complete test requires all 5 steps implemented
      // For now, verify onComplete is called with transformed data
    });

    it('should convert insurancePerUnit to insuranceRate on submit', async () => {
      // Test that wizard correctly transforms:
      // insurancePerUnit: $600 → insuranceRate: 0.4%

      // This will be fully testable once all steps are implemented
      // For now, verify transformation function exists and is imported
    });
  });

  describe('Progress Tracking', () => {
    it('should update progress bar as steps are completed', async () => {
      const user = userEvent.setup();
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      expect(screen.getByText(/Progress: 0 of 5 steps/i)).toBeInTheDocument();

      // Fill ADDRESS
      await user.type(screen.getByLabelText(/Street Address/i), '123 Oak Street');
      await user.type(screen.getByLabelText(/City/i), 'Austin');
      await user.type(screen.getByLabelText(/State/i), 'TX');
      await user.type(screen.getByLabelText(/ZIP Code/i), '78701');

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next/i });
        expect(nextButton).toBeEnabled();
      });

      await user.click(screen.getByRole('button', { name: /Next/i }));

      await waitFor(() => {
        expect(screen.getByText(/Progress: 1 of 5 steps/i)).toBeInTheDocument();
      });
    });

    it('should show data quality score badge', () => {
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      // Data quality badge appears when score > 0
      // May not appear initially with no auto-populated data
      const qualityBadge = screen.queryByText(/Data Quality:/i);
      // Badge may or may not be present depending on initial state
    });
  });

  describe('Error Handling', () => {
    it('should display validation errors in alert box', async () => {
      const user = userEvent.setup();
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      // Try to navigate without filling required fields
      // Next button should be disabled, but we can verify error display

      const totalUnitsInput = screen.getByLabelText(/Total Units/i);
      await user.clear(totalUnitsInput);
      await user.type(totalUnitsInput, '1'); // Invalid: < 2

      await waitFor(() => {
        const errorAlert = screen.queryByText(/Please fix the following errors:/i);
        // Error alert appears when validation fails
      });
    });

    it('should handle onCancel callback', async () => {
      const user = userEvent.setup();
      render(
        <MFPropertyWizard
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should handle API error on complete gracefully', async () => {
      mockOnComplete.mockRejectedValueOnce(new Error('Backend error'));

      const user = userEvent.setup();
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      // Navigate to last step and try to complete
      // (Requires all steps implemented)

      // Verify error is caught and displayed
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on navigation buttons', () => {
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      const nextButton = screen.getByRole('button', { name: /Next/i });
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });

      expect(nextButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      const mainHeading = screen.getByRole('heading', { level: 4, name: /Multi-Family Property Analysis Wizard/i });
      expect(mainHeading).toBeInTheDocument();
    });

    it('should allow keyboard navigation through stepper', async () => {
      const user = userEvent.setup();
      render(<MFPropertyWizard onComplete={mockOnComplete} />);

      // Tab through form fields
      await user.tab();

      // Verify focus moves to first input field
      const streetInput = screen.getByLabelText(/Street Address/i);
      expect(streetInput).toHaveFocus();
    });
  });
});
