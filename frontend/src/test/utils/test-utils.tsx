import React, { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../../contexts/AuthContext'
import { DualModeProvider } from '../../contexts/DualModeContext'
import { PersonaProvider } from '../../contexts/PersonaContext'
import { appleTheme } from '../../theme/appleTheme'

// Create a test query client with disabled retries for faster tests
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
})

interface AllTheProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
  initialMode?: 'novice' | 'pro'
}

const AllTheProviders = ({ 
  children, 
  queryClient = createTestQueryClient(),
  initialMode = 'novice'
}: AllTheProvidersProps) => {

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={appleTheme}>
          <CssBaseline />
          <AuthProvider>
            <PersonaProvider>
              <DualModeProvider>
                {children}
              </DualModeProvider>
            </PersonaProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    queryClient?: QueryClient
    initialMode?: 'novice' | 'pro'
  }
) => {
  const { queryClient, initialMode, ...renderOptions } = options || {}
  
  return render(ui, {
    wrapper: (props: { children: React.ReactNode }) => 
      <AllTheProviders 
        {...props} 
        queryClient={queryClient}
        initialMode={initialMode}
      />,
    ...renderOptions,
  })
}

// Helper functions for common test scenarios
export const renderWithUser = (ui: ReactElement, options?: RenderOptions) => {
  return customRender(ui, options)
}

export const renderWithoutUser = (ui: ReactElement, options?: RenderOptions) => {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={createTestQueryClient()}>
        <BrowserRouter>
          <ThemeProvider theme={appleTheme}>
            <CssBaseline />
            <DualModeProvider>
              {children}
            </DualModeProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    ),
    ...options,
  })
}

export const renderInProMode = (ui: ReactElement, options?: RenderOptions) => {
  return customRender(ui, { ...options, initialMode: 'pro' })
}

export const renderInNoviceMode = (ui: ReactElement, options?: RenderOptions) => {
  return customRender(ui, { ...options, initialMode: 'novice' })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }