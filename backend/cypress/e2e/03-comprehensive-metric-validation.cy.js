/// <reference types="cypress" />

/**
 * Comprehensive Metric Validation E2E Tests
 * 
 * This test suite validates ALL metrics between backend calculations 
 * and frontend display, automatically adapting to new metrics.
 * 
 * Designed to catch bugs like AI score truncation (55 → 5)
 */

describe('Comprehensive Metric Validation', () => {
  beforeEach(() => {
    cy.task('clearDatabase')
    cy.visit('/')
  })

  it('should validate ALL property analysis metrics against backend calculations', () => {
    // Test data - property that should generate comprehensive analysis
    const testProperty = {
      address: '123 Test Street, Austin, TX 78701',
      purchasePrice: 400000,
      downPayment: 80000,
      interestRate: 6.5,
      loanTerm: 30,
      monthlyRent: 2800,
      propertyTaxes: 8000,
      insurance: 1200,
      maintenance: 2400,
      vacancy: 5,
      propertyType: 'SFR'
    }

    // Navigate to SFR Analysis via direct URL (more reliable)
    cy.visit('/sfr-analysis')

    // Fill out the property form
    cy.get('[data-testid="address"], input[name="address"]', { timeout: 10000 })
      .should('be.visible')
      .type(testProperty.address)

    cy.get('[data-testid="purchase-price"], input[name="purchasePrice"]')
      .clear()
      .type(testProperty.purchasePrice.toString())

    cy.get('[data-testid="down-payment"], input[name="downPayment"]')
      .clear()
      .type(testProperty.downPayment.toString())

    cy.get('[data-testid="interest-rate"], input[name="interestRate"]')
      .clear()
      .type(testProperty.interestRate.toString())

    cy.get('[data-testid="monthly-rent"], input[name="monthlyRent"]')
      .clear()
      .type(testProperty.monthlyRent.toString())

    // Submit analysis
    cy.contains('Analyze Property', { timeout: 10000 }).click()

    // Wait for analysis to complete
    cy.contains('Analysis Results', { timeout: 20000 }).should('be.visible')

    // Intercept the backend API response to compare with frontend display
    cy.intercept('POST', '**/api/deals/analyze').as('analyzeProperty')
    
    // Re-run analysis to capture API response
    cy.contains('Analyze Property').click()
    
    cy.wait('@analyzeProperty', { timeout: 30000 }).then((interception) => {
      const backendResponse = interception.response.body
      
      // Wait for frontend to update
      cy.wait(2000)
      
      // Automatically validate all numeric metrics
      validateAllMetrics(backendResponse)
    })
  })

  it('should detect AI score truncation bug specifically', () => {
    // Use a property that generates a two-digit AI score
    const highScoreProperty = {
      address: '456 High Score Ave, Austin, TX 78702',
      purchasePrice: 300000,
      downPayment: 60000,
      interestRate: 5.5,
      monthlyRent: 3000,
      propertyTaxes: 6000,
      insurance: 1000,
      maintenance: 1800
    }

    cy.visit('/sfr-analysis')
    
    // Fill minimal required fields
    cy.get('input[name="address"]', { timeout: 10000 })
      .type(highScoreProperty.address)
    cy.get('input[name="purchasePrice"]')
      .clear()
      .type(highScoreProperty.purchasePrice.toString())
    cy.get('input[name="monthlyRent"]')
      .clear()
      .type(highScoreProperty.monthlyRent.toString())

    // Analyze property
    cy.contains('Analyze Property').click()
    
    // Wait for results
    cy.contains('Analysis Results', { timeout: 20000 }).should('be.visible')

    // Look specifically for AI-related scores
    cy.get('body').then(($body) => {
      const bodyText = $body.text()
      
      // Check for score display issues
      const scoreMatches = bodyText.match(/(\d+)(?:\s*(?:score|rating))/gi) || []
      
      scoreMatches.forEach(match => {
        const scoreValue = parseInt(match.replace(/\D/g, ''))
        
        // If we find a single-digit score where we expect higher values
        if (scoreValue >= 1 && scoreValue <= 9) {
          cy.log(`⚠️  Potential truncation: Found score ${scoreValue}`)
          
          // This would indicate the 55 → 5 bug
          cy.wrap(scoreValue).should('be.greaterThan', 9, 
            `Score ${scoreValue} might be truncated from a larger value`)
        }
      })
    })
  })

  it('should validate financial calculations accuracy', () => {
    const calculationTestProperty = {
      address: '789 Math Street, Austin, TX 78703',
      purchasePrice: 500000,
      downPayment: 100000,
      interestRate: 7.0,
      loanTerm: 30,
      monthlyRent: 3500,
      propertyTaxes: 10000,
      insurance: 1500,
      maintenance: 3000,
      vacancy: 8
    }

    cy.visit('/sfr-analysis')
    
    // Fill comprehensive data
    Object.entries(calculationTestProperty).forEach(([key, value]) => {
      cy.get(`input[name="${key}"]`, { timeout: 5000 })
        .clear()
        .type(value.toString())
    })

    cy.contains('Analyze Property').click()
    cy.contains('Analysis Results', { timeout: 20000 }).should('be.visible')

    // Validate key calculated metrics are reasonable
    cy.get('body').then(($body) => {
      const text = $body.text()
      
      // Check for cap rate (should be between 1-15%)
      const capRateMatch = text.match(/cap\s*rate[:\s]*(\d+\.?\d*)%?/i)
      if (capRateMatch) {
        const capRate = parseFloat(capRateMatch[1])
        cy.wrap(capRate).should('be.within', 1, 15, 'Cap rate should be reasonable (1-15%)')
      }

      // Check for cash flow (should be positive for this good deal)
      const cashFlowMatch = text.match(/cash\s*flow[:\s]*\$?(-?\d+(?:,\d{3})*(?:\.\d{2})?)/i)
      if (cashFlowMatch) {
        const cashFlow = parseFloat(cashFlowMatch[1].replace(/,/g, ''))
        cy.wrap(cashFlow).should('be.greaterThan', 0, 'Cash flow should be positive for this property')
      }
    })
  })
})

/**
 * Automatically validates all numeric metrics between backend and frontend
 * This function adapts to any metric structure without hardcoding field names
 */
function validateAllMetrics(backendData) {
  // Extract all numeric values from backend response
  const backendMetrics = extractNumericFields(backendData)
  
  cy.log(`Found ${backendMetrics.length} numeric metrics in backend response`)
  
  // Validate each metric appears correctly in frontend
  backendMetrics.forEach(metric => {
    if (metric.value >= 10) {
      // Check for truncation issues on multi-digit numbers
      cy.get('body').then(($body) => {
        const bodyText = $body.text()
        
        // Look for the value in the UI
        const valueStr = metric.value.toString()
        const truncatedStr = valueStr.charAt(0) // First digit only
        
        // If we find the truncated version but not the full value
        if (bodyText.includes(truncatedStr) && !bodyText.includes(valueStr)) {
          // Potential truncation bug detected
          cy.log(`🚨 POTENTIAL TRUNCATION: ${metric.path} = ${metric.value} may show as ${truncatedStr}`)
          
          // This test should fail to alert developers
          cy.wrap(false).should('be.true', 
            `Truncation bug detected: ${metric.path} shows "${truncatedStr}" instead of "${valueStr}"`)
        }
      })
    }
  })
}

/**
 * Recursively extracts all numeric fields from an object
 */
function extractNumericFields(obj, path = '', results = []) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const currentPath = path ? `${path}.${key}` : key
      const value = obj[key]
      
      if (typeof value === 'number') {
        results.push({
          path: currentPath,
          value: value,
          key: key
        })
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        extractNumericFields(value, currentPath, results)
      }
    }
  }
  
  return results
}