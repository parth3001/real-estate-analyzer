import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderInNoviceMode, renderInProMode } from '../../../test/utils/test-utils'
import { EducationalTooltip } from '../EducationalTooltip'

describe('EducationalTooltip Component', () => {
  const defaultProps = {
    title: 'Test Title',
    description: 'Test description for tooltip',
    whyItMatters: 'This matters because...',
    learnMoreUrl: 'https://example.com/learn-more'
  }

  describe('Epic 1: Dual-Mode Experience - Story 1.2: Educational Content Display', () => {
    it('should show tooltip in novice mode', () => {
      renderInNoviceMode(<EducationalTooltip {...defaultProps} />)
      
      const helpIcon = screen.getByRole('button', { name: /learn about test title/i })
      expect(helpIcon).toBeInTheDocument()
    })

    it('should not show tooltip in pro mode', () => {
      renderInProMode(<EducationalTooltip {...defaultProps} />)
      
      const helpIcon = screen.queryByRole('button', { name: /learn about test title/i })
      expect(helpIcon).not.toBeInTheDocument()
    })

    it('should display tooltip content when hovered in novice mode', async () => {
      const user = userEvent.setup()
      renderInNoviceMode(<EducationalTooltip {...defaultProps} />)
      
      const helpIcon = screen.getByRole('button', { name: /learn about test title/i })
      await user.hover(helpIcon)
      
      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeInTheDocument()
        expect(screen.getByText('Test description for tooltip')).toBeInTheDocument()
        expect(screen.getByText('💡 Why it matters:')).toBeInTheDocument()
        expect(screen.getByText('This matters because...')).toBeInTheDocument()
        expect(screen.getByText('📚 Learn more')).toBeInTheDocument()
      })
    })

    it('should handle tooltip without optional props', async () => {
      const user = userEvent.setup()
      const minimalProps = {
        title: 'Minimal Title',
        description: 'Minimal description'
      }
      
      renderInNoviceMode(<EducationalTooltip {...minimalProps} />)
      
      const helpIcon = screen.getByRole('button', { name: /learn about minimal title/i })
      await user.hover(helpIcon)
      
      await waitFor(() => {
        expect(screen.getByText('Minimal Title')).toBeInTheDocument()
        expect(screen.getByText('Minimal description')).toBeInTheDocument()
        expect(screen.queryByText('💡 Why it matters:')).not.toBeInTheDocument()
        expect(screen.queryByText('📚 Learn more')).not.toBeInTheDocument()
      })
    })

    it('should render with children elements', () => {
      const TestChild = () => <input data-testid="test-input" />
      
      renderInNoviceMode(
        <EducationalTooltip {...defaultProps}>
          <TestChild />
        </EducationalTooltip>
      )
      
      expect(screen.getByTestId('test-input')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /learn about test title/i })).toBeInTheDocument()
    })

    it('should open learn more link in new tab when clicked', async () => {
      const user = userEvent.setup()
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      
      renderInNoviceMode(<EducationalTooltip {...defaultProps} />)
      
      const helpIcon = screen.getByRole('button', { name: /learn about test title/i })
      await user.hover(helpIcon)
      
      await waitFor(async () => {
        const learnMoreLink = screen.getByText('📚 Learn more')
        await user.click(learnMoreLink)
        
        expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com/learn-more', '_blank')
      })
      
      windowOpenSpy.mockRestore()
    })

    it('should hide tooltip when mouse leaves', async () => {
      const user = userEvent.setup()
      renderInNoviceMode(<EducationalTooltip {...defaultProps} />)
      
      const helpIcon = screen.getByRole('button', { name: /learn about test title/i })
      
      await user.hover(helpIcon)
      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeInTheDocument()
      })
      
      await user.unhover(helpIcon)
      await waitFor(() => {
        expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
      })
    })

    it('should be accessible with keyboard navigation', async () => {
      const user = userEvent.setup()
      renderInNoviceMode(<EducationalTooltip {...defaultProps} />)
      
      const helpIcon = screen.getByRole('button', { name: /learn about test title/i })
      
      // Focus with keyboard
      await user.tab()
      expect(helpIcon).toHaveFocus()
      
      // Should show tooltip on focus
      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeInTheDocument()
      })
    })

    it('should have proper ARIA attributes', () => {
      renderInNoviceMode(<EducationalTooltip {...defaultProps} />)
      
      const helpIcon = screen.getByRole('button', { name: /learn about test title/i })
      
      expect(helpIcon).toHaveAttribute('aria-label', 'Learn about Test Title')
    })
  })

  describe('Performance Tests', () => {
    it('should not render in pro mode for better performance', () => {
      const startTime = performance.now()
      renderInProMode(<EducationalTooltip {...defaultProps} />)
      const endTime = performance.now()
      
      // Should be very fast since it returns null immediately
      expect(endTime - startTime).toBeLessThan(10)
      
      // Should not render any DOM elements
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty title gracefully', () => {
      const props = { ...defaultProps, title: '' }
      renderInNoviceMode(<EducationalTooltip {...props} />)
      
      const helpIcon = screen.getByRole('button')
      expect(helpIcon).toHaveAttribute('aria-label', 'Learn about ')
    })

    it('should handle special characters in content', async () => {
      const user = userEvent.setup()
      const specialProps = {
        title: 'Special & "Characters" <Test>',
        description: 'Description with & special "characters" <html>'
      }
      
      renderInNoviceMode(<EducationalTooltip {...specialProps} />)
      
      const helpIcon = screen.getByRole('button')
      await user.hover(helpIcon)
      
      await waitFor(() => {
        expect(screen.getByText('Special & "Characters" <Test>')).toBeInTheDocument()
        expect(screen.getByText('Description with & special "characters" <html>')).toBeInTheDocument()
      })
    })
  })
})