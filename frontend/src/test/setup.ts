import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Clean up after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// Close server after all tests
afterAll(() => server.close())

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock MUI icons to prevent EMFILE (too many open files) error
// MUI icons barrel import causes excessive file handles in test environment
vi.mock('@mui/icons-material', () => {
  const MockIcon = () => 'svg'
  return {
    // Address & Property icons
    LocationOn: MockIcon,
    Search: MockIcon,
    AutoAwesome: MockIcon,
    Home: MockIcon,
    SquareFoot: MockIcon,
    CalendarMonth: MockIcon,
    Apartment: MockIcon,
    Business: MockIcon,

    // Financial icons
    AttachMoney: MockIcon,
    AccountBalance: MockIcon,
    TrendingUp: MockIcon,
    Receipt: MockIcon,

    // Strategy & Goals icons
    Psychology: MockIcon,
    Info: MockIcon,
    HelpOutline: MockIcon,

    // Navigation & Action icons
    ArrowBack: MockIcon,
    ArrowForward: MockIcon,
    Check: MockIcon,

    // Status & Validation icons
    Error: MockIcon,
    Warning: MockIcon,
    CheckCircle: MockIcon,

    // Other commonly used icons
    Add: MockIcon,
    Remove: MockIcon,
    Edit: MockIcon,
    Delete: MockIcon,
    Close: MockIcon,
    ExpandMore: MockIcon,
    ExpandLess: MockIcon,
  }
})