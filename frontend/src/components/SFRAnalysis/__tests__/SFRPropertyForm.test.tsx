import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderInNoviceMode, renderInProMode } from '../../../test/utils/test-utils'
import SFRPropertyForm from '../SFRPropertyForm'
import { mockSFRPropertyData } from '../../../test/fixtures/propertyData'

const mockOnSubmit = vi.fn()

describe('SFRPropertyForm Component', () => {
  const defaultProps = {
    onSubmit: mockOnSubmit,
    initialData: mockSFRPropertyData,
    isLoading: false
  }

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  describe('Epic 1: Dual-Mode Experience - Story 1.2: Progressive Form Disclosure', () => {
    it('should show all basic fields in both modes', () => {
      renderInNoviceMode(<SFRPropertyForm {...defaultProps} />)
      
      // Essential fields should always be visible
      expect(screen.getByLabelText(/property name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/purchase price/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/down payment/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/monthly rent/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/interest rate/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/bedrooms/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/bathrooms/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/square footage/i)).toBeInTheDocument()
    })

    it('should hide advanced fields in novice mode by default', () => {
      renderInNoviceMode(<SFRPropertyForm {...defaultProps} />)
      
      // Advanced fields should be hidden initially in novice mode
      expect(screen.queryByLabelText(/closing costs/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/loan term/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/maintenance cost/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/capital investments/i)).not.toBeInTheDocument()
    })

    it('should show all fields in pro mode', () => {
      renderInProMode(<SFRPropertyForm {...defaultProps} />)
      
      // All fields should be visible in pro mode
      expect(screen.getByLabelText(/property name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/purchase price/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/closing costs/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/loan term/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/maintenance cost/i)).toBeInTheDocument()
    })

    it('should show "Show Advanced Options" button in novice mode', () => {
      renderInNoviceMode(<SFRPropertyForm {...defaultProps} />)
      
      const showAdvancedButton = screen.getByRole('button', { name: /show advanced financial options/i })
      expect(showAdvancedButton).toBeInTheDocument()
    })

    it('should not show advanced options button in pro mode', () => {
      renderInProMode(<SFRPropertyForm {...defaultProps} />)
      
      const showAdvancedButton = screen.queryByRole('button', { name: /show advanced financial options/i })
      expect(showAdvancedButton).not.toBeInTheDocument()
    })

    it('should reveal advanced fields when "Show Advanced Options" is clicked', async () => {
      const user = userEvent.setup()
      renderInNoviceMode(<SFRPropertyForm {...defaultProps} />)
      
      // Initially hidden
      expect(screen.queryByLabelText(/closing costs/i)).not.toBeInTheDocument()
      
      const showAdvancedButton = screen.getByRole('button', { name: /show advanced financial options/i })
      await user.click(showAdvancedButton)
      
      // Should now be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/closing costs/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/loan term/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/maintenance cost/i)).toBeInTheDocument()
      })
    })

    it('should change button text to "Hide Advanced Options" when expanded', async () => {
      const user = userEvent.setup()
      renderInNoviceMode(<SFRPropertyForm {...defaultProps} />)
      
      const showAdvancedButton = screen.getByRole('button', { name: /show advanced financial options/i })
      await user.click(showAdvancedButton)
      
      await waitFor(() => {
        const hideAdvancedButton = screen.getByRole('button', { name: /hide advanced options/i })
        expect(hideAdvancedButton).toBeInTheDocument()
      })
    })

    it('should hide advanced fields when "Hide Advanced Options" is clicked', async () => {
      const user = userEvent.setup()
      renderInNoviceMode(<SFRPropertyForm {...defaultProps} />)
      
      // Show advanced fields first
      const showAdvancedButton = screen.getByRole('button', { name: /show advanced financial options/i })
      await user.click(showAdvancedButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/closing costs/i)).toBeInTheDocument()
      })
      
      // Now hide them
      const hideAdvancedButton = screen.getByRole('button', { name: /hide advanced options/i })
      await user.click(hideAdvancedButton)
      
      await waitFor(() => {
        expect(screen.queryByLabelText(/closing costs/i)).not.toBeInTheDocument()
      })
    })

    it('should show educational tooltips in novice mode', () => {
      renderInNoviceMode(<SFRPropertyForm {...defaultProps} />)
      
      // Should have help icons for educational tooltips
      const helpIcons = screen.getAllByRole('button', { name: /learn about/i })
      expect(helpIcons.length).toBeGreaterThan(0)
    })

    it('should not show educational tooltips in pro mode', () => {
      renderInProMode(<SFRPropertyForm {...defaultProps} />)
      
      // Should not have educational tooltips in pro mode
      const helpIcons = screen.queryAllByRole('button', { name: /learn about/i })
      expect(helpIcons).toHaveLength(0)
    })

    it('should maintain form values when toggling advanced options', async () => {
      const user = userEvent.setup()
      renderInNoviceMode(<SFRPropertyForm {...defaultProps} />)
      
      // Fill in a basic field
      const purchasePriceInput = screen.getByLabelText(/purchase price/i)
      await user.clear(purchasePriceInput)
      await user.type(purchasePriceInput, '500000')
      
      // Show advanced options
      const showAdvancedButton = screen.getByRole('button', { name: /show advanced financial options/i })
      await user.click(showAdvancedButton)
      
      // Fill in an advanced field
      await waitFor(async () => {
        const closingCostsInput = screen.getByLabelText(/closing costs/i)
        await user.clear(closingCostsInput)
        await user.type(closingCostsInput, '15000')
      })
      
      // Hide advanced options
      const hideAdvancedButton = screen.getByRole('button', { name: /hide advanced options/i })
      await user.click(hideAdvancedButton)
      
      // Show them again - values should be preserved
      const showAgainButton = screen.getByRole('button', { name: /show advanced financial options/i })
      await user.click(showAgainButton)
      
      await waitFor(() => {
        const closingCostsInput = screen.getByLabelText(/closing costs/i)
        expect(closingCostsInput).toHaveValue(15000)
      })
      
      // Basic field should also be preserved
      expect(screen.getByLabelText(/purchase price/i)).toHaveValue(500000)
    })

    it('should submit form with all values including hidden advanced fields', async () => {
      const user = userEvent.setup()
      renderInNoviceMode(<SFRPropertyForm {...defaultProps} />)
      
      // Show advanced options and fill in a field
      const showAdvancedButton = screen.getByRole('button', { name: /show advanced financial options/i })
      await user.click(showAdvancedButton)
      
      await waitFor(async () => {
        const closingCostsInput = screen.getByLabelText(/closing costs/i)
        await user.clear(closingCostsInput)
        await user.type(closingCostsInput, '20000')
      })
      
      // Hide advanced options
      const hideAdvancedButton = screen.getByRole('button', { name: /hide advanced options/i })
      await user.click(hideAdvancedButton)
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /analyze property/i })
      await user.click(submitButton)
      
      // Should include the advanced field value in submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            closingCosts: 20000
          })
        )
      })
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields in both modes', async () => {
      const user = userEvent.setup()
      renderInNoviceMode(<SFRPropertyForm {...defaultProps} initialData={undefined} />)
      
      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /analyze property/i })
      await user.click(submitButton)
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/property name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/street is required/i)).toBeInTheDocument()
      })
      
      // Should not call onSubmit
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should validate numeric fields', async () => {
      const user = userEvent.setup()
      renderInNoviceMode(<SFRPropertyForm {...defaultProps} />)
      
      // Enter invalid values
      const purchasePriceInput = screen.getByLabelText(/purchase price/i)
      await user.clear(purchasePriceInput)
      await user.type(purchasePriceInput, '0')
      
      const submitButton = screen.getByRole('button', { name: /analyze property/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/purchase price must be greater than 0/i)).toBeInTheDocument()
      })
    })
  })

  describe('Performance Tests', () => {
    it('should render form within performance threshold', () => {
      const startTime = performance.now()
      renderInNoviceMode(<SFRPropertyForm {...defaultProps} />)
      const endTime = performance.now()
      
      // Should render within 100ms
      expect(endTime - startTime).toBeLessThan(100)
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels and structure', () => {
      renderInNoviceMode(<SFRPropertyForm {...defaultProps} />)
      
      // All form inputs should have labels
      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName()
      })
      
      // Form should have proper structure
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderInNoviceMode(<SFRPropertyForm {...defaultProps} />)
      
      // Should be able to tab through form fields
      await user.tab()
      const firstInput = screen.getByLabelText(/property name/i)
      expect(firstInput).toHaveFocus()
    })
  })
})