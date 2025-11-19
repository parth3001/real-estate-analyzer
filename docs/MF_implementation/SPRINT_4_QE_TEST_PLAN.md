# Sprint 4: MF Results Display - QE Test Plan

**Date**: November 15, 2025
**QE Lead**: Claude (QE Engineer - 20 years experience, Amazon AWS + Zillow)
**Sprint Duration**: 7-8 weeks (54 hours)
**Test Strategy**: Comprehensive unit + integration + E2E + regression testing
**Coverage Target**: 80%+ code coverage, 100% critical path coverage

---

## 📋 **Executive Summary**

This comprehensive test plan ensures Sprint 4 (MF Results Display UI) delivers production-ready quality while maintaining **zero SFR regression**. The plan covers all 9 implementation stories with:

- **Unit Tests**: Component-level validation (React Testing Library)
- **Integration Tests**: Backend-frontend data flow validation
- **E2E Tests**: Complete user journey validation (Cypress or Playwright)
- **Regression Tests**: Ensure SFR functionality unchanged
- **Performance Tests**: <200ms rendering, <5s full analysis
- **Accessibility Tests**: WCAG 2.1 AA compliance

---

## 🎯 **Test Objectives**

### **Primary Objectives**
1. ✅ **Validate MF-specific UI components** display correct data from backend JSON
2. ✅ **Ensure zero SFR regression** - all existing SFR tests pass unchanged
3. ✅ **Validate conditional rendering logic** - MF vs SFR component switching
4. ✅ **Test data mapping accuracy** - all 85+ backend fields correctly displayed
5. ✅ **Performance validation** - no degradation in rendering or analysis speed

### **Success Criteria**
- 80%+ code coverage for new MF components
- 100% coverage for critical paths (hero metrics, unit mix, conditional rendering)
- Zero breaking changes to existing SFR components
- All visual regression tests pass (screenshots match baseline)
- Performance benchmarks maintained (<200ms component render, <5s analysis)

---

## 🗂️ **Test Plan Structure**

### **Phase 1: Unit Tests** (Stories 4.1-4.9)
Component-level testing using React Testing Library

### **Phase 2: Integration Tests**
Backend-frontend data flow validation

### **Phase 3: E2E Tests**
Complete MF analysis user journey

### **Phase 4: Regression Tests**
Ensure SFR functionality unchanged

### **Phase 5: Performance & Visual Tests**
Rendering speed and UI consistency

---

## 📝 **PHASE 1: UNIT TESTS**

### **Story 4.1: Conditional Hero Metrics (6 hours)**

**Test File**: `frontend/src/components/SFRAnalysis/__tests__/InvestmentDecisionHero.test.tsx`

#### **Test Suite 1.1: MF Hero Metrics Rendering**

**Purpose**: Validate MF properties display Cap Rate, DSCR, NOI, Cash-on-Cash as hero metrics

```typescript
describe('Story 4.1: MF Conditional Hero Metrics', () => {
  describe('MF Property Hero Metrics', () => {
    it('should display Cap Rate as hero metric #1 for MF', () => {
      const mfAnalysis = createMFAnalysisFixture();
      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      const heroMetric1 = screen.getByTestId('hero-metric-1');
      expect(heroMetric1).toHaveTextContent('Cap Rate');
      expect(heroMetric1).toHaveTextContent('6.21%');
    });

    it('should display DSCR as hero metric #2 for MF', () => {
      const mfAnalysis = createMFAnalysisFixture();
      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      const heroMetric2 = screen.getByTestId('hero-metric-2');
      expect(heroMetric2).toHaveTextContent('DSCR');
      expect(heroMetric2).toHaveTextContent('1.25x');
    });

    it('should display NOI as hero metric #3 for MF', () => {
      const mfAnalysis = createMFAnalysisFixture();
      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      const heroMetric3 = screen.getByTestId('hero-metric-3');
      expect(heroMetric3).toHaveTextContent('Net Operating Income');
      expect(heroMetric3).toHaveTextContent('$74,472');
    });

    it('should display Cash-on-Cash as hero metric #4 for MF', () => {
      const mfAnalysis = createMFAnalysisFixture();
      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      const heroMetric4 = screen.getByTestId('hero-metric-4');
      expect(heroMetric4).toHaveTextContent('Cash-on-Cash Return');
      expect(heroMetric4).toHaveTextContent('8.5%');
    });
  });

  describe('SFR Property Hero Metrics (Regression)', () => {
    it('should display Monthly Cash Flow as hero metric #1 for SFR', () => {
      const sfrAnalysis = createSFRAnalysisFixture();
      render(<InvestmentDecisionHero analysis={sfrAnalysis} />);

      const heroMetric1 = screen.getByTestId('hero-metric-1');
      expect(heroMetric1).toHaveTextContent('Monthly Cash Flow');
      expect(heroMetric1).toHaveTextContent('$450');
    });

    it('should NOT display Cap Rate as hero metric #1 for SFR', () => {
      const sfrAnalysis = createSFRAnalysisFixture();
      render(<InvestmentDecisionHero analysis={sfrAnalysis} />);

      const heroMetric1 = screen.getByTestId('hero-metric-1');
      expect(heroMetric1).not.toHaveTextContent('Cap Rate');
    });
  });

  describe('Conditional Logic Validation', () => {
    it('should correctly detect propertyType === "MF"', () => {
      const mfAnalysis = createMFAnalysisFixture({ propertyType: 'MF' });
      const { container } = render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      // Verify MF-specific class or data attribute
      expect(container.querySelector('[data-property-type="MF"]')).toBeInTheDocument();
    });

    it('should correctly detect propertyType === "SFR"', () => {
      const sfrAnalysis = createSFRAnalysisFixture({ propertyType: 'SFR' });
      const { container } = render(<InvestmentDecisionHero analysis={sfrAnalysis} />);

      expect(container.querySelector('[data-property-type="SFR"]')).toBeInTheDocument();
    });

    it('should handle missing propertyType gracefully (default to SFR)', () => {
      const analysisWithoutType = createSFRAnalysisFixture();
      delete analysisWithoutType.propertyType;

      render(<InvestmentDecisionHero analysis={analysisWithoutType} />);

      // Should fall back to SFR hero metrics
      expect(screen.getByText(/Monthly Cash Flow/i)).toBeInTheDocument();
    });
  });

  describe('Data Accuracy Validation', () => {
    it('should format Cap Rate correctly (percentage with 2 decimals)', () => {
      const mfAnalysis = createMFAnalysisFixture({ capRate: 0.0621 });
      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      expect(screen.getByText('6.21%')).toBeInTheDocument();
    });

    it('should format DSCR correctly (ratio with "x" suffix)', () => {
      const mfAnalysis = createMFAnalysisFixture({ dscr: 1.25 });
      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      expect(screen.getByText('1.25x')).toBeInTheDocument();
    });

    it('should format NOI correctly (currency with no decimals)', () => {
      const mfAnalysis = createMFAnalysisFixture({ noi: 74472.50 });
      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      expect(screen.getByText('$74,473')).toBeInTheDocument();
    });

    it('should handle negative NOI edge case', () => {
      const mfAnalysis = createMFAnalysisFixture({ noi: -5000 });
      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      expect(screen.getByText('-$5,000')).toBeInTheDocument();
      // Should show negative status styling
      const heroMetric3 = screen.getByTestId('hero-metric-3');
      expect(heroMetric3).toHaveClass('negative-value'); // or similar
    });
  });

  describe('Accessibility (a11y)', () => {
    it('should have proper ARIA labels for hero metrics', () => {
      const mfAnalysis = createMFAnalysisFixture();
      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      expect(screen.getByLabelText('Cap Rate metric')).toBeInTheDocument();
      expect(screen.getByLabelText('DSCR metric')).toBeInTheDocument();
      expect(screen.getByLabelText('Net Operating Income metric')).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      const mfAnalysis = createMFAnalysisFixture();
      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      const heroMetric1 = screen.getByTestId('hero-metric-1');
      expect(heroMetric1).toHaveAttribute('tabIndex', '0');
    });
  });
});
```

**Coverage Target**: 90%+ (critical component)
**Estimated Tests**: 15 tests
**Execution Time**: ~5 seconds

---

### **Story 4.2: Add Unit Mix Tab (4 hours)**

**Test File**: `frontend/src/components/SFRAnalysis/__tests__/AnalysisResults.test.tsx`

#### **Test Suite 1.2: Unit Mix Tab Injection**

**Purpose**: Validate Unit Mix tab appears only for MF properties

```typescript
describe('Story 4.2: Unit Mix Tab Injection', () => {
  describe('MF Property Navigation Tabs', () => {
    it('should inject "Unit Mix" tab after "Overview" for MF properties', () => {
      const mfAnalysis = createMFAnalysisFixture({ propertyType: 'MF' });
      render(<AnalysisResults analysis={mfAnalysis} />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveTextContent('Overview');
      expect(tabs[1]).toHaveTextContent('Unit Mix');
      expect(tabs[2]).toHaveTextContent('Financial Details');
    });

    it('should display Unit Mix tab with correct icon', () => {
      const mfAnalysis = createMFAnalysisFixture();
      render(<AnalysisResults analysis={mfAnalysis} />);

      const unitMixTab = screen.getByRole('tab', { name: /Unit Mix/i });
      expect(unitMixTab.querySelector('svg')).toBeInTheDocument(); // Icon present
    });

    it('should have Unit Mix tab clickable', () => {
      const mfAnalysis = createMFAnalysisFixture();
      render(<AnalysisResults analysis={mfAnalysis} />);

      const unitMixTab = screen.getByRole('tab', { name: /Unit Mix/i });
      fireEvent.click(unitMixTab);

      expect(unitMixTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('SFR Property Navigation Tabs (Regression)', () => {
    it('should NOT inject "Unit Mix" tab for SFR properties', () => {
      const sfrAnalysis = createSFRAnalysisFixture({ propertyType: 'SFR' });
      render(<AnalysisResults analysis={sfrAnalysis} />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveTextContent('Overview');
      expect(tabs[1]).toHaveTextContent('Financial Details');

      // Verify Unit Mix tab does NOT exist
      expect(screen.queryByRole('tab', { name: /Unit Mix/i })).not.toBeInTheDocument();
    });

    it('should maintain original tab order for SFR', () => {
      const sfrAnalysis = createSFRAnalysisFixture();
      render(<AnalysisResults analysis={sfrAnalysis} />);

      const tabs = screen.getAllByRole('tab').map(tab => tab.textContent);
      expect(tabs).toEqual([
        'Overview',
        'Financial Details',
        'Projections',
        'AI Insights',
        'Market Data'
      ]);
    });
  });

  describe('Tab Array Manipulation Logic', () => {
    it('should correctly splice Unit Mix tab into allAnalysisSections', () => {
      const mfAnalysis = createMFAnalysisFixture();
      const { container } = render(<AnalysisResults analysis={mfAnalysis} />);

      // Verify tab count increased by 1
      const tabs = screen.getAllByRole('tab');
      const sfrTabCount = 11; // Existing SFR tab count
      expect(tabs.length).toBe(sfrTabCount + 1);
    });

    it('should not duplicate Unit Mix tab on re-renders', () => {
      const mfAnalysis = createMFAnalysisFixture();
      const { rerender } = render(<AnalysisResults analysis={mfAnalysis} />);

      rerender(<AnalysisResults analysis={mfAnalysis} />);
      rerender(<AnalysisResults analysis={mfAnalysis} />);

      const unitMixTabs = screen.getAllByRole('tab', { name: /Unit Mix/i });
      expect(unitMixTabs.length).toBe(1); // Only one Unit Mix tab
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined propertyType gracefully', () => {
      const analysisWithoutType = createMFAnalysisFixture();
      delete analysisWithoutType.propertyType;

      render(<AnalysisResults analysis={analysisWithoutType} />);

      // Should default to SFR behavior (no Unit Mix tab)
      expect(screen.queryByRole('tab', { name: /Unit Mix/i })).not.toBeInTheDocument();
    });

    it('should handle null analysis object', () => {
      render(<AnalysisResults analysis={null} />);

      // Should render empty state or loading state
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });
  });
});
```

**Coverage Target**: 85%+
**Estimated Tests**: 10 tests
**Execution Time**: ~3 seconds

---

### **Story 4.3: Create UnitMixAnalysisTab Component (16 hours)**

**Test File**: `frontend/src/components/SFRAnalysis/__tests__/UnitMixAnalysisTab.test.tsx`

#### **Test Suite 1.3: Unit Mix Analysis Component**

**Purpose**: Comprehensive validation of competitive moat feature - unit-level intelligence

```typescript
describe('Story 4.3: Unit Mix Analysis Tab', () => {
  describe('Unit Mix Summary Table', () => {
    it('should render unit mix summary table with correct columns', () => {
      const mfData = createMFPropertyDataFixture({
        units: [
          { bedrooms: 1, bathrooms: 1, currentRent: 1800, sqft: 800 },
          { bedrooms: 1, bathrooms: 1, currentRent: 1850, sqft: 800 },
          { bedrooms: 2, bathrooms: 2, currentRent: 2500, sqft: 1200 },
        ]
      });

      render(<UnitMixAnalysisTab propertyData={mfData} analysis={createMFAnalysisFixture()} />);

      expect(screen.getByText('Unit Type')).toBeInTheDocument();
      expect(screen.getByText('Count')).toBeInTheDocument();
      expect(screen.getByText('Avg Rent')).toBeInTheDocument();
      expect(screen.getByText('Monthly Income')).toBeInTheDocument();
      expect(screen.getByText('% of Revenue')).toBeInTheDocument();
    });

    it('should group units by bedrooms/bathrooms correctly', () => {
      const mfData = createMFPropertyDataFixture({
        units: [
          { bedrooms: 1, bathrooms: 1, currentRent: 1800 },
          { bedrooms: 1, bathrooms: 1, currentRent: 1850 },
          { bedrooms: 2, bathrooms: 2, currentRent: 2500 },
          { bedrooms: 2, bathrooms: 2, currentRent: 2550 },
        ]
      });

      render(<UnitMixAnalysisTab propertyData={mfData} analysis={createMFAnalysisFixture()} />);

      expect(screen.getByText('1bed/1bath')).toBeInTheDocument();
      expect(screen.getByText('2bed/2bath')).toBeInTheDocument();
    });

    it('should calculate average rent per unit type correctly', () => {
      const mfData = createMFPropertyDataFixture({
        units: [
          { bedrooms: 1, bathrooms: 1, currentRent: 1800 },
          { bedrooms: 1, bathrooms: 1, currentRent: 1900 }, // Avg: $1,850
        ]
      });

      render(<UnitMixAnalysisTab propertyData={mfData} analysis={createMFAnalysisFixture()} />);

      expect(screen.getByText('$1,850')).toBeInTheDocument();
    });

    it('should calculate monthly income per unit type correctly', () => {
      const mfData = createMFPropertyDataFixture({
        units: [
          { bedrooms: 1, bathrooms: 1, currentRent: 1800 },
          { bedrooms: 1, bathrooms: 1, currentRent: 1800 }, // Total: $3,600
        ]
      });

      render(<UnitMixAnalysisTab propertyData={mfData} analysis={createMFAnalysisFixture()} />);

      expect(screen.getByText('$3,600')).toBeInTheDocument();
    });

    it('should calculate percentage of revenue correctly', () => {
      const mfData = createMFPropertyDataFixture({
        units: [
          { bedrooms: 1, bathrooms: 1, currentRent: 1000 }, // $1,000 / $3,000 = 33.3%
          { bedrooms: 2, bathrooms: 2, currentRent: 2000 }, // $2,000 / $3,000 = 66.7%
        ]
      });

      render(<UnitMixAnalysisTab propertyData={mfData} analysis={createMFAnalysisFixture()} />);

      expect(screen.getByText('33.3%')).toBeInTheDocument();
      expect(screen.getByText('66.7%')).toBeInTheDocument();
    });
  });

  describe('Unit Mix Concentration Warning', () => {
    it('should display warning when unit type > 50% of revenue', () => {
      const mfData = createMFPropertyDataFixture({
        units: [
          { bedrooms: 1, bathrooms: 1, currentRent: 1000 },
          { bedrooms: 2, bathrooms: 2, currentRent: 3000 }, // 75% of revenue
        ]
      });

      render(<UnitMixAnalysisTab propertyData={mfData} analysis={createMFAnalysisFixture()} />);

      expect(screen.getByText(/Unit Mix Concentration Risk/i)).toBeInTheDocument();
    });

    it('should NOT display warning when unit types are balanced', () => {
      const mfData = createMFPropertyDataFixture({
        units: [
          { bedrooms: 1, bathrooms: 1, currentRent: 1800 },
          { bedrooms: 1, bathrooms: 1, currentRent: 1800 }, // 45% of revenue
          { bedrooms: 2, bathrooms: 2, currentRent: 2200 }, // 55% of revenue
        ]
      });

      render(<UnitMixAnalysisTab propertyData={mfData} analysis={createMFAnalysisFixture()} />);

      expect(screen.queryByText(/Unit Mix Concentration Risk/i)).not.toBeInTheDocument();
    });

    it('should display concentration warning with severity color (orange)', () => {
      const mfData = createMFPropertyDataFixture({
        units: [
          { bedrooms: 1, bathrooms: 1, currentRent: 1000 },
          { bedrooms: 2, bathrooms: 2, currentRent: 5000 }, // 83% of revenue
        ]
      });

      render(<UnitMixAnalysisTab propertyData={mfData} analysis={createMFAnalysisFixture()} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('warning'); // or MUI severity="warning"
    });
  });

  describe('Per-Unit Metrics Cards', () => {
    it('should display Price Per Unit card with correct value', () => {
      const analysis = createMFAnalysisFixture({
        keyMetrics: { pricePerUnit: 200000 }
      });

      render(<UnitMixAnalysisTab propertyData={createMFPropertyDataFixture()} analysis={analysis} />);

      expect(screen.getByText('Price Per Unit')).toBeInTheDocument();
      expect(screen.getByText('$200,000')).toBeInTheDocument();
    });

    it('should display NOI Per Unit card with monthly breakdown', () => {
      const analysis = createMFAnalysisFixture({
        keyMetrics: { noiPerUnit: 12000 } // Annual
      });

      render(<UnitMixAnalysisTab propertyData={createMFPropertyDataFixture()} analysis={analysis} />);

      expect(screen.getByText('NOI Per Unit')).toBeInTheDocument();
      expect(screen.getByText('$12,000')).toBeInTheDocument();
      expect(screen.getByText('$1,000/month')).toBeInTheDocument(); // noiPerUnit / 12
    });

    it('should display Average Rent Per Unit card with annual total', () => {
      const analysis = createMFAnalysisFixture({
        keyMetrics: { averageRentPerUnit: 2000 } // Monthly
      });

      render(<UnitMixAnalysisTab propertyData={createMFPropertyDataFixture()} analysis={analysis} />);

      expect(screen.getByText('Avg Rent Per Unit')).toBeInTheDocument();
      expect(screen.getByText('$2,000')).toBeInTheDocument();
      expect(screen.getByText('$24,000/year')).toBeInTheDocument(); // avgRent * 12
    });

    it('should display Rent Per Sqft card with building sqft context', () => {
      const analysis = createMFAnalysisFixture({
        keyMetrics: { rentPerSqft: 1.20 }
      });
      const mfData = createMFPropertyDataFixture({ totalSqft: 12000 });

      render(<UnitMixAnalysisTab propertyData={mfData} analysis={analysis} />);

      expect(screen.getByText('Rent Per Sqft')).toBeInTheDocument();
      expect(screen.getByText('$1.20')).toBeInTheDocument();
      expect(screen.getByText('12,000 sqft total')).toBeInTheDocument();
    });

    it('should use AppleMetricCard component for consistency', () => {
      const analysis = createMFAnalysisFixture();
      const { container } = render(<UnitMixAnalysisTab propertyData={createMFPropertyDataFixture()} analysis={analysis} />);

      // AppleMetricCard should have specific class or data-testid
      const metricCards = container.querySelectorAll('[data-component="AppleMetricCard"]');
      expect(metricCards.length).toBeGreaterThanOrEqual(4); // 4 per-unit cards
    });
  });

  describe('AI Insights Integration (Conditional)', () => {
    it('should display AI insights card when unitMixOptimization exists', () => {
      const analysis = createMFAnalysisFixture({
        aiInsights: {
          unitMixOptimization: 'Consider converting 2 studio units to 1bed/1bath for $200/month upside'
        }
      });

      render(<UnitMixAnalysisTab propertyData={createMFPropertyDataFixture()} analysis={analysis} />);

      expect(screen.getByText(/Unit Mix Optimization/i)).toBeInTheDocument();
      expect(screen.getByText(/converting 2 studio units/i)).toBeInTheDocument();
    });

    it('should NOT display AI insights card when unitMixOptimization is undefined', () => {
      const analysis = createMFAnalysisFixture({
        aiInsights: {} // No unitMixOptimization field
      });

      render(<UnitMixAnalysisTab propertyData={createMFPropertyDataFixture()} analysis={analysis} />);

      expect(screen.queryByText(/Unit Mix Optimization/i)).not.toBeInTheDocument();
    });

    it('should handle null aiInsights gracefully', () => {
      const analysis = createMFAnalysisFixture({ aiInsights: null });

      render(<UnitMixAnalysisTab propertyData={createMFPropertyDataFixture()} analysis={analysis} />);

      // Component should render without crashing
      expect(screen.getByText('Unit Mix Summary')).toBeInTheDocument();
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle empty units array gracefully', () => {
      const mfData = createMFPropertyDataFixture({ units: [] });

      render(<UnitMixAnalysisTab propertyData={mfData} analysis={createMFAnalysisFixture()} />);

      expect(screen.getByText(/No unit data available/i)).toBeInTheDocument();
    });

    it('should handle missing currentRent values', () => {
      const mfData = createMFPropertyDataFixture({
        units: [
          { bedrooms: 1, bathrooms: 1, currentRent: 0 },
          { bedrooms: 1, bathrooms: 1, currentRent: undefined },
        ]
      });

      render(<UnitMixAnalysisTab propertyData={mfData} analysis={createMFAnalysisFixture()} />);

      // Should display $0 or "Not specified" without crashing
      expect(screen.getByText(/Not specified|$0/i)).toBeInTheDocument();
    });

    it('should handle unusual unit configurations (studio, 3bed, etc.)', () => {
      const mfData = createMFPropertyDataFixture({
        units: [
          { bedrooms: 0, bathrooms: 1, currentRent: 1200 }, // Studio
          { bedrooms: 3, bathrooms: 2, currentRent: 3000 }, // 3bed/2bath
        ]
      });

      render(<UnitMixAnalysisTab propertyData={mfData} analysis={createMFAnalysisFixture()} />);

      expect(screen.getByText('Studio/1bath')).toBeInTheDocument();
      expect(screen.getByText('3bed/2bath')).toBeInTheDocument();
    });

    it('should handle very large unit counts (32+ units)', () => {
      const units = Array(32).fill(null).map(() => ({
        bedrooms: 1,
        bathrooms: 1,
        currentRent: 1800
      }));

      const mfData = createMFPropertyDataFixture({ units });

      render(<UnitMixAnalysisTab propertyData={mfData} analysis={createMFAnalysisFixture()} />);

      expect(screen.getByText('32')).toBeInTheDocument(); // Count column
    });
  });

  describe('Responsive Design & Accessibility', () => {
    it('should be mobile responsive (table scrolls horizontally)', () => {
      const { container } = render(
        <UnitMixAnalysisTab
          propertyData={createMFPropertyDataFixture()}
          analysis={createMFAnalysisFixture()}
        />
      );

      const table = container.querySelector('table');
      expect(table?.parentElement).toHaveStyle({ overflowX: 'auto' });
    });

    it('should have proper ARIA labels for table', () => {
      render(<UnitMixAnalysisTab propertyData={createMFPropertyDataFixture()} analysis={createMFAnalysisFixture()} />);

      expect(screen.getByRole('table', { name: /Unit Mix Summary/i })).toBeInTheDocument();
    });

    it('should have accessible color contrast for warnings', async () => {
      const mfData = createMFPropertyDataFixture({
        units: [
          { bedrooms: 1, bathrooms: 1, currentRent: 1000 },
          { bedrooms: 2, bathrooms: 2, currentRent: 5000 },
        ]
      });

      const { container } = render(<UnitMixAnalysisTab propertyData={mfData} analysis={createMFAnalysisFixture()} />);

      // Use axe-core or similar for a11y testing
      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should render within 200ms for 32-unit property', () => {
      const units = Array(32).fill(null).map(() => ({
        bedrooms: 1,
        bathrooms: 1,
        currentRent: 1800
      }));

      const mfData = createMFPropertyDataFixture({ units });

      const start = performance.now();
      render(<UnitMixAnalysisTab propertyData={mfData} analysis={createMFAnalysisFixture()} />);
      const end = performance.now();

      expect(end - start).toBeLessThan(200);
    });

    it('should use useMemo for expensive unit mix calculations', () => {
      const mfData = createMFPropertyDataFixture({
        units: Array(20).fill({ bedrooms: 1, bathrooms: 1, currentRent: 1800 })
      });

      const { rerender } = render(<UnitMixAnalysisTab propertyData={mfData} analysis={createMFAnalysisFixture()} />);

      // Spy on console to detect useMemo optimization
      const spy = jest.spyOn(console, 'log');

      rerender(<UnitMixAnalysisTab propertyData={mfData} analysis={createMFAnalysisFixture()} />);

      // useMemo should prevent recalculation (would need component implementation verification)
      expect(spy).not.toHaveBeenCalledWith(/Recalculating unit mix/i);
    });
  });
});
```

**Coverage Target**: 90%+ (competitive moat feature)
**Estimated Tests**: 35 tests
**Execution Time**: ~12 seconds

---

### **Story 4.5: MF-Specific Alerts (6 hours)**

**Test File**: `frontend/src/components/SFRAnalysis/__tests__/InvestmentDecisionHero.test.tsx`

#### **Test Suite 1.4: MF Alert System**

```typescript
describe('Story 4.5: MF-Specific Alerts', () => {
  describe('DSCR Warning Alert', () => {
    it('should display DSCR warning when DSCR < 1.25', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { dscr: 1.15 }
      });

      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      expect(screen.getByRole('alert')).toHaveTextContent(/DSCR below lender requirement/i);
      expect(screen.getByText(/1.15x/i)).toBeInTheDocument();
      expect(screen.getByText(/1.25x minimum/i)).toBeInTheDocument();
    });

    it('should NOT display DSCR warning when DSCR >= 1.25', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { dscr: 1.30 }
      });

      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      expect(screen.queryByText(/DSCR below lender requirement/i)).not.toBeInTheDocument();
    });

    it('should display DSCR warning with severity "warning" (orange)', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { dscr: 1.20 }
      });

      const { container } = render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('severity', 'warning'); // MUI Alert
    });
  });

  describe('Small Property Warning Alert', () => {
    it('should display warning when totalUnits < 10', () => {
      const mfAnalysis = createMFAnalysisFixture({
        propertyData: { totalUnits: 8 }
      });

      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      expect(screen.getByText(/Small property: Higher per-unit operating costs/i)).toBeInTheDocument();
    });

    it('should NOT display warning when totalUnits >= 10', () => {
      const mfAnalysis = createMFAnalysisFixture({
        propertyData: { totalUnits: 12 }
      });

      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      expect(screen.queryByText(/Small property/i)).not.toBeInTheDocument();
    });

    it('should display small property warning with severity "info" (blue)', () => {
      const mfAnalysis = createMFAnalysisFixture({
        propertyData: { totalUnits: 6 }
      });

      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('severity', 'info');
    });
  });

  describe('High OER Warning Alert', () => {
    it('should display warning when OER > 55', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { operatingExpenseRatio: 62 }
      });

      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      expect(screen.getByText(/Operating expenses are high/i)).toBeInTheDocument();
      expect(screen.getByText(/62%/i)).toBeInTheDocument();
    });

    it('should NOT display warning when OER <= 55', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { operatingExpenseRatio: 50 }
      });

      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      expect(screen.queryByText(/Operating expenses are high/i)).not.toBeInTheDocument();
    });

    it('should display high OER warning with severity "error" (red)', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { operatingExpenseRatio: 65 }
      });

      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('severity', 'error');
    });
  });

  describe('Multiple Alerts Stacking', () => {
    it('should display multiple alerts when multiple conditions met', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { dscr: 1.15, operatingExpenseRatio: 62 },
        propertyData: { totalUnits: 6 }
      });

      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBe(3); // DSCR + OER + Small property
    });

    it('should stack alerts in severity order (error > warning > info)', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { dscr: 1.15, operatingExpenseRatio: 62 },
        propertyData: { totalUnits: 6 }
      });

      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      const alerts = screen.getAllByRole('alert');
      expect(alerts[0]).toHaveAttribute('severity', 'error'); // OER
      expect(alerts[1]).toHaveAttribute('severity', 'warning'); // DSCR
      expect(alerts[2]).toHaveAttribute('severity', 'info'); // Small property
    });
  });

  describe('SFR Regression - No Alerts', () => {
    it('should NOT display MF alerts for SFR properties', () => {
      const sfrAnalysis = createSFRAnalysisFixture({
        propertyType: 'SFR'
      });

      render(<InvestmentDecisionHero analysis={sfrAnalysis} />);

      expect(screen.queryByText(/DSCR below lender requirement/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Small property/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Operating expenses are high/i)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle DSCR = 0 (no debt)', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { dscr: 0 }
      });

      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      expect(screen.queryByText(/DSCR below lender requirement/i)).not.toBeInTheDocument();
    });

    it('should handle OER = 100% (extreme edge case)', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { operatingExpenseRatio: 100 }
      });

      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      expect(screen.getByText(/Operating expenses are high/i)).toBeInTheDocument();
    });

    it('should handle undefined totalUnits gracefully', () => {
      const mfAnalysis = createMFAnalysisFixture({
        propertyData: { totalUnits: undefined }
      });

      render(<InvestmentDecisionHero analysis={mfAnalysis} />);

      // Should not crash
      expect(screen.queryByText(/Small property/i)).not.toBeInTheDocument();
    });
  });
});
```

**Coverage Target**: 85%+
**Estimated Tests**: 15 tests
**Execution Time**: ~5 seconds

---

### **Story 4.6: Advanced Metrics Table (6 hours)**

**Test File**: `frontend/src/components/SFRAnalysis/__tests__/AnalysisResults.test.tsx`

#### **Test Suite 1.5: MF Advanced Metrics**

```typescript
describe('Story 4.6: Advanced MF Metrics Table', () => {
  describe('New MF Metrics Rendering', () => {
    it('should display Debt Yield metric with benchmark', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { debtYield: 11.5 }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      // Navigate to Financial Details tab
      fireEvent.click(screen.getByRole('tab', { name: /Financial Details/i }));

      expect(screen.getByText('Debt Yield')).toBeInTheDocument();
      expect(screen.getByText('11.5%')).toBeInTheDocument();
      expect(screen.getByText(/≥10% required/i)).toBeInTheDocument();
    });

    it('should display Economic Vacancy Rate metric', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { economicVacancyRate: 6.5 }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      fireEvent.click(screen.getByRole('tab', { name: /Financial Details/i }));

      expect(screen.getByText('Economic Vacancy Rate')).toBeInTheDocument();
      expect(screen.getByText('6.5%')).toBeInTheDocument();
      expect(screen.getByText(/≤7% good/i)).toBeInTheDocument();
    });

    it('should display Common Area Expense Ratio metric', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { commonAreaExpenseRatio: 2.5 }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      fireEvent.click(screen.getByRole('tab', { name: /Financial Details/i }));

      expect(screen.getByText('Common Area Expense Ratio')).toBeInTheDocument();
      expect(screen.getByText('2.5%')).toBeInTheDocument();
    });

    it('should display Unit Mix Efficiency metric', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { unitMixEfficiency: 97 }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      fireEvent.click(screen.getByRole('tab', { name: /Financial Details/i }));

      expect(screen.getByText('Unit Mix Efficiency')).toBeInTheDocument();
      expect(screen.getByText('97%')).toBeInTheDocument();
      expect(screen.getByText(/≥95% good/i)).toBeInTheDocument();
    });

    it('should display Gross Yield metric', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { grossYield: 11.2 }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      fireEvent.click(screen.getByRole('tab', { name: /Financial Details/i }));

      expect(screen.getByText('Gross Yield')).toBeInTheDocument();
      expect(screen.getByText('11.2%')).toBeInTheDocument();
      expect(screen.getByText(/10-12% target/i)).toBeInTheDocument();
    });
  });

  describe('Collapsible Advanced Metrics Section', () => {
    it('should render Advanced Metrics section as collapsed by default', () => {
      const mfAnalysis = createMFAnalysisFixture();
      render(<AnalysisResults analysis={mfAnalysis} />);

      const advancedSection = screen.getByText('Advanced Metrics');
      expect(advancedSection).toBeInTheDocument();

      // Table should not be visible initially
      expect(screen.queryByRole('table', { name: /Advanced Metrics/i })).not.toBeVisible();
    });

    it('should expand Advanced Metrics when clicked', () => {
      const mfAnalysis = createMFAnalysisFixture();
      render(<AnalysisResults analysis={mfAnalysis} />);

      const expandButton = screen.getByLabelText(/Expand Advanced Metrics/i);
      fireEvent.click(expandButton);

      expect(screen.getByRole('table', { name: /Advanced Metrics/i })).toBeVisible();
    });

    it('should collapse Advanced Metrics when clicked again', () => {
      const mfAnalysis = createMFAnalysisFixture();
      render(<AnalysisResults analysis={mfAnalysis} />);

      const expandButton = screen.getByLabelText(/Expand Advanced Metrics/i);
      fireEvent.click(expandButton); // Expand
      fireEvent.click(expandButton); // Collapse

      expect(screen.queryByRole('table', { name: /Advanced Metrics/i })).not.toBeVisible();
    });
  });

  describe('Benchmark Coloring', () => {
    it('should color Debt Yield green when >= 10%', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { debtYield: 11 }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      const debtYieldCell = screen.getByText('11%');
      expect(debtYieldCell).toHaveClass('positive-value'); // or green color class
    });

    it('should color Debt Yield red when < 10%', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { debtYield: 9 }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      const debtYieldCell = screen.getByText('9%');
      expect(debtYieldCell).toHaveClass('negative-value'); // or red color class
    });

    it('should color Unit Mix Efficiency green when >= 95%', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { unitMixEfficiency: 97 }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      const efficiencyCell = screen.getByText('97%');
      expect(efficiencyCell).toHaveClass('positive-value');
    });
  });

  describe('SFR Regression - Advanced Metrics', () => {
    it('should NOT display MF-specific metrics for SFR properties', () => {
      const sfrAnalysis = createSFRAnalysisFixture({ propertyType: 'SFR' });
      render(<AnalysisResults analysis={sfrAnalysis} />);

      fireEvent.click(screen.getByRole('tab', { name: /Financial Details/i }));

      expect(screen.queryByText('Debt Yield')).not.toBeInTheDocument();
      expect(screen.queryByText('Economic Vacancy Rate')).not.toBeInTheDocument();
      expect(screen.queryByText('Common Area Expense Ratio')).not.toBeInTheDocument();
      expect(screen.queryByText('Unit Mix Efficiency')).not.toBeInTheDocument();
    });

    it('should still display common metrics (GRM, BEO) for both property types', () => {
      const sfrAnalysis = createSFRAnalysisFixture();
      render(<AnalysisResults analysis={sfrAnalysis} />);

      fireEvent.click(screen.getByRole('tab', { name: /Financial Details/i }));

      expect(screen.getByText('Gross Rent Multiplier')).toBeInTheDocument();
      expect(screen.getByText('Break-Even Occupancy')).toBeInTheDocument();
    });
  });
});
```

**Coverage Target**: 80%+
**Estimated Tests**: 15 tests
**Execution Time**: ~6 seconds

---

### **Story 4.7: Building Type Badge (4 hours)**

**Test File**: `frontend/src/components/SFRAnalysis/__tests__/AnalysisResults.test.tsx`

#### **Test Suite 1.6: Building Type Indicator**

```typescript
describe('Story 4.7: Building Type Badge', () => {
  describe('Building Type Display', () => {
    it('should display "Garden-Style Apartments" badge for GARDEN type', () => {
      const mfAnalysis = createMFAnalysisFixture({
        propertyData: { buildingType: 'GARDEN' }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      expect(screen.getByText('Garden-Style Apartments')).toBeInTheDocument();
    });

    it('should display "Mid-Rise Building" badge for MID_RISE type', () => {
      const mfAnalysis = createMFAnalysisFixture({
        propertyData: { buildingType: 'MID_RISE' }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      expect(screen.getByText('Mid-Rise Building')).toBeInTheDocument();
    });

    it('should display "Multi-Building Complex" badge for COMPLEX type', () => {
      const mfAnalysis = createMFAnalysisFixture({
        propertyData: { buildingType: 'COMPLEX' }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      expect(screen.getByText('Multi-Building Complex')).toBeInTheDocument();
    });

    it('should display badge in Overview section', () => {
      const mfAnalysis = createMFAnalysisFixture({
        propertyData: { buildingType: 'MID_RISE' }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      // Verify badge is in Overview section (first tab)
      const overviewSection = screen.getByRole('tabpanel', { name: /Overview/i });
      expect(within(overviewSection).getByText('Mid-Rise Building')).toBeInTheDocument();
    });
  });

  describe('Cap Rate Impact Education', () => {
    it('should display cap rate adjustment text for MID_RISE', () => {
      const mfAnalysis = createMFAnalysisFixture({
        propertyData: { buildingType: 'MID_RISE' }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      expect(screen.getByText(/Institutional appeal - lower cap rate acceptable/i)).toBeInTheDocument();
    });

    it('should NOT display cap rate adjustment text for GARDEN', () => {
      const mfAnalysis = createMFAnalysisFixture({
        propertyData: { buildingType: 'GARDEN' }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      expect(screen.queryByText(/Institutional appeal/i)).not.toBeInTheDocument();
    });
  });

  describe('Badge Styling', () => {
    it('should use Chip component with correct color', () => {
      const mfAnalysis = createMFAnalysisFixture({
        propertyData: { buildingType: 'MID_RISE' }
      });

      const { container } = render(<AnalysisResults analysis={mfAnalysis} />);

      const badge = container.querySelector('[data-testid="building-type-badge"]');
      expect(badge).toHaveClass('MuiChip-root'); // MUI Chip component
    });

    it('should have info color for educational context', () => {
      const mfAnalysis = createMFAnalysisFixture({
        propertyData: { buildingType: 'GARDEN' }
      });

      const { container } = render(<AnalysisResults analysis={mfAnalysis} />);

      const badge = container.querySelector('[data-testid="building-type-badge"]');
      expect(badge).toHaveAttribute('color', 'info');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined buildingType gracefully', () => {
      const mfAnalysis = createMFAnalysisFixture({
        propertyData: { buildingType: undefined }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      // Should not display badge
      expect(screen.queryByTestId('building-type-badge')).not.toBeInTheDocument();
    });

    it('should handle null buildingType gracefully', () => {
      const mfAnalysis = createMFAnalysisFixture({
        propertyData: { buildingType: null }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      expect(screen.queryByTestId('building-type-badge')).not.toBeInTheDocument();
    });
  });

  describe('SFR Regression', () => {
    it('should NOT display building type badge for SFR properties', () => {
      const sfrAnalysis = createSFRAnalysisFixture({ propertyType: 'SFR' });
      render(<AnalysisResults analysis={sfrAnalysis} />);

      expect(screen.queryByTestId('building-type-badge')).not.toBeInTheDocument();
    });
  });
});
```

**Coverage Target**: 85%+
**Estimated Tests**: 10 tests
**Execution Time**: ~3 seconds

---

### **Story 4.9: Key Metrics Update (4 hours)**

**Test File**: `frontend/src/components/SFRAnalysis/__tests__/AnalysisResults.test.tsx`

#### **Test Suite 1.7: MF Key Metrics Grid**

```typescript
describe('Story 4.9: MF Key Metrics Update', () => {
  describe('MF-Specific Metrics in Grid', () => {
    it('should display Rent/SqFt metric in key metrics grid for MF', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { rentPerSqft: 1.20 }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      expect(screen.getByText('Rent/SqFt')).toBeInTheDocument();
      expect(screen.getByText('$1.20')).toBeInTheDocument();
    });

    it('should display Break-Even Occupancy metric for MF', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { breakEvenOccupancy: 72 }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      expect(screen.getByText('Break-Even Occupancy')).toBeInTheDocument();
      expect(screen.getByText('72%')).toBeInTheDocument();
    });

    it('should display Operating Expense Ratio in key metrics for MF', () => {
      const mfAnalysis = createMFAnalysisFixture({
        keyMetrics: { operatingExpenseRatio: 48 }
      });

      render(<AnalysisResults analysis={mfAnalysis} />);

      expect(screen.getByText('Operating Expense Ratio')).toBeInTheDocument();
      expect(screen.getByText('48%')).toBeInTheDocument();
    });

    it('should maintain existing common metrics (ROI, IRR, DSCR)', () => {
      const mfAnalysis = createMFAnalysisFixture();
      render(<AnalysisResults analysis={mfAnalysis} />);

      expect(screen.getByText('Total ROI (10 yr)')).toBeInTheDocument();
      expect(screen.getByText('10-Year IRR')).toBeInTheDocument();
      expect(screen.getByText('DSCR')).toBeInTheDocument();
    });
  });

  describe('Key Metrics Count', () => {
    it('should display 10 key metrics for MF (8 standard + 2 MF-specific)', () => {
      const mfAnalysis = createMFAnalysisFixture();
      const { container } = render(<AnalysisResults analysis={mfAnalysis} />);

      const metricCards = container.querySelectorAll('[data-component="AppleMetricCard"]');
      expect(metricCards.length).toBeGreaterThanOrEqual(10);
    });

    it('should display 8 key metrics for SFR (no MF-specific)', () => {
      const sfrAnalysis = createSFRAnalysisFixture();
      const { container } = render(<AnalysisResults analysis={sfrAnalysis} />);

      const metricCards = container.querySelectorAll('[data-component="AppleMetricCard"]');
      expect(metricCards.length).toBe(8);
    });
  });

  describe('Grid Responsiveness', () => {
    it('should use responsive grid layout (xs/sm/md/lg breakpoints)', () => {
      const mfAnalysis = createMFAnalysisFixture();
      const { container } = render(<AnalysisResults analysis={mfAnalysis} />);

      const grid = container.querySelector('[data-testid="key-metrics-grid"]');
      expect(grid).toHaveClass('MuiGrid-container');
    });

    it('should display 3 columns on desktop (md=4)', () => {
      const mfAnalysis = createMFAnalysisFixture();
      const { container } = render(<AnalysisResults analysis={mfAnalysis} />);

      const gridItems = container.querySelectorAll('.MuiGrid-item');
      expect(gridItems[0]).toHaveClass('MuiGrid-grid-md-4'); // 12 / 3 = 4
    });
  });

  describe('SFR Regression - Key Metrics', () => {
    it('should NOT display Rent/SqFt for SFR properties', () => {
      const sfrAnalysis = createSFRAnalysisFixture();
      render(<AnalysisResults analysis={sfrAnalysis} />);

      expect(screen.queryByText('Rent/SqFt')).not.toBeInTheDocument();
    });

    it('should NOT display Operating Expense Ratio for SFR', () => {
      const sfrAnalysis = createSFRAnalysisFixture();
      render(<AnalysisResults analysis={sfrAnalysis} />);

      expect(screen.queryByText('Operating Expense Ratio')).not.toBeInTheDocument();
    });

    it('should maintain SFR key metrics order unchanged', () => {
      const sfrAnalysis = createSFRAnalysisFixture();
      render(<AnalysisResults analysis={sfrAnalysis} />);

      const metricLabels = screen.getAllByTestId(/metric-label/i).map(el => el.textContent);

      // Verify original SFR order
      expect(metricLabels[0]).toBe('Total ROI (10 yr)');
      expect(metricLabels[1]).toBe('10-Year IRR');
      expect(metricLabels[2]).toBe('DSCR');
    });
  });
});
```

**Coverage Target**: 80%+
**Estimated Tests**: 12 tests
**Execution Time**: ~4 seconds

---

## 📝 **PHASE 2: INTEGRATION TESTS**

### **Test Suite 2.1: Backend-Frontend Data Flow**

**Test File**: `backend/src/tests/integration/mf-results-display-integration.test.ts`

**Purpose**: Validate complete data flow from MultiFamilyAnalyzer → Frontend display

```typescript
describe('MF Results Display Integration Tests', () => {
  describe('Complete Analysis Pipeline', () => {
    it('should generate MF analysis with all required fields for UI', async () => {
      const mfProperty: MultiFamilyData = {
        propertyType: 'MF',
        totalUnits: 12,
        buildingType: 'MID_RISE',
        units: [
          { bedrooms: 1, bathrooms: 1, currentRent: 1800, sqft: 800 },
          { bedrooms: 2, bathrooms: 2, currentRent: 2500, sqft: 1200 },
        ],
        purchasePrice: 2400000,
        downPayment: 720000,
        // ... full property data
      };

      const analysis = await analyzeProperty(mfProperty);

      // Verify all UI-required fields exist
      expect(analysis.keyMetrics.capRate).toBeDefined();
      expect(analysis.keyMetrics.dscr).toBeDefined();
      expect(analysis.keyMetrics.noi).toBeDefined();
      expect(analysis.keyMetrics.pricePerUnit).toBeDefined();
      expect(analysis.keyMetrics.noiPerUnit).toBeDefined();
      expect(analysis.keyMetrics.averageRentPerUnit).toBeDefined();
      expect(analysis.keyMetrics.rentPerSqft).toBeDefined();
      expect(analysis.keyMetrics.debtYield).toBeDefined();
      expect(analysis.keyMetrics.breakEvenOccupancy).toBeDefined();
      expect(analysis.keyMetrics.operatingExpenseRatio).toBeDefined();
      expect(analysis.keyMetrics.unitMixEfficiency).toBeDefined();
      expect(analysis.keyMetrics.economicVacancyRate).toBeDefined();
      expect(analysis.keyMetrics.commonAreaExpenseRatio).toBeDefined();
      expect(analysis.keyMetrics.grossYield).toBeDefined();
    });

    it('should calculate hero metrics correctly', async () => {
      const mfProperty = createTestMFProperty();
      const analysis = await analyzeProperty(mfProperty);

      // Hero Metric #1: Cap Rate
      expect(analysis.keyMetrics.capRate).toBeGreaterThan(0);
      expect(analysis.keyMetrics.capRate).toBeLessThan(20); // Realistic range

      // Hero Metric #2: DSCR
      expect(analysis.keyMetrics.dscr).toBeGreaterThan(0);
      expect(analysis.keyMetrics.dscr).toBeLessThan(5); // Realistic range

      // Hero Metric #3: NOI
      expect(analysis.keyMetrics.noi).toBeGreaterThan(0);

      // Hero Metric #4: Cash-on-Cash Return
      expect(analysis.keyMetrics.cashOnCashReturn).toBeDefined();
    });

    it('should populate propertyData in response for Unit Mix tab', async () => {
      const mfProperty = createTestMFProperty({
        units: [
          { bedrooms: 1, bathrooms: 1, currentRent: 1800 },
          { bedrooms: 2, bathrooms: 2, currentRent: 2500 },
        ]
      });

      const analysis = await analyzeProperty(mfProperty);

      expect(analysis.propertyData).toBeDefined();
      expect(analysis.propertyData.units).toHaveLength(2);
      expect(analysis.propertyData.buildingType).toBe('MID_RISE');
    });
  });

  describe('Field Mapping Validation', () => {
    it('should map all 85+ backend fields to correct response structure', async () => {
      const mfProperty = createTestMFProperty();
      const analysis = await analyzeProperty(mfProperty);

      // Monthly Analysis (5 fields)
      expect(analysis.monthlyAnalysis.income.gross).toBeDefined();
      expect(analysis.monthlyAnalysis.income.effective).toBeDefined();
      expect(analysis.monthlyAnalysis.expenses.operating).toBeDefined();
      expect(analysis.monthlyAnalysis.expenses.debt).toBeDefined();
      expect(analysis.monthlyAnalysis.cashFlow).toBeDefined();

      // Annual Analysis (5 fields)
      expect(analysis.annualAnalysis.income).toBeDefined();
      expect(analysis.annualAnalysis.expenses).toBeDefined();
      expect(analysis.annualAnalysis.noi).toBeDefined();
      expect(analysis.annualAnalysis.debtService).toBeDefined();
      expect(analysis.annualAnalysis.cashFlow).toBeDefined();

      // Key Metrics (28 MF-specific fields)
      const requiredMetrics = [
        'noi', 'capRate', 'cashOnCashReturn', 'irr', 'dscr',
        'operatingExpenseRatio', 'totalInvestment', 'pricePerUnit',
        'pricePerSqft', 'noiPerUnit', 'cashFlowPerUnit', 'averageRentPerUnit',
        'operatingExpensePerUnit', 'grm', 'debtYield', 'breakEvenOccupancy',
        'rentPerSqft', 'unitMixEfficiency', 'economicVacancyRate',
        'grossYield', 'commonAreaExpenseRatio', 'effectiveGrossIncome',
        'grossIncome', 'operatingExpenses'
      ];

      requiredMetrics.forEach(metric => {
        expect(analysis.keyMetrics[metric]).toBeDefined();
      });

      // Long-term Analysis (10 years)
      expect(analysis.longTermAnalysis.projections).toHaveLength(10);
      expect(analysis.longTermAnalysis.exitAnalysis).toBeDefined();
      expect(analysis.longTermAnalysis.returns).toBeDefined();

      // AI Insights
      expect(analysis.aiInsights).toBeDefined();

      // Investment Decision
      expect(analysis.investmentDecision).toBeDefined();
      expect(analysis.investmentDecision.verdict).toBeDefined();
    });

    it('should not have any null values in critical metrics', async () => {
      const mfProperty = createTestMFProperty();
      const analysis = await analyzeProperty(mfProperty);

      const criticalMetrics = [
        'noi', 'capRate', 'dscr', 'cashOnCashReturn', 'irr',
        'pricePerUnit', 'noiPerUnit', 'debtYield', 'breakEvenOccupancy'
      ];

      criticalMetrics.forEach(metric => {
        expect(analysis.keyMetrics[metric]).not.toBeNull();
        expect(analysis.keyMetrics[metric]).not.toBeNaN();
        expect(analysis.keyMetrics[metric]).not.toBeUndefined();
      });
    });
  });

  describe('Conditional Logic Validation', () => {
    it('should trigger DSCR alert when DSCR < 1.25', async () => {
      const mfProperty = createTestMFProperty({
        purchasePrice: 2000000,
        downPayment: 400000, // 20% down
        interestRate: 7.5, // High rate = high debt service
      });

      const analysis = await analyzeProperty(mfProperty);

      if (analysis.keyMetrics.dscr < 1.25) {
        expect(analysis.validationWarnings).toContainEqual(
          expect.objectContaining({
            severity: 'WARNING',
            message: expect.stringContaining('DSCR below lender requirement')
          })
        );
      }
    });

    it('should trigger small property alert when totalUnits < 10', async () => {
      const mfProperty = createTestMFProperty({ totalUnits: 8 });
      const analysis = await analyzeProperty(mfProperty);

      expect(analysis.validationWarnings).toContainEqual(
        expect.objectContaining({
          severity: 'INFO',
          message: expect.stringContaining('Small property')
        })
      );
    });

    it('should trigger high OER alert when OER > 55', async () => {
      const mfProperty = createTestMFProperty({
        propertyTaxRate: 3.5, // High taxes
        insuranceRate: 1.5, // High insurance
        maintenanceCostPerUnit: 500, // High maintenance
      });

      const analysis = await analyzeProperty(mfProperty);

      if (analysis.keyMetrics.operatingExpenseRatio > 55) {
        expect(analysis.validationWarnings).toContainEqual(
          expect.objectContaining({
            severity: 'ERROR',
            message: expect.stringContaining('Operating expenses are high')
          })
        );
      }
    });
  });

  describe('Performance Validation', () => {
    it('should complete MF analysis within 5 seconds', async () => {
      const mfProperty = createTestMFProperty();

      const start = Date.now();
      await analyzeProperty(mfProperty);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
    });

    it('should handle 32-unit property analysis efficiently', async () => {
      const units = Array(32).fill(null).map((_, i) => ({
        bedrooms: i % 2 === 0 ? 1 : 2,
        bathrooms: i % 2 === 0 ? 1 : 2,
        currentRent: i % 2 === 0 ? 1800 : 2500,
        sqft: i % 2 === 0 ? 800 : 1200
      }));

      const mfProperty = createTestMFProperty({ units });

      const start = Date.now();
      const analysis = await analyzeProperty(mfProperty);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(6000); // Allow slightly longer for 32 units
      expect(analysis.keyMetrics.pricePerUnit).toBeDefined();
    });
  });
});
```

**Coverage Target**: 90%+ (critical path)
**Estimated Tests**: 12 tests
**Execution Time**: ~60 seconds

---

## 📝 **PHASE 3: END-TO-END TESTS**

### **Test Suite 3.1: Complete MF Analysis User Journey**

**Test File**: `cypress/e2e/mf-results-display-sprint4.cy.js` OR `tests/e2e/mf-results-display-sprint4.spec.ts` (Playwright)

**Purpose**: Validate complete user journey from property input to results display

```javascript
describe('Sprint 4: MF Results Display E2E Tests', () => {
  beforeEach(() => {
    cy.login(); // Custom command for authentication
    cy.visit('/mf-analysis');
  });

  describe('Complete MF Analysis Journey', () => {
    it('should complete MF analysis and display all Sprint 4 features', () => {
      // Step 1: Enter MF property via wizard
      cy.get('[data-testid="wizard-address-input"]').type('123 Main St, Dallas, TX');
      cy.get('[data-testid="total-units-input"]').type('12');
      cy.get('[data-testid="building-type-select"]').click();
      cy.get('[data-value="MID_RISE"]').click();
      cy.get('[data-testid="wizard-next-button"]').click();

      // Step 2: Enter units (simplified - 2 unit types)
      cy.get('[data-testid="unit-type-1-bedrooms"]').type('1');
      cy.get('[data-testid="unit-type-1-bathrooms"]').type('1');
      cy.get('[data-testid="unit-type-1-count"]').type('6');
      cy.get('[data-testid="unit-type-1-rent"]').type('1800');

      cy.get('[data-testid="unit-type-2-bedrooms"]').type('2');
      cy.get('[data-testid="unit-type-2-bathrooms"]').type('2');
      cy.get('[data-testid="unit-type-2-count"]').type('6');
      cy.get('[data-testid="unit-type-2-rent"]').type('2500');
      cy.get('[data-testid="wizard-next-button"]').click();

      // Step 3: Enter financials
      cy.get('[data-testid="purchase-price-input"]').type('2400000');
      cy.get('[data-testid="down-payment-input"]').type('720000');
      cy.get('[data-testid="interest-rate-input"]').type('6.5');
      cy.get('[data-testid="wizard-next-button"]').click();

      // Step 4: Submit analysis
      cy.get('[data-testid="analyze-button"]').click();

      // Wait for analysis to complete
      cy.get('[data-testid="analysis-results"]', { timeout: 10000 }).should('be.visible');

      // STORY 4.1: Verify MF Hero Metrics
      cy.get('[data-testid="hero-metric-1"]').should('contain', 'Cap Rate');
      cy.get('[data-testid="hero-metric-2"]').should('contain', 'DSCR');
      cy.get('[data-testid="hero-metric-3"]').should('contain', 'Net Operating Income');
      cy.get('[data-testid="hero-metric-4"]').should('contain', 'Cash-on-Cash Return');

      // STORY 4.2: Verify Unit Mix tab exists
      cy.get('[role="tab"]').contains('Unit Mix').should('be.visible');

      // STORY 4.3: Navigate to Unit Mix tab and verify content
      cy.get('[role="tab"]').contains('Unit Mix').click();
      cy.get('[data-testid="unit-mix-table"]').should('be.visible');
      cy.get('[data-testid="unit-mix-table"]').should('contain', '1bed/1bath');
      cy.get('[data-testid="unit-mix-table"]').should('contain', '2bed/2bath');

      // Verify per-unit metrics cards
      cy.get('[data-testid="price-per-unit-card"]').should('be.visible');
      cy.get('[data-testid="noi-per-unit-card"]').should('be.visible');
      cy.get('[data-testid="avg-rent-per-unit-card"]').should('be.visible');
      cy.get('[data-testid="rent-per-sqft-card"]').should('be.visible');

      // STORY 4.5: Verify alerts (conditional on actual values)
      // Note: DSCR alert may or may not appear depending on actual calculation

      // STORY 4.6: Navigate to Financial Details and verify advanced metrics
      cy.get('[role="tab"]').contains('Financial Details').click();
      cy.get('[data-testid="advanced-metrics-section"]').click(); // Expand

      cy.get('[data-testid="advanced-metrics-table"]').should('contain', 'Debt Yield');
      cy.get('[data-testid="advanced-metrics-table"]').should('contain', 'Economic Vacancy Rate');
      cy.get('[data-testid="advanced-metrics-table"]').should('contain', 'Unit Mix Efficiency');

      // STORY 4.7: Verify building type badge
      cy.get('[role="tab"]').contains('Overview').click();
      cy.get('[data-testid="building-type-badge"]').should('contain', 'Mid-Rise Building');

      // STORY 4.9: Verify key metrics grid has MF-specific metrics
      cy.get('[data-testid="key-metrics-grid"]').should('contain', 'Rent/SqFt');
      cy.get('[data-testid="key-metrics-grid"]').should('contain', 'Break-Even Occupancy');
      cy.get('[data-testid="key-metrics-grid"]').should('contain', 'Operating Expense Ratio');
    });
  });

  describe('MF vs SFR Conditional Rendering', () => {
    it('should NOT show Unit Mix tab for SFR properties', () => {
      cy.visit('/sfr-analysis');

      // Complete SFR analysis (simplified)
      // ... (SFR wizard steps)

      cy.get('[data-testid="analyze-button"]').click();
      cy.get('[data-testid="analysis-results"]', { timeout: 10000 }).should('be.visible');

      // Verify Unit Mix tab does NOT exist
      cy.get('[role="tab"]').contains('Unit Mix').should('not.exist');

      // Verify hero metrics are SFR-specific
      cy.get('[data-testid="hero-metric-1"]').should('contain', 'Monthly Cash Flow');
      cy.get('[data-testid="hero-metric-1"]').should('not.contain', 'Cap Rate');
    });

    it('should NOT show building type badge for SFR', () => {
      cy.visit('/sfr-analysis');
      // ... complete SFR analysis

      cy.get('[data-testid="building-type-badge"]').should('not.exist');
    });
  });

  describe('Visual Regression Tests', () => {
    it('should match baseline screenshot for MF results page', () => {
      // Complete MF analysis (use saved test property)
      cy.loadTestProperty('mf-12-unit-midrise');

      cy.get('[data-testid="analysis-results"]').should('be.visible');

      // Take screenshot and compare to baseline
      cy.matchImageSnapshot('mf-results-overview');
    });

    it('should match baseline for Unit Mix tab', () => {
      cy.loadTestProperty('mf-12-unit-midrise');
      cy.get('[role="tab"]').contains('Unit Mix').click();

      cy.matchImageSnapshot('mf-results-unit-mix');
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle missing unit data gracefully', () => {
      // Submit MF property with empty units array
      cy.submitMFProperty({ units: [] });

      cy.get('[role="tab"]').contains('Unit Mix').click();
      cy.get('[data-testid="unit-mix-empty-state"]').should('contain', 'No unit data available');
    });

    it('should handle API error gracefully', () => {
      cy.intercept('POST', '/api/deals/analyze', { statusCode: 500 }).as('analyzeError');

      cy.get('[data-testid="analyze-button"]').click();

      cy.wait('@analyzeError');
      cy.get('[role="alert"]').should('contain', 'Analysis failed');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should display MF results correctly on mobile (375px width)', () => {
      cy.viewport(375, 667); // iPhone SE

      cy.loadTestProperty('mf-12-unit-midrise');

      // Verify hero metrics stack vertically
      cy.get('[data-testid="hero-metrics-container"]').should('have.css', 'flex-direction', 'column');

      // Verify Unit Mix table scrolls horizontally
      cy.get('[data-testid="unit-mix-table"]').parent().should('have.css', 'overflow-x', 'auto');
    });

    it('should handle tab navigation on mobile', () => {
      cy.viewport(375, 667);

      cy.loadTestProperty('mf-12-unit-midrise');

      // Tabs should be scrollable
      cy.get('[role="tablist"]').scrollTo('right');
      cy.get('[role="tab"]').contains('Unit Mix').click();

      cy.get('[data-testid="unit-mix-content"]').should('be.visible');
    });
  });

  describe('Accessibility (a11y) Tests', () => {
    it('should have no accessibility violations on MF results page', () => {
      cy.loadTestProperty('mf-12-unit-midrise');

      cy.injectAxe(); // Install axe-core
      cy.checkA11y(); // Check for violations
    });

    it('should be fully keyboard navigable', () => {
      cy.loadTestProperty('mf-12-unit-midrise');

      // Tab through all interactive elements
      cy.get('body').tab(); // First tab stop
      cy.focused().should('have.attr', 'role', 'tab');

      // Arrow keys navigate tabs
      cy.focused().type('{rightarrow}');
      cy.focused().should('contain', 'Unit Mix');

      // Enter activates tab
      cy.focused().type('{enter}');
      cy.get('[data-testid="unit-mix-content"]').should('be.visible');
    });
  });
});
```

**Coverage Target**: 100% critical user journeys
**Estimated Tests**: 15 tests
**Execution Time**: ~8 minutes (Cypress) or ~3 minutes (Playwright)

---

## 📝 **PHASE 4: REGRESSION TESTS**

### **Test Suite 4.1: SFR Functionality Unchanged**

**Test File**: `cypress/e2e/sprint4-sfr-regression.cy.js`

**Purpose**: CRITICAL - Ensure zero breaking changes to SFR functionality

```javascript
describe('Sprint 4 Regression: SFR Functionality Unchanged', () => {
  describe('SFR Analysis Complete Flow', () => {
    it('should complete SFR analysis exactly as before Sprint 4', () => {
      cy.visit('/sfr-analysis');

      // Use known working SFR property from before Sprint 4
      cy.fixture('baseline-sfr-property.json').then(property => {
        cy.fillSFRForm(property);
        cy.get('[data-testid="analyze-button"]').click();

        cy.get('[data-testid="analysis-results"]', { timeout: 10000 }).should('be.visible');

        // Verify hero metrics are unchanged
        cy.get('[data-testid="hero-metric-1"]').should('contain', 'Monthly Cash Flow');
        cy.get('[data-testid="hero-metric-2"]').should('contain', '10-Year IRR');
        cy.get('[data-testid="hero-metric-3"]').should('contain', 'Cap Rate');
        cy.get('[data-testid="hero-metric-4"]').should('contain', 'Cash-on-Cash Return');

        // Verify tab structure unchanged
        const expectedTabs = ['Overview', 'Financial Details', 'Projections', 'AI Insights'];
        expectedTabs.forEach(tabName => {
          cy.get('[role="tab"]').contains(tabName).should('be.visible');
        });

        // Verify Unit Mix tab does NOT exist
        cy.get('[role="tab"]').contains('Unit Mix').should('not.exist');
      });
    });

    it('should calculate SFR metrics identical to pre-Sprint 4', () => {
      cy.fixture('baseline-sfr-property.json').then(property => {
        cy.request('POST', '/api/deals/analyze', property).then(response => {
          // Load pre-Sprint 4 baseline metrics
          cy.fixture('baseline-sfr-analysis.json').then(baseline => {
            // Compare critical metrics (within 0.01% tolerance)
            expect(response.body.keyMetrics.capRate).to.be.closeTo(baseline.keyMetrics.capRate, 0.0001);
            expect(response.body.keyMetrics.irr).to.be.closeTo(baseline.keyMetrics.irr, 0.0001);
            expect(response.body.monthlyAnalysis.cashFlow).to.be.closeTo(baseline.monthlyAnalysis.cashFlow, 1);
          });
        });
      });
    });

    it('should maintain SFR component structure (no MF code paths triggered)', () => {
      cy.visit('/sfr-analysis');
      cy.fillSFRForm({ purchasePrice: 300000 });
      cy.get('[data-testid="analyze-button"]').click();

      cy.get('[data-testid="analysis-results"]').should('be.visible');

      // Verify no MF-specific elements are rendered
      cy.get('[data-testid="building-type-badge"]').should('not.exist');
      cy.get('[data-testid="unit-mix-table"]').should('not.exist');
      cy.get('[data-property-type="MF"]').should('not.exist');

      // Verify SFR-specific elements ARE rendered
      cy.get('[data-property-type="SFR"]').should('exist');
    });
  });

  describe('SFR Performance Unchanged', () => {
    it('should complete SFR analysis in <5 seconds (same as pre-Sprint 4)', () => {
      cy.fixture('baseline-sfr-property.json').then(property => {
        const start = Date.now();

        cy.request('POST', '/api/deals/analyze', property).then(() => {
          const duration = Date.now() - start;
          expect(duration).to.be.lessThan(5000);
        });
      });
    });

    it('should render SFR results page in <200ms (no performance degradation)', () => {
      cy.visit('/sfr-analysis');
      cy.loadTestProperty('baseline-sfr');

      cy.window().then(win => {
        win.performance.mark('results-render-start');
      });

      cy.get('[data-testid="analysis-results"]').should('be.visible');

      cy.window().then(win => {
        win.performance.mark('results-render-end');
        win.performance.measure('results-render', 'results-render-start', 'results-render-end');

        const measure = win.performance.getEntriesByName('results-render')[0];
        expect(measure.duration).to.be.lessThan(200);
      });
    });
  });

  describe('SFR Visual Regression', () => {
    it('should match pre-Sprint 4 screenshot for SFR overview', () => {
      cy.loadTestProperty('baseline-sfr');

      cy.matchImageSnapshot('sfr-overview-baseline', {
        failureThreshold: 0.01, // Allow 1% difference for anti-aliasing
        failureThresholdType: 'percent'
      });
    });

    it('should match pre-Sprint 4 screenshot for SFR financial details', () => {
      cy.loadTestProperty('baseline-sfr');
      cy.get('[role="tab"]').contains('Financial Details').click();

      cy.matchImageSnapshot('sfr-financial-details-baseline');
    });
  });

  describe('SFR Edge Cases Unchanged', () => {
    it('should handle negative cash flow SFR property identically', () => {
      cy.fixture('negative-cashflow-sfr.json').then(property => {
        cy.request('POST', '/api/deals/analyze', property).then(response => {
          expect(response.body.monthlyAnalysis.cashFlow).to.be.lessThan(0);
          expect(response.body.investmentDecision.verdict).to.equal('PASS');
        });
      });
    });

    it('should handle zero down payment SFR identically', () => {
      const property = { ...sfrBaseProperty, downPayment: 0 };

      cy.request('POST', '/api/deals/analyze', property).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body.keyMetrics).to.be.an('object');
      });
    });
  });
});
```

**Coverage Target**: 100% critical SFR paths
**Estimated Tests**: 12 tests
**Execution Time**: ~5 minutes

---

## 📝 **PHASE 5: PERFORMANCE & VISUAL TESTS**

### **Test Suite 5.1: Performance Benchmarks**

**Test File**: `backend/src/tests/integration/sprint4-performance.test.ts`

```typescript
describe('Sprint 4 Performance Tests', () => {
  describe('Component Rendering Performance', () => {
    it('should render InvestmentDecisionHero in <100ms', async () => {
      const mfAnalysis = createMFAnalysisFixture();

      const start = performance.now();
      render(<InvestmentDecisionHero analysis={mfAnalysis} />);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should render UnitMixAnalysisTab with 32 units in <200ms', async () => {
      const units = Array(32).fill({ bedrooms: 1, bathrooms: 1, currentRent: 1800 });
      const mfData = createMFPropertyDataFixture({ units });

      const start = performance.now();
      render(<UnitMixAnalysisTab propertyData={mfData} analysis={createMFAnalysisFixture()} />);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
    });

    it('should render complete AnalysisResults page in <500ms', async () => {
      const mfAnalysis = createMFAnalysisFixture();

      const start = performance.now();
      render(<AnalysisResults analysis={mfAnalysis} />);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500);
    });
  });

  describe('API Response Time', () => {
    it('should complete MF analysis API call in <5 seconds', async () => {
      const mfProperty = createTestMFProperty();

      const start = Date.now();
      const response = await fetch('/api/deals/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mfProperty)
      });
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks with multiple re-renders', async () => {
      const mfAnalysis = createMFAnalysisFixture();
      const { rerender } = render(<AnalysisResults analysis={mfAnalysis} />);

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      for (let i = 0; i < 100; i++) {
        rerender(<AnalysisResults analysis={mfAnalysis} />);
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (<10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});
```

**Coverage Target**: 100% performance-critical paths
**Estimated Tests**: 6 tests
**Execution Time**: ~30 seconds

---

## 🛠️ **Test Infrastructure & Setup**

### **Test Fixtures**

**File**: `frontend/src/test/fixtures/mfTestFixtures.ts`

```typescript
export function createMFAnalysisFixture(overrides?: Partial<MFAnalysisResult>) {
  return {
    propertyType: 'MF',
    propertyData: {
      propertyType: 'MF',
      totalUnits: 12,
      buildingType: 'MID_RISE',
      totalSqft: 12000,
      units: [
        { bedrooms: 1, bathrooms: 1, currentRent: 1800, sqft: 800 },
        { bedrooms: 2, bathrooms: 2, currentRent: 2500, sqft: 1200 },
      ],
      ...overrides?.propertyData
    },
    keyMetrics: {
      noi: 74472,
      capRate: 6.21,
      cashOnCashReturn: 8.5,
      irr: 12.5,
      dscr: 1.25,
      operatingExpenseRatio: 48,
      pricePerUnit: 200000,
      noiPerUnit: 6206,
      averageRentPerUnit: 2150,
      rentPerSqft: 1.20,
      debtYield: 11.5,
      breakEvenOccupancy: 72,
      unitMixEfficiency: 97,
      economicVacancyRate: 6.5,
      grossYield: 11.2,
      commonAreaExpenseRatio: 2.5,
      grm: 7.5,
      effectiveGrossIncome: 295200,
      grossIncome: 309600,
      operatingExpenses: 148608,
      ...overrides?.keyMetrics
    },
    monthlyAnalysis: {
      income: { gross: 25800, effective: 24600 },
      expenses: { operating: 12384, debt: 10000, total: 22384 },
      cashFlow: 2216
    },
    annualAnalysis: {
      income: 309600,
      expenses: 148608,
      noi: 161000,
      debtService: 120000,
      cashFlow: 41000
    },
    longTermAnalysis: {
      projections: Array(10).fill(null).map((_, i) => ({
        year: i + 1,
        grossIncome: 309600 * Math.pow(1.03, i),
        operatingExpenses: 148608 * Math.pow(1.03, i),
        noi: 161000 * Math.pow(1.03, i),
        debtService: 120000,
        cashFlow: 41000 * Math.pow(1.03, i),
        propertyValue: 2400000 * Math.pow(1.04, i),
        equity: 720000 + (41000 * i)
      })),
      exitAnalysis: {
        projectedSalePrice: 3500000,
        sellingCosts: 210000,
        mortgagePayoff: 1500000,
        netProceedsFromSale: 1790000,
        totalReturn: 1070000,
        returnOnInvestment: 148.6
      },
      returns: {
        irr: 12.5,
        totalCashFlow: 450000,
        totalAppreciation: 1100000,
        totalReturn: 1550000,
        totalInvestment: 720000
      },
      projectionYears: 10
    },
    investmentDecision: {
      verdict: 'BUY',
      professionalAssessment: {
        dealQuality: 76,
        executionDifficulty: 3,
        confidence: 85
      },
      primaryReason: 'Strong cap rate and DSCR',
      keyRisks: ['Market saturation'],
      walkAwayPrice: 2300000
    },
    aiInsights: {},
    validationWarnings: [],
    ...overrides
  } as MFAnalysisResult;
}

export function createSFRAnalysisFixture(overrides?: Partial<SFRAnalysisResult>) {
  return {
    propertyType: 'SFR',
    monthlyAnalysis: {
      cashFlow: 450
    },
    keyMetrics: {
      capRate: 5.5,
      irr: 10.2,
      cashOnCashReturn: 7.5,
      dscr: 1.15
    },
    ...overrides
  } as SFRAnalysisResult;
}

export function createMFPropertyDataFixture(overrides?: Partial<MultiFamilyData>) {
  return {
    propertyType: 'MF',
    totalUnits: 12,
    totalSqft: 12000,
    buildingType: 'MID_RISE',
    units: [
      { bedrooms: 1, bathrooms: 1, currentRent: 1800, sqft: 800 },
      { bedrooms: 2, bathrooms: 2, currentRent: 2500, sqft: 1200 },
    ],
    purchasePrice: 2400000,
    downPayment: 720000,
    interestRate: 6.5,
    loanTerm: 25,
    ...overrides
  } as MultiFamilyData;
}
```

---

## 📊 **Test Execution Schedule**

### **Daily Testing (During Development)**
```bash
# Run unit tests on every commit
npm test -- --watch

# Run integration tests daily
npm run test:integration

# Performance tests (before standup)
npm run test:performance
```

### **Pre-PR Testing**
```bash
# Complete unit test suite
npm test -- --coverage

# Integration tests
npm run test:integration

# Regression tests
npm run test:regression:sfr

# E2E smoke tests
npm run test:e2e:smoke
```

### **Pre-Deploy Testing**
```bash
# Full test suite
npm run test:all

# Complete E2E suite
npm run test:e2e

# Visual regression
npm run test:visual

# Performance benchmarks
npm run test:performance

# Accessibility audit
npm run test:a11y
```

---

## 📈 **Success Metrics**

### **Test Coverage Goals**
- **Unit Tests**: 80%+ overall, 90%+ for new components
- **Integration Tests**: 100% API endpoint coverage
- **E2E Tests**: 100% critical user journeys
- **Regression Tests**: 100% SFR functionality validated

### **Performance Benchmarks**
- Component rendering: <200ms
- API response: <5s
- Full page load: <3s
- Visual rendering: <1s

### **Quality Gates**
- ✅ All unit tests pass (100%)
- ✅ All integration tests pass (100%)
- ✅ All regression tests pass (100%)
- ✅ E2E smoke tests pass (100%)
- ✅ Code coverage ≥ 80%
- ✅ No accessibility violations
- ✅ Performance benchmarks met
- ✅ Visual regression diffs approved

---

## 🔧 **Test Execution Commands**

### **Run All Sprint 4 Tests**
```bash
# Backend unit tests
cd backend && npm test -- --testPathPattern=sprint4

# Frontend unit tests
cd frontend && npm test -- --testPathPattern=Sprint4

# Integration tests
cd backend && npm run test:integration -- mf-results-display

# E2E tests
npm run test:e2e -- --spec cypress/e2e/mf-results-display-sprint4.cy.js

# Regression tests
npm run test:e2e -- --spec cypress/e2e/sprint4-sfr-regression.cy.js

# Visual regression
npm run test:visual -- --updateBaseline (first run)
npm run test:visual (subsequent runs)

# Performance tests
cd backend && npm test -- sprint4-performance.test.ts

# Accessibility tests
npm run test:a11y
```

### **Watch Mode (Development)**
```bash
# Watch frontend tests
cd frontend && npm test -- --watch

# Watch specific story
cd frontend && npm test -- --watch --testPathPattern=Story4.3
```

---

## 📋 **Test Deliverables**

### **Test Documentation**
- ✅ This comprehensive test plan
- ✅ Test fixtures and mock data
- ✅ Baseline screenshots for visual regression
- ✅ Performance benchmark baseline

### **Test Reports**
- Unit test coverage report (HTML)
- Integration test results (JSON)
- E2E test execution videos (Cypress)
- Visual regression diff reports
- Accessibility audit reports (axe-core)
- Performance benchmark comparison

### **Test Infrastructure**
- Custom Cypress commands for MF analysis
- React Testing Library utilities
- Mock API responses for offline testing
- Test data factories and builders

---

## 🚦 **Production Readiness Checklist**

**Sprint 4 can be deployed to production when:**

- [ ] **100% Unit Test Pass Rate** - All 100+ unit tests passing
- [ ] **100% Integration Test Pass Rate** - All 12+ integration tests passing
- [ ] **100% Regression Test Pass Rate** - Zero SFR functionality broken
- [ ] **E2E Smoke Tests Pass** - Critical user journeys working
- [ ] **Code Coverage ≥ 80%** - Verified via coverage report
- [ ] **Performance Benchmarks Met** - All timing requirements satisfied
- [ ] **Visual Regression Approved** - All screenshot diffs reviewed
- [ ] **Accessibility Violations: 0** - WCAG 2.1 AA compliance
- [ ] **Manual QA Sign-Off** - Human testing complete
- [ ] **Stakeholder Demo Approval** - UX/Product/Business approval

---

## 🎯 **QE Sign-Off**

**QE Engineer Assessment**: This test plan provides comprehensive coverage for Sprint 4 MF Results Display UI implementation. The plan ensures:

1. ✅ **Complete Feature Coverage** - All 9 stories have dedicated test suites
2. ✅ **Zero SFR Regression** - Explicit regression tests prevent breaking changes
3. ✅ **Production Quality** - Performance, accessibility, and visual tests included
4. ✅ **Maintainability** - Clear test organization and reusable fixtures
5. ✅ **Business Impact Validation** - Tests verify competitive moat features work correctly

**Estimated Test Execution Time**:
- Unit Tests: ~50 seconds
- Integration Tests: ~60 seconds
- E2E Tests: ~8 minutes
- Regression Tests: ~5 minutes
- **Total**: ~15 minutes for complete test suite

**Test Count**:
- Unit Tests: 100+ tests
- Integration Tests: 12 tests
- E2E Tests: 15 tests
- Regression Tests: 12 tests
- **Total**: 140+ tests

**QE Recommendation**: ✅ **APPROVED FOR IMPLEMENTATION**

This test plan meets industry standards for a production-grade feature release. All critical paths are covered, regression risk is mitigated, and quality gates are clearly defined.

---

**Document Prepared By**: Claude (QE Engineer Persona)
**Last Updated**: November 15, 2025
**Status**: ✅ **READY FOR IMPLEMENTATION**
**Next Action**: Begin Sprint 4 development with parallel test implementation
