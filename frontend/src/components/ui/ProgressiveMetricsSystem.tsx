import React, { useState, useMemo } from 'react';
import type { Analysis } from '../../types/analysis';
import type { SFRPropertyData } from '../../types/property';

interface ProgressiveMetricsSystemProps {
  analysis: Analysis;
  propertyData: SFRPropertyData;
}

interface MetricItem {
  key: string;
  label: string;
  value: number | string | boolean;
  format: 'currency' | 'percentage' | 'ratio' | 'boolean' | 'number';
  benchmark?: number;
  trend?: 'positive' | 'negative' | 'neutral';
  risk?: 'low' | 'medium' | 'high';
}

interface MetricCategory {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  displayMode: 'hero-cards' | 'expandable-grid' | 'comparison-table' | 'data-table' | 'risk-grid' | 'detailed-table';
  metrics: MetricItem[];
}

const ProgressiveMetricsSystem: React.FC<ProgressiveMetricsSystemProps> = ({ analysis, propertyData }) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'comparison'>('cards');

  // Organize your 80+ metrics into logical categories based on your existing data structure
  const metricsCategories: Record<string, MetricCategory> = useMemo(() => ({
    hero: {
      title: 'Key Investment Metrics',
      description: 'Primary decision-making metrics',
      priority: 'critical',
      displayMode: 'hero-cards',
      metrics: [
        { 
          key: 'monthlyCashFlow', 
          label: 'Monthly Cash Flow', 
          value: analysis?.monthlyAnalysis?.cashFlow || 0, 
          format: 'currency', 
          benchmark: 400, 
          trend: 'positive' 
        },
        { 
          key: 'capRate', 
          label: 'Cap Rate', 
          value: analysis?.keyMetrics?.capRate || 0, 
          format: 'percentage', 
          benchmark: 6.5, 
          trend: 'positive' 
        },
        { 
          key: 'cashOnCash', 
          label: 'Cash on Cash Return', 
          value: analysis?.keyMetrics?.cashOnCashReturn || 0, 
          format: 'percentage', 
          benchmark: 10, 
          trend: 'positive' 
        },
        { 
          key: 'totalROI', 
          label: 'Total ROI', 
          value: analysis?.longTermAnalysis?.exitAnalysis?.returnOnInvestment || 0, 
          format: 'percentage', 
          benchmark: 150, 
          trend: 'positive' 
        }
      ]
    },
    
    financial: {
      title: 'Financial Performance',
      description: 'Cash flow, returns, and profitability metrics',
      priority: 'high',
      displayMode: 'expandable-grid',
      metrics: [
        { key: 'dscr', label: 'DSCR', value: analysis?.keyMetrics?.dscr || 0, format: 'ratio', benchmark: 1.2 },
        { key: 'irr', label: '10-Year IRR', value: analysis?.keyMetrics?.irr || 0, format: 'percentage', benchmark: 12 },
        { key: 'equityMultiple', label: 'Equity Multiple', value: analysis?.keyMetrics?.equityMultiple || 0, format: 'ratio', benchmark: 2.0 },
        { key: 'breakEvenOccupancy', label: 'Break-Even Occupancy', value: analysis?.keyMetrics?.breakEvenOccupancy || 0, format: 'percentage', benchmark: 85 },
        { key: 'operatingExpenseRatio', label: 'Operating Expense Ratio', value: analysis?.keyMetrics?.operatingExpenseRatio || 0, format: 'percentage', benchmark: 45 },
        { key: 'grossRentMultiplier', label: 'Gross Rent Multiplier', value: analysis?.keyMetrics?.grossRentMultiplier || 0, format: 'ratio', benchmark: 12 },
        { key: 'totalInvestment', label: 'Total Investment', value: analysis?.keyMetrics?.totalInvestment || analysis?.annualAnalysis?.totalInvestment || 0, format: 'currency', benchmark: 0 },
        { key: 'aiInvestmentScore', label: 'AI Investment Score', value: analysis?.aiInsights?.investmentScore || 0, format: 'number', benchmark: 75 }
      ]
    },
    
    valuation: {
      title: 'Property Valuation',
      description: 'Pricing and valuation analysis',
      priority: 'high',
      displayMode: 'comparison-table',
      metrics: [
        { key: 'pricePerSqFt', label: 'Price per Sq Ft', value: analysis?.keyMetrics?.pricePerSqft || 0, format: 'currency', benchmark: 150 },
        { key: 'pricePerBedroom', label: 'Price per Bedroom', value: analysis?.keyMetrics?.pricePerBedroom || 0, format: 'currency', benchmark: 75000 },
        { key: 'rentPerSqFt', label: 'Rent per Sq Ft', value: (propertyData.monthlyRent || 0) / (propertyData.squareFootage || 1), format: 'currency', benchmark: 1.2 },
        { key: 'onePercentRule', label: '1% Rule Value', value: analysis?.keyMetrics?.onePercentRuleValue || 0, format: 'percentage', benchmark: 1.0 },
        { key: 'rentToPriceRatio', label: 'Rent-to-Price Ratio', value: analysis?.keyMetrics?.rentToPriceRatio || 0, format: 'percentage', benchmark: 0.8 },
        { key: 'priceAtSale', label: 'Price/SqFt at Sale', value: (analysis?.longTermAnalysis?.exitAnalysis?.projectedSalePrice || 0) / (propertyData.squareFootage || 1), format: 'currency', benchmark: 180 }
      ]
    },
    
    market: {
      title: 'Market Intelligence',
      description: 'Market positioning and competitive analysis',
      priority: 'medium',
      displayMode: 'data-table',
      metrics: [
        { key: 'marketRentEstimate', label: 'Market Rent Estimate', value: analysis?.marketData?.rentEstimate || 0, format: 'currency' },
        { key: 'rentGrowthYoY', label: 'Rent Growth YoY', value: analysis?.marketData?.rentGrowthYoY || 0, format: 'percentage' },
        { key: 'vacancyRate', label: 'Market Vacancy Rate', value: analysis?.marketData?.vacancyRate || 0, format: 'percentage' },
        { key: 'daysOnMarket', label: 'Avg Days on Market', value: analysis?.marketData?.daysOnMarket || 0, format: 'number' },
        { key: 'priceGrowthYoY', label: 'Price Growth YoY', value: analysis?.marketData?.priceGrowthYoY || 0, format: 'percentage' }
      ]
    },
    
    risk: {
      title: 'Risk Assessment',
      description: 'Risk factors and mitigation analysis',
      priority: 'medium',
      displayMode: 'risk-grid',
      metrics: [
        { key: 'debtToIncomeRatio', label: 'Debt-to-Income Ratio', value: analysis?.keyMetrics?.debtToIncomeRatio || 0, format: 'percentage', risk: 'medium' },
        { key: 'turnoverCostImpact', label: 'Turnover Cost Impact', value: analysis?.keyMetrics?.turnoverCostImpact || 0, format: 'percentage', risk: 'low' },
        { key: 'maintenanceReserve', label: 'Maintenance Reserve %', value: (analysis?.monthlyAnalysis?.expenses?.maintenance || 0) / (propertyData?.monthlyRent || 1) * 100, format: 'percentage', risk: 'low' },
        { key: 'vacancyRisk', label: 'Vacancy Risk', value: propertyData?.longTermAssumptions?.vacancyRate || 0, format: 'percentage', risk: 'medium' }
      ]
    },
    
    detailed: {
      title: 'Detailed Analysis',
      description: 'Advanced metrics and calculations',
      priority: 'low',
      displayMode: 'detailed-table',
      metrics: [
        { key: 'returnOnImprovements', label: 'Return on Improvements', value: analysis?.keyMetrics?.returnOnImprovements || 0, format: 'percentage' },
        { key: 'fiftyRuleAnalysis', label: '50% Rule Analysis', value: analysis?.keyMetrics?.fiftyRuleAnalysis || false, format: 'boolean' },
        { key: 'projectedSalePrice', label: 'Projected Sale Price', value: analysis?.longTermAnalysis?.exitAnalysis?.projectedSalePrice || 0, format: 'currency' },
        { key: 'totalReturn', label: 'Total Return', value: analysis?.longTermAnalysis?.returns?.totalReturn || 0, format: 'currency' },
        { key: 'totalCashFlow', label: 'Total Cash Flow', value: analysis?.longTermAnalysis?.returns?.totalCashFlow || 0, format: 'currency' },
        { key: 'netProceedsFromSale', label: 'Net Proceeds from Sale', value: analysis?.longTermAnalysis?.exitAnalysis?.netProceedsFromSale || 0, format: 'currency' }
      ]
    }
  }), [analysis, propertyData]);

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const formatValue = (value: number | string | boolean, format: string): string => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (format) {
      case 'currency':
        return `$${Number(value).toLocaleString()}`;
      case 'percentage':
        return `${Number(value).toFixed(1)}%`;
      case 'ratio':
        return `${Number(value).toFixed(2)}:1`;
      case 'boolean':
        return value ? '✅ Pass' : '❌ Fail';
      default:
        return Number(value).toLocaleString();
    }
  };

  const getPerformanceIndicator = (value: number | string | boolean, benchmark?: number, format?: string): 'positive' | 'negative' | 'neutral' => {
    if (!benchmark) return 'neutral';
    const numValue = Number(value);
    const numBenchmark = Number(benchmark);
    
    if (format === 'percentage' && numValue > numBenchmark) return 'positive';
    if (format === 'currency' && numValue > numBenchmark) return 'positive';
    if (format === 'ratio' && numValue > numBenchmark) return 'positive';
    if (numValue < numBenchmark * 0.9) return 'negative';
    return 'neutral';
  };

  // Hero Cards Component
  const HeroCards: React.FC<{ metrics: MetricItem[] }> = ({ metrics }) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '24px',
      marginBottom: '32px'
    }}>
      {metrics.map((metric, index) => (
        <div key={metric.key} style={{
          background: index === 0 
            ? 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' 
            : 'white',
          color: index === 0 ? 'white' : '#1e293b',
          borderRadius: '16px',
          padding: '32px 24px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          border: index === 0 ? 'none' : '1px solid #f1f5f9',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {index === 0 && (
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)'
            }} />
          )}
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              opacity: index === 0 ? 0.9 : 0.7,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {metric.label}
            </div>
            
            {metric.trend && metric.benchmark && (
              <div style={{
                backgroundColor: index === 0 ? 'rgba(255,255,255,0.2)' : '#ecfdf5',
                color: index === 0 ? 'white' : '#10b981',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {getPerformanceIndicator(metric.value, metric.benchmark) === 'positive' ? '+' : ''}
                {Math.abs(((Number(metric.value) - metric.benchmark) / metric.benchmark * 100)).toFixed(0)}%
              </div>
            )}
          </div>

          <div style={{
            fontSize: index === 0 ? '36px' : '32px',
            fontWeight: '700',
            marginBottom: '8px',
            position: 'relative',
            zIndex: 1
          }}>
            {formatValue(metric.value, metric.format)}
          </div>

          <div style={{
            fontSize: '14px',
            opacity: index === 0 ? 0.8 : 0.6,
            position: 'relative',
            zIndex: 1
          }}>
            {metric.benchmark && `Market avg: ${formatValue(metric.benchmark, metric.format)}`}
          </div>
        </div>
      ))}
    </div>
  );

  // Expandable Metrics Grid
  const ExpandableGrid: React.FC<{ category: MetricCategory; metrics: MetricItem[] }> = ({ category, metrics }) => {
    const isExpanded = expandedCategories[category.title];
    const displayMetrics = isExpanded ? metrics : metrics.slice(0, 6);

    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #f1f5f9',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <div 
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            cursor: 'pointer',
            backgroundColor: '#f8fafc'
          }}
          onClick={() => toggleCategory(category.title)}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 4px 0'
              }}>
                {category.title}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                margin: 0
              }}>
                {category.description} • {metrics.length} metrics
              </p>
            </div>
            <div style={{
              fontSize: '20px',
              color: '#64748b',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}>
              ▼
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1px',
          backgroundColor: '#f1f5f9'
        }}>
          {displayMetrics.map((metric) => (
            <div key={metric.key} style={{
              backgroundColor: 'white',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#64748b',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {metric.label}
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '4px'
              }}>
                {formatValue(metric.value, metric.format)}
              </div>
              {metric.benchmark && (
                <div style={{
                  fontSize: '12px',
                  color: '#64748b'
                }}>
                  vs {formatValue(metric.benchmark, metric.format)}
                </div>
              )}
            </div>
          ))}
        </div>

        {!isExpanded && metrics.length > 6 && (
          <div style={{
            padding: '16px 24px',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #f1f5f9'
          }}>
            <button
              onClick={() => toggleCategory(category.title)}
              style={{
                background: 'none',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              Show {metrics.length - 6} more metrics
            </button>
          </div>
        )}
      </div>
    );
  };

  // Detailed Data Table
  const DetailedTable: React.FC<{ category: MetricCategory; metrics: MetricItem[] }> = ({ category, metrics }) => {
    const filteredMetrics = metrics.filter(metric =>
      metric.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #f1f5f9',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1e293b',
              margin: 0
            }}>
              {category.title}
            </h3>
            
            <input
              type="text"
              placeholder="Search metrics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                width: '200px'
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Metric
                </th>
                <th style={{ textAlign: 'right', padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Value
                </th>
                <th style={{ textAlign: 'right', padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Benchmark
                </th>
                <th style={{ textAlign: 'center', padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Performance
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.map((metric, index) => (
                <tr key={metric.key} style={{
                  borderBottom: index < filteredMetrics.length - 1 ? '1px solid #f1f5f9' : 'none'
                }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                      {metric.label}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                      {formatValue(metric.value, metric.format)}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      {metric.benchmark ? formatValue(metric.benchmark, metric.format) : 'N/A'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    {metric.benchmark && (
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: getPerformanceIndicator(metric.value, metric.benchmark) === 'positive' 
                          ? '#ecfdf5' : getPerformanceIndicator(metric.value, metric.benchmark) === 'negative' 
                          ? '#fef2f2' : '#f8fafc',
                        color: getPerformanceIndicator(metric.value, metric.benchmark) === 'positive' 
                          ? '#10b981' : getPerformanceIndicator(metric.value, metric.benchmark) === 'negative' 
                          ? '#ef4444' : '#64748b'
                      }}>
                        {getPerformanceIndicator(metric.value, metric.benchmark) === 'positive' ? '↗' : 
                         getPerformanceIndicator(metric.value, metric.benchmark) === 'negative' ? '↘' : '→'}
                        {Math.abs(((Number(metric.value) - metric.benchmark) / metric.benchmark * 100)).toFixed(0)}%
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* View Mode Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            Investment Analysis - {propertyData.propertyName || 'Property'}
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            margin: 0
          }}>
            {propertyData.propertyAddress?.street}, {propertyData.propertyAddress?.city}, {propertyData.propertyAddress?.state}
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '8px',
          backgroundColor: '#f1f5f9',
          padding: '4px',
          borderRadius: '8px'
        }}>
          {(['cards', 'table', 'comparison'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                backgroundColor: viewMode === mode ? 'white' : 'transparent',
                color: viewMode === mode ? '#1e293b' : '#64748b',
                boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Metrics - Always Visible */}
      <HeroCards metrics={metricsCategories.hero.metrics} />

      {/* Conditional Display Based on View Mode */}
      {viewMode === 'cards' && (
        <>
          {Object.entries(metricsCategories).filter(([key]) => key !== 'hero').map(([key, category]) => (
            <ExpandableGrid key={key} category={category} metrics={category.metrics} />
          ))}
        </>
      )}

      {viewMode === 'table' && (
        <>
          {Object.entries(metricsCategories).filter(([key]) => key !== 'hero').map(([key, category]) => (
            <DetailedTable key={key} category={category} metrics={category.metrics} />
          ))}
        </>
      )}

      {viewMode === 'comparison' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #f1f5f9',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>
            Comparison Mode
          </h3>
          <p style={{ color: '#64748b', margin: 0 }}>
            Side-by-side property comparison would appear here
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgressiveMetricsSystem;