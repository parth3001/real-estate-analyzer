import { http, HttpResponse } from 'msw'
import { mockAnalysisResult } from '../../fixtures/propertyData'

export const analysisHandlers = [
  // Analyze property endpoint
  http.post('/api/deals/analyze', async ({ request }) => {
    const propertyData = await request.json()
    
    // Simulate analysis processing time
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Return different results based on property characteristics
    const analysis = {
      ...mockAnalysisResult,
      // Modify result based on input data
      monthlyAnalysis: {
        ...mockAnalysisResult.monthlyAnalysis,
        grossIncome: propertyData.monthlyRent || 2940
      }
    }
    
    return HttpResponse.json(analysis)
  }),

  // Save deal endpoint
  http.post('/api/deals', async ({ request }) => {
    const dealData = await request.json()
    
    return HttpResponse.json({
      id: 'mock-deal-id',
      ...dealData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }),

  // Get saved deals
  http.get('/api/deals', () => {
    return HttpResponse.json([
      {
        id: '1',
        propertyName: 'Test Property 1',
        propertyAddress: {
          street: '123 Main St',
          city: 'Nashville',
          state: 'TN',
          zipCode: '37203'
        },
        analysis: mockAnalysisResult,
        createdAt: '2025-01-01T00:00:00Z'
      }
    ])
  }),

  // Get specific deal
  http.get('/api/deals/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      propertyName: 'Test Property',
      analysis: mockAnalysisResult,
      createdAt: '2025-01-01T00:00:00Z'
    })
  }),

  // Market data endpoints
  http.get('/api/market-data/fred', () => {
    return HttpResponse.json({
      mortgageRate: 6.75,
      inflationRate: 2.67,
      unemploymentRate: 4.1,
      housingIndex: 329.608
    })
  }),

  http.get('/api/market-data/rentcast', () => {
    return HttpResponse.json({
      estimatedRent: 2940,
      confidence: 80,
      rentRange: { min: 2500, max: 3200 },
      marketTrends: {
        medianRent: 2850,
        rentGrowthRate: 3.2,
        daysOnMarket: 45
      }
    })
  })
]