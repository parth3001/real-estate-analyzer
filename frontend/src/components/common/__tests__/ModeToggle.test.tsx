import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, renderInNoviceMode, renderInProMode } from '../../../test/utils/test-utils'
import { ModeToggle } from '../ModeToggle'

describe('ModeToggle Component', () => {
  describe('Epic 1: Dual-Mode Experience - Story 1.1: Mode Toggle Functionality', () => {
    it('should render both toggle options', () => {
      render(<ModeToggle />)
      
      expect(screen.getByRole('button', { name: /learning/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /pro/i })).toBeInTheDocument()
    })

    it('should show novice mode as selected by default', () => {
      renderInNoviceMode(<ModeToggle />)
      
      const noviceButton = screen.getByRole('button', { name: /learning/i })
      const proButton = screen.getByRole('button', { name: /pro/i })
      
      expect(noviceButton).toHaveAttribute('aria-pressed', 'true')
      expect(proButton).toHaveAttribute('aria-pressed', 'false')
    })

    it('should show pro mode as selected when initialized in pro mode', () => {
      renderInProMode(<ModeToggle />)
      
      const noviceButton = screen.getByRole('button', { name: /learning/i })
      const proButton = screen.getByRole('button', { name: /pro/i })
      
      expect(noviceButton).toHaveAttribute('aria-pressed', 'false')
      expect(proButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('should switch to pro mode when pro button is clicked', async () => {
      const user = userEvent.setup()
      renderInNoviceMode(<ModeToggle />)
      
      const proButton = screen.getByRole('button', { name: /pro/i })
      await user.click(proButton)
      
      await waitFor(() => {
        expect(proButton).toHaveAttribute('aria-pressed', 'true')
      })
    })

    it('should switch to novice mode when learning button is clicked', async () => {
      const user = userEvent.setup()
      renderInProMode(<ModeToggle />)
      
      const noviceButton = screen.getByRole('button', { name: /learning/i })
      await user.click(noviceButton)
      
      await waitFor(() => {
        expect(noviceButton).toHaveAttribute('aria-pressed', 'true')
      })
    })

    it('should not change mode when same button is clicked', async () => {
      const user = userEvent.setup()
      renderInNoviceMode(<ModeToggle />)
      
      const noviceButton = screen.getByRole('button', { name: /learning/i })
      
      // Verify initial state
      expect(noviceButton).toHaveAttribute('aria-pressed', 'true')
      
      // Click the same button
      await user.click(noviceButton)
      
      // Should remain in same state
      expect(noviceButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('should be accessible with keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<ModeToggle />)
      
      const noviceButton = screen.getByRole('button', { name: /learning/i })
      const proButton = screen.getByRole('button', { name: /pro/i })
      
      // Tab to first button
      await user.tab()
      expect(noviceButton).toHaveFocus()
      
      // Tab to second button
      await user.tab()
      expect(proButton).toHaveFocus()
      
      // Activate with Enter key
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(proButton).toHaveAttribute('aria-pressed', 'true')
      })
    })

    it('should have proper ARIA labels for accessibility', () => {
      render(<ModeToggle />)
      
      const toggleGroup = screen.getByRole('group', { name: /user mode/i })
      expect(toggleGroup).toBeInTheDocument()
      
      const noviceButton = screen.getByRole('button', { name: /learning/i })
      const proButton = screen.getByRole('button', { name: /pro/i })
      
      expect(noviceButton).toHaveAttribute('aria-pressed')
      expect(proButton).toHaveAttribute('aria-pressed')
    })

    it('should maintain visual consistency with Apple design system', () => {
      render(<ModeToggle />)
      
      const toggleGroup = screen.getByRole('group')
      
      // Check for expected styling classes/attributes that indicate Apple design
      expect(toggleGroup).toHaveStyle({ borderRadius: expect.any(String) })
    })

    it('should gracefully handle missing DualModeContext', () => {
      // This tests the fallback behavior when context is not available
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Render without DualModeProvider
      render(<ModeToggle />)
      
      // Should still render without crashing
      expect(screen.getByRole('button', { name: /learning/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /pro/i })).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Performance Tests', () => {
    it('should render quickly', () => {
      const startTime = performance.now()
      render(<ModeToggle />)
      const endTime = performance.now()
      
      // Should render in less than 50ms
      expect(endTime - startTime).toBeLessThan(50)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid clicking without breaking', async () => {
      const user = userEvent.setup()
      render(<ModeToggle />)
      
      const noviceButton = screen.getByRole('button', { name: /learning/i })
      const proButton = screen.getByRole('button', { name: /pro/i })
      
      // Rapidly click between modes
      await user.click(proButton)
      await user.click(noviceButton)
      await user.click(proButton)
      await user.click(noviceButton)
      
      // Should end up in novice mode
      expect(noviceButton).toHaveAttribute('aria-pressed', 'true')
    })
  })
})