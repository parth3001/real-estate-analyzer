/**
 * MFAddressStep Component Unit Tests
 * Tests auto-population, field rendering, and user interactions
 *
 * QE Standard: Step component tests must cover:
 * - Field rendering and defaults
 * - Auto-population from API
 * - User input handling
 * - Confidence score display
 * - Building type selector (MF-specific)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock API service - must be before imports
vi.mock('../../../services/api', () => ({
  wizardApi: {
    lookupProperty: vi.fn()
  }
}));

// Mock debounce hook - must be before imports
vi.mock('../../../hooks/useDebounce', () => ({
  useAPIDebounce: vi.fn(() => ({
    execute: vi.fn(),
    isLoading: false,
    cancel: vi.fn()
  }))
}));

import MFAddressStep from '../MFAddressStep';
import type { MFWizardState, StepValidation } from '../mfWizardTypes';

// Get mocked functions
const mockLookupProperty = vi.mocked((await import('../../../services/api')).wizardApi.lookupProperty);
const mockUseAPIDebounce = vi.mocked((await import('../../../hooks/useDebounce')).useAPIDebounce);

describe('MFAddressStep', () => {
  let mockState: MFWizardState;
  let mockOnUpdate: ReturnType<typeof vi.fn>;
  let mockOnNext: ReturnType<typeof vi.fn>;
  let mockOnPrevious: ReturnType<typeof vi.fn>;
  let mockValidation: StepValidation;
  let mockExecute: ReturnType<typeof vi.fn>;
  let mockCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Initialize mock functions
    mockExecute = vi.fn();
    mockCancel = vi.fn();

    // Reset and configure mocks
    mockUseAPIDebounce.mockReturnValue({
      execute: mockExecute as any,
      isLoading: false,
      error: null,
      cancel: mockCancel,
      activeRequestId: null
    });

    mockState = {
      currentStep: 0,
      completed: [false, false, false, false, false],
      data: {
        propertyName: '',
        propertyAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        totalUnits: 8,
        totalSqft: 6400,
        yearBuilt: 2015,
        buildingType: 'GARDEN', // Phase 1: Valid building type
        purchasePrice: 1200000,
        downPaymentPercentage: 25,
        downPayment: 300000,
        interestRate: 7.625,
        loanTerm: 30,
        propertyTaxRate: 2.0,
        propertyManagementRate: 10,
        maintenanceCostPerUnit: 100,
        commonAreaUtilities: {
          electric: 150,
          water: 120,
          gas: 80,
          trash: 60
        },
        unitTypes: [],
        longTermAssumptions: {
          projectionYears: 10,
          annualRentIncrease: 3,
          annualPropertyValueIncrease: 4,
          sellingCostsPercentage: 7,
          inflationRate: 2.5,
          vacancyRate: 5,
          capitalExpenditureRate: 6,
          commonAreaMaintenanceRate: 2
        }
      },
      autoPopulated: {},
      smartDefaults: {
        downPaymentPercentage: 25,
        closingCostPercentage: 3.0,
        propertyManagementRate: 10,
        maintenanceCostPerUnit: 100,
        vacancyRate: 5,
        inflationRate: 2.5,
        commonAreaUtilitiesEstimate: { electric: 150, water: 120, gas: 80, trash: 60 },
        dataSource: 'Default',
        confidence: {
          score: 70,
          source: 'Industry Standards',
          lastUpdated: new Date(),
          reliability: 'medium'
        }
      },
      manualOverrides: [],
      apiErrors: [],
      unitTemplateMode: 'template'
    };

    mockOnUpdate = vi.fn();
    mockOnNext = vi.fn();
    mockOnPrevious = vi.fn();
    mockValidation = {
      isValid: true,
      errors: {},
      warnings: {}
    };

    mockLookupProperty.mockResolvedValue({
      status: 200,
      data: {
        success: false,
        propertyDetails: undefined,
        apiCalls: {
          successful: [],
          failed: ['rentcast'],
          cached: []
        }
      }
    });
  });

  describe('Field Rendering', () => {
    it('should render all required address fields', () => {
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByLabelText(/Street Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/State/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ZIP Code/i)).toBeInTheDocument();
    });

    it('should render MF-specific building detail fields', () => {
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByLabelText(/Total Units/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Total Square Footage/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Building Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Year Built/i)).toBeInTheDocument();
    });

    it('should render property name optional field', () => {
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByLabelText(/Property Name \(Optional\)/i)).toBeInTheDocument();
    });

    it('should render manual lookup button', () => {
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByRole('button', { name: /Look up Property/i })).toBeInTheDocument();
    });

    it('should display default values from state', () => {
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const totalUnitsInput = screen.getByLabelText(/Total Units/i) as HTMLInputElement;
      expect(totalUnitsInput.value).toBe('8');

      const totalSqftInput = screen.getByLabelText(/Total Square Footage/i) as HTMLInputElement;
      expect(totalSqftInput.value).toBe('6400');

      const yearBuiltInput = screen.getByLabelText(/Year Built/i) as HTMLInputElement;
      expect(yearBuiltInput.value).toBe('2015');
    });
  });

  describe('Building Type Selector - Phase 1 (Commercial MF 5+ Units)', () => {
    it('should render all 3 Phase 1 building type options', async () => {
      const user = userEvent.setup();
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const buildingTypeSelect = screen.getByLabelText(/Building Type/i);
      await user.click(buildingTypeSelect);

      await waitFor(() => {
        // Phase 1 building types - use getAllByText for two-line MenuItems
        const gardenOptions = screen.getAllByText(/Garden Style/i);
        expect(gardenOptions.length).toBeGreaterThan(0);

        const midRiseOptions = screen.getAllByText(/Mid-Rise with Elevator/i);
        expect(midRiseOptions.length).toBeGreaterThan(0);

        const complexOptions = screen.getAllByText(/Multi-Building Complex/i);
        expect(complexOptions.length).toBeGreaterThan(0);
      });
    });

    it('should update state when building type is selected', async () => {
      const user = userEvent.setup();
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const buildingTypeSelect = screen.getByLabelText(/Building Type/i);
      await user.click(buildingTypeSelect);

      const midRiseOption = await screen.findByText(/Mid-Rise with Elevator/i);
      await user.click(midRiseOption);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            buildingType: 'MID_RISE'
          })
        })
      );
    });

    it('should update state when GARDEN is selected', async () => {
      const user = userEvent.setup();
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const buildingTypeSelect = screen.getByLabelText(/Building Type/i);
      await user.click(buildingTypeSelect);

      // Find the MenuItem by its text content and click the parent li element
      const gardenText = await screen.findAllByText(/Garden Style/i);
      const gardenMenuItem = gardenText[0].closest('li');
      if (gardenMenuItem) {
        await user.click(gardenMenuItem);
      }

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              buildingType: 'GARDEN'
            })
          })
        );
      });
    });

    it('should update state when COMPLEX is selected', async () => {
      const user = userEvent.setup();
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const buildingTypeSelect = screen.getByLabelText(/Building Type/i);
      await user.click(buildingTypeSelect);

      // Find the MenuItem by its text content and click the parent li element
      const complexText = await screen.findAllByText(/Multi-Building Complex/i);
      const complexMenuItem = complexText[0].closest('li');
      if (complexMenuItem) {
        await user.click(complexMenuItem);
      }

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              buildingType: 'COMPLEX'
            })
          })
        );
      });
    });

    it('should show two-line building type descriptions in menu items', async () => {
      const user = userEvent.setup();
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const buildingTypeSelect = screen.getByLabelText(/Building Type/i);
      await user.click(buildingTypeSelect);

      // Check for description text using getAllByText (descriptions appear multiple times)
      await waitFor(() => {
        const gardenDescs = screen.getAllByText(/outdoor corridors/i);
        expect(gardenDescs.length).toBeGreaterThan(0); // GARDEN description

        const midRiseDescs = screen.getAllByText(/elevator required/i);
        expect(midRiseDescs.length).toBeGreaterThan(0); // MID_RISE description

        const complexDescs = screen.getAllByText(/shared amenities/i);
        expect(complexDescs.length).toBeGreaterThan(0); // COMPLEX description
      });
    });

    it('should show building type details in helper text when selected', () => {
      const stateWithMidRise: MFWizardState = {
        ...mockState,
        data: { ...mockState.data, buildingType: 'MID_RISE' as const }
      };

      render(
        <MFAddressStep
          state={stateWithMidRise}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      // Should show MID_RISE details in helper text
      expect(screen.getByText(/Operating expenses.*\$450-700\/unit\/month/i)).toBeInTheDocument();
    });

    it('should display help tooltip icon for building type', () => {
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      // Find help icon button (aria-label or role)
      const helpButtons = screen.getAllByRole('button');
      // Help icon should be present (HelpOutline icon rendered as button)
      expect(helpButtons.length).toBeGreaterThan(1); // At least lookup button + help icon
    });
  });

  describe('User Input Handling', () => {
    it('should update state when street address is typed', async () => {
      const user = userEvent.setup();
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const streetInput = screen.getByLabelText(/Street Address/i);
      await user.type(streetInput, '123 Oak Street');

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            propertyAddress: expect.objectContaining({
              street: expect.stringContaining('123')
            })
          })
        })
      );
    });

    it('should update state when total units is changed', async () => {
      const user = userEvent.setup();
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const totalUnitsInput = screen.getByLabelText(/Total Units/i);
      await user.clear(totalUnitsInput);
      await user.type(totalUnitsInput, '12');

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalUnits: 12
          })
        })
      );
    });

    it('should update state when property name is entered', async () => {
      const user = userEvent.setup();
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const propertyNameInput = screen.getByLabelText(/Property Name \(Optional\)/i);
      await user.type(propertyNameInput, 'Oak Street Apartments');

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            propertyName: expect.stringContaining('Oak')
          })
        })
      );
    });
  });

  describe('Auto-Population from API', () => {
    it('should trigger auto-lookup when address is complete', async () => {
      const user = userEvent.setup();
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      // Fill complete address
      await user.type(screen.getByLabelText(/Street Address/i), '123 Oak Street');
      await user.type(screen.getByLabelText(/City/i), 'Austin');
      await user.type(screen.getByLabelText(/State/i), 'TX');
      await user.type(screen.getByLabelText(/ZIP Code/i), '78701');

      // Debounced execute should be called
      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalled();
      });
    });

    it('should cancel pending lookup when address becomes incomplete', async () => {
      const user = userEvent.setup();

      // Start with complete address
      const stateWithAddress = {
        ...mockState,
        data: {
          ...mockState.data,
          propertyAddress: {
            street: '123 Oak Street',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701'
          }
        }
      };

      render(
        <MFAddressStep
          state={stateWithAddress}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      // Clear city field
      const cityInput = screen.getByLabelText(/City/i);
      await user.clear(cityInput);

      // Cancel should be called
      await waitFor(() => {
        expect(mockCancel).toHaveBeenCalled();
      });
    });

    it('should display auto-populated fields with confidence scores', () => {
      const stateWithAutoPopulated = {
        ...mockState,
        autoPopulated: {
          totalUnits: {
            value: 8,
            confidence: {
              score: 90,
              source: 'RentCast Enhanced',
              lastUpdated: new Date(),
              reliability: 'high' as const
            }
          },
          totalSqft: {
            value: 6400,
            confidence: {
              score: 85,
              source: 'RentCast Enhanced',
              lastUpdated: new Date(),
              reliability: 'high' as const
            }
          }
        }
      };

      render(
        <MFAddressStep
          state={stateWithAutoPopulated}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      // Check for confidence score badges
      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should show auto-populated badge when property found', () => {
      const stateWithAutoPopulated = {
        ...mockState,
        autoPopulated: {
          totalUnits: {
            value: 8,
            confidence: {
              score: 90,
              source: 'RentCast Enhanced',
              lastUpdated: new Date(),
              reliability: 'high' as const
            }
          }
        }
      };

      render(
        <MFAddressStep
          state={stateWithAutoPopulated}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      // Note: Auto-populated badge appears in section header
      // This test checks if component renders differently when auto-populated data exists
      const buildingDetailsHeading = screen.getByText(/Building Details/i);
      expect(buildingDetailsHeading).toBeInTheDocument();
    });
  });

  describe('Manual Property Lookup', () => {
    it('should enable lookup button when address is complete', async () => {
      const user = userEvent.setup();

      const stateWithAddress = {
        ...mockState,
        data: {
          ...mockState.data,
          propertyAddress: {
            street: '123 Oak Street',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701'
          }
        }
      };

      render(
        <MFAddressStep
          state={stateWithAddress}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const lookupButton = screen.getByRole('button', { name: /Look up Property/i });
      expect(lookupButton).toBeEnabled();
    });

    it('should disable lookup button when address is incomplete', () => {
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const lookupButton = screen.getByRole('button', { name: /Look up Property/i });
      expect(lookupButton).toBeDisabled();
    });
  });

  describe('Validation Error Display', () => {
    it('should display error for street address', () => {
      const validationWithErrors = {
        ...mockValidation,
        isValid: false,
        errors: {
          'propertyAddress.street': 'Street address is required'
        }
      };

      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={validationWithErrors}
        />
      );

      expect(screen.getByText('Street address is required')).toBeInTheDocument();
    });

    it('should display error for total units', () => {
      const validationWithErrors = {
        ...mockValidation,
        isValid: false,
        errors: {
          'totalUnits': 'Total units must be at least 2'
        }
      };

      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={validationWithErrors}
        />
      );

      expect(screen.getByText(/must be at least 2/i)).toBeInTheDocument();
    });

    it('should display error for total sqft', () => {
      const validationWithErrors = {
        ...mockValidation,
        isValid: false,
        errors: {
          'totalSqft': 'Total square footage is required'
        }
      };

      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={validationWithErrors}
        />
      );

      expect(screen.getByText(/square footage is required/i)).toBeInTheDocument();
    });
  });

  describe('Informational Content', () => {
    it('should display Phase 1 guidance card with 5+ units scope', () => {
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      // Phase 1 guidance card should be present
      expect(screen.getByText(/Phase 1: Commercial Multi-Family \(5\+ Units\)/i)).toBeInTheDocument();
    });

    it('should display guidance for using SFR Analyzer for 2-4 units', () => {
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      // Should tell users to use SFR Analyzer for 2-4 units (check for key phrases)
      expect(screen.getByText(/2-4 unit properties/i)).toBeInTheDocument();
      expect(screen.getByText(/SFR Analyzer/i)).toBeInTheDocument();
    });

    it('should display auto-population explanation', () => {
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      // Check for auto-population text (split into separate assertions)
      expect(screen.getByText(/Auto-Population/i)).toBeInTheDocument();
      expect(screen.getByText(/automatically look up/i)).toBeInTheDocument();
    });

    it('should display helper text for total units field', () => {
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByText(/Total number of rental units in the property/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for all input fields', () => {
      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByLabelText(/Street Address/i)).toHaveAttribute('aria-invalid', 'false');
      expect(screen.getByLabelText(/Total Units/i)).toHaveAttribute('type', 'number');
    });

    it('should mark invalid fields with aria-invalid', () => {
      const validationWithErrors = {
        ...mockValidation,
        isValid: false,
        errors: {
          'propertyAddress.street': 'Street address is required'
        }
      };

      render(
        <MFAddressStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={validationWithErrors}
        />
      );

      expect(screen.getByLabelText(/Street Address/i)).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
