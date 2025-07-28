/// <reference types="cypress" />

/**
 * Frontend Discovery Test
 * 
 * This test explores the actual frontend structure to understand
 * how to navigate and interact with the real application.
 */

describe('Frontend Structure Discovery', () => {
  it('should discover the actual frontend navigation structure', () => {
    cy.visit('/')
    
    // Take a screenshot to see what's actually loaded
    cy.screenshot('frontend-homepage')
    
    // Log all visible text to understand the UI
    cy.get('body').then(($body) => {
      const bodyText = $body.text()
      console.log('=== FRONTEND CONTENT ===')
      console.log(bodyText.substring(0, 500)) // First 500 chars
      
      // Look for navigation links or buttons
      const navElements = $body.find('a, button, [role="button"], nav *')
      console.log('=== NAVIGATION ELEMENTS ===')
      navElements.each((i, el) => {
        const text = el.textContent?.trim()
        if (text && text.length > 0) {
          console.log(`${i}: ${text}`)
        }
      })
    })
    
    // Try to find any clickable elements that might lead to analysis
    cy.get('body').then(($body) => {
      // Look for various patterns that might indicate analysis pages
      const analysisPatterns = [
        'analysis', 'analyze', 'sfr', 'property', 'investment',
        'calculate', 'evaluate', 'dashboard', 'home'
      ]
      
      analysisPatterns.forEach(pattern => {
        const matchingElements = $body.find(`*:contains("${pattern}")`)
        if (matchingElements.length > 0) {
          console.log(`Found elements containing "${pattern}":`, matchingElements.length)
          matchingElements.each((i, el) => {
            if (i < 3) { // Log first 3 matches
              console.log(`  - ${el.tagName}: "${el.textContent?.trim()}"`)
            }
          })
        }
      })
    })
    
    // Check if there are any forms visible on the homepage
    cy.get('body').then(($body) => {
      const forms = $body.find('form, input, textarea, select')
      if (forms.length > 0) {
        console.log('=== FORM ELEMENTS FOUND ===')
        forms.each((i, el) => {
          if (i < 10) { // Log first 10
            const name = el.getAttribute('name') || el.getAttribute('id') || el.tagName
            console.log(`  - ${name}: ${el.tagName}`)
          }
        })
      }
    })
    
    // Try clicking on anything that looks like it might navigate to SFR analysis
    const possibleNavs = [
      'SFR Analysis',
      'Property Analysis', 
      'Analysis',
      'SFR',
      'Real Estate',
      'Dashboard',
      'Get Started',
      'Start Analysis'
    ]
    
    possibleNavs.forEach(navText => {
      cy.get('body').then(($body) => {
        if ($body.find(`*:contains("${navText}")`).length > 0) {
          console.log(`✅ Found navigation element: "${navText}"`)
          // Don't actually click, just log that we found it
        }
      })
    })
  })
  
  it('should try to access the analysis page directly via URL', () => {
    const possibleUrls = [
      '/sfr-analysis',
      '/SFRAnalysis', 
      '/analysis',
      '/property-analysis',
      '/dashboard',
      '/analyze'
    ]
    
    possibleUrls.forEach(url => {
      cy.visit(url, { failOnStatusCode: false })
      
      cy.url().then(currentUrl => {
        console.log(`Tried ${url}, current URL: ${currentUrl}`)
      })
      
      cy.get('body').then(($body) => {
        const hasAnalysisForm = $body.find('input[name*="price"], input[name*="rent"], input[name*="address"]').length > 0
        if (hasAnalysisForm) {
          console.log(`✅ Found analysis form at ${url}`)
          cy.screenshot(`analysis-form-${url.replace(/\//g, '-')}`)
        }
      })
    })
  })
})