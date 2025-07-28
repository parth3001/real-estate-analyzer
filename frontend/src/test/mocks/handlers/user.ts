import { http, HttpResponse } from 'msw'
import { mockUserData } from '../../fixtures/propertyData'

export const userHandlers = [
  // Update user preferences
  http.put('/api/users/preferences', async ({ request }) => {
    const preferences = await request.json()
    
    return HttpResponse.json({
      user: {
        ...mockUserData,
        preferences: {
          ...mockUserData.preferences,
          ...preferences
        }
      }
    })
  }),

  // Get user profile
  http.get('/api/users/profile', () => {
    return HttpResponse.json({ user: mockUserData })
  }),

  // Update user profile
  http.put('/api/users/profile', async ({ request }) => {
    const updates = await request.json()
    
    return HttpResponse.json({
      user: {
        ...mockUserData,
        ...updates
      }
    })
  })
]