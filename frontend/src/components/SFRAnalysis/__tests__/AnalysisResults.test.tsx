import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderInNoviceMode, renderInProMode } from '../../../test/utils/test-utils'
import AnalysisResults from '../AnalysisResults'
import { mockAnalysisResult, mockSFRPropertyData } from '../../../test/fixtures/propertyData'

describe('AnalysisResults Component', () => {
  const defaultProps = {
    analysis: mockAnalysisResult,
    propertyData: mockSFRPropertyData,
    onSave: vi.fn(),
    isSaving: false
  }

  describe('Epic 1: Dual-Mode Experience - Mode-Aware Content Display', () => {
    it('should show ProMetricsBar in pro mode', () => {
      renderInProMode(<AnalysisResults {...defaultProps} />)
      
      // ProMetricsBar should be visible - look for condensed metrics
      expect(screen.getByText(/monthly cash flow/i)).toBeInTheDocument()
      expect(screen.getByText(/cap rate/i)).toBeInTheDocument()
      expect(screen.getByText(/dscr/i)).toBeInTheDocument()
    })

    it('should not show IntelligenceMultiplier in pro mode', () => {
      renderInProMode(<AnalysisResults {...defaultProps} />)
      
      // Should not show AI intelligence section in pro mode
      expect(screen.queryByText(/professional intelligence analysis/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/ai investment analysis/i)).not.toBeInTheDocument()
    })

    it('should show IntelligenceMultiplier in novice mode', () => {
      renderInNoviceMode(<AnalysisResults {...defaultProps} />)
      
      // Should show AI intelligence section in novice mode
      expect(screen.getByText(/ai investment analysis/i)).toBeInTheDocument()
    })

    it('should show different navigation sections based on mode', () => {
      // Test novice mode navigation
      renderInNoviceMode(<AnalysisResults {...defaultProps} />)
      
      expect(screen.getByText(/financial overview/i)).toBeInTheDocument()
      expect(screen.getByText(/key metrics/i)).toBeInTheDocument()
      
      // Re-render in pro mode
      renderInProMode(<AnalysisResults {...defaultProps} />)
      
      // Pro mode should have more advanced sections
      expect(screen.getByText(/financial overview/i)).toBeInTheDocument()
      expect(screen.getByText(/key metrics/i)).toBeInTheDocument()
    })

    it('should display metrics in condensed format for pro mode', () => {
      renderInProMode(<AnalysisResults {...defaultProps} />)
      
      // Pro mode should show condensed metrics without explanations
      const cashFlowElements = screen.getAllByText(/cash flow/i)
      expect(cashFlowElements.length).toBeGreaterThan(0)
      
      // Should not have verbose explanations
      expect(screen.queryByText(/this represents/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/indicates/i)).not.toBeInTheDocument()
    })

    it('should show detailed explanations in novice mode', () => {
      renderInNoviceMode(<AnalysisResults {...defaultProps} />)
      
      // Novice mode should include educational content
      // Look for AI insights section which contains explanations
      expect(screen.getByText(/ai investment analysis/i)).toBeInTheDocument()
    })
  })

  describe('Epic 2: Property Analysis Accuracy - Data Display', () => {
    it('should display all key financial metrics', () => {
      renderInProMode(<AnalysisResults {...defaultProps} />)
      
      // All major metrics should be visible
      expect(screen.getByText(/monthly cash flow/i)).toBeInTheDocument()
      expect(screen.getByText(/cap rate/i)).toBeInTheDocument()
      expect(screen.getByText(/cash.*cash return/i)).toBeInTheDocument()
      expect(screen.getByText(/dscr/i)).toBeInTheDocument()
    })

    it('should display correct metric values', () => {
      renderInProMode(<AnalysisResults {...defaultProps} />)
      
      // Check that actual values from analysis are displayed
      // Note: These will appear in various formats (currency, percentage, etc.)
      expect(screen.getByText(/2\.88%/)).toBeInTheDocument() // Cap rate
      expect(screen.getByText(/-\$286\.40/)).toBeInTheDocument() // Monthly cash flow
    })

    it('should show proper formatting for currency values', () => {
      renderInProMode(<AnalysisResults {...defaultProps} />)
      
      // Currency values should be properly formatted
      const currencyRegex = /\$[\d,]+\.?\d*/
      const currencyElements = screen.getAllByText(currencyRegex)
      expect(currencyElements.length).toBeGreaterThan(0)
    })

    it('should show proper formatting for percentage values', () => {
      renderInProMode(<AnalysisResults {...defaultProps} />)
      
      // Percentage values should be properly formatted
      const percentageRegex = /\d+\.?\d*%/
      const percentageElements = screen.getAllByText(percentageRegex)
      expect(percentageElements.length).toBeGreaterThan(0)
    })

    it('should display long-term projections', () => {
      renderInProMode(<AnalysisResults {...defaultProps} />)
      
      // Should show long-term analysis section
      expect(screen.getByText(/long.*term.*analysis/i)).toBeInTheDocument()
    })

    it('should handle negative cash flow correctly', () => {
      renderInProMode(<AnalysisResults {...defaultProps} />)
      
      // Should properly display negative values
      const negativeValues = screen.getAllByText(/-\$/)
      expect(negativeValues.length).toBeGreaterThan(0)
    })

    it('should show property details accurately', () => {
      renderInProMode(<AnalysisResults {...defaultProps} />)
      
      // Property details should match input data
      expect(screen.getByText(/test property/i)).toBeInTheDocument()
      expect(screen.getByText(/3.*bed/i)).toBeInTheDocument()
      expect(screen.getByText(/2.*bath/i)).toBeInTheDocument()
    })
  })

  describe('Navigation and Interaction', () => {
    it('should allow navigation between sections', async () => {
      const user = userEvent.setup()
      renderInProMode(<AnalysisResults {...defaultProps} />)
      
      // Should be able to click on navigation items
      const keyMetricsNav = screen.getByText(/key metrics/i)
      await user.click(keyMetricsNav)
      
      // Should navigate to that section
      await waitFor(() => {
        expect(screen.getByText(/monthly cash flow/i)).toBeVisible()
      })
    })

    it('should handle save functionality', async () => {
      const user = userEvent.setup()
      const mockSave = vi.fn()
      
      renderInProMode(<AnalysisResults {...defaultProps} onSave={mockSave} />)
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      expect(mockSave).toHaveBeenCalled()
    })

    it('should show loading state when saving', () => {
      renderInProMode(<AnalysisResults {...defaultProps} isSaving={true} />)
      
      expect(screen.getByText(/saving/i)).toBeInTheDocument()
    })
  })

  describe('Performance Tests', () => {
    it('should render large analysis results within performance threshold', () => {
      const startTime = performance.now()
      renderInProMode(<AnalysisResults {...defaultProps} />)
      const endTime = performance.now()
      
      // Should render within 200ms even with complex analysis data
      expect(endTime - startTime).toBeLessThan(200)
    })

    it('should handle re-renders efficiently', () => {
      const { rerender } = renderInProMode(<AnalysisResults {...defaultProps} />)
      
      const startTime = performance.now()
      
      // Re-render multiple times
      for (let i = 0; i < 10; i++) {
        rerender(<AnalysisResults {...defaultProps} />)
      }
      
      const endTime = performance.now()
      
      // Re-renders should be fast
      expect(endTime - startTime).toBeLessThan(100)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing analysis data gracefully', () => {
      const propsWithoutAnalysis = {
        ...defaultProps,
        analysis: null
      }
      
      renderInProMode(<AnalysisResults {...propsWithoutAnalysis} />)
      
      // Should not crash and should show appropriate message
      expect(screen.getByText(/no analysis/i)).toBeInTheDocument()
    })

    it('should handle incomplete analysis data', () => {
      const incompleteAnalysis = {
        ...mockAnalysisResult,
        keyMetrics: undefined
      }
      
      const propsWithIncompleteData = {
        ...defaultProps,
        analysis: incompleteAnalysis
      }
      
      renderInProMode(<AnalysisResults {...propsWithIncompleteData} />)
      
      // Should not crash
      expect(screen.getByText(/analysis results/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderInProMode(<AnalysisResults {...defaultProps} />)
      
      // Should have proper heading hierarchy
      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
      
      // Main heading should be level 1 or 2
      const mainHeading = headings[0]
      expect(mainHeading.tagName).toMatch(/H[12]/)
    })

    it('should have accessible navigation', () => {
      renderInProMode(<AnalysisResults {...defaultProps} />)
      
      // Navigation should be accessible
      const navigation = screen.getByRole('navigation')
      expect(navigation).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderInProMode(<AnalysisResults {...defaultProps} />)
      
      // Should be able to tab through interactive elements
      await user.tab()
      const firstInteractiveElement = document.activeElement
      expect(firstInteractiveElement).toBeInstanceOf(HTMLElement)
    })
  })

  describe('Responsive Design', () => {
    it('should adapt to different screen sizes', () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      renderInProMode(<AnalysisResults {...defaultProps} />)
      
      // Should render without horizontal scrolling issues
      expect(screen.getByText(/analysis results/i)).toBeInTheDocument()
    })
  })
})