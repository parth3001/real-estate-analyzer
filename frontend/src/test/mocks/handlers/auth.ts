import { http, HttpResponse } from 'msw'
import { mockUserData } from '../../fixtures/propertyData'

export const authHandlers = [
  // Login endpoint
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string }
    
    if (email === 'test@example.com' && password === 'password') {
      return HttpResponse.json({
        user: mockUserData,
        token: 'mock-jwt-token'
      })
    }
    
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    )
  }),

  // Register endpoint
  http.post('/api/auth/register', async ({ request }) => {
    const userData = await request.json()
    
    return HttpResponse.json({
      user: { ...mockUserData, ...userData },
      token: 'mock-jwt-token'
    })
  }),

  // Get current user
  http.get('/api/auth/me', ({ request }) => {
    const authorization = request.headers.get('Authorization')
    
    if (!authorization || !authorization.includes('Bearer')) {
      return HttpResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return HttpResponse.json({ user: mockUserData })
  }),

  // Logout endpoint
  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ message: 'Logged out successfully' })
  })
]