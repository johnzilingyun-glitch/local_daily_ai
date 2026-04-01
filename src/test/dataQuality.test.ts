import { describe, it, expect } from 'vitest';
import { calculateQualityScore, validateAnalysisSemantics } from '../services/dataQualityService';
import { StockInfo } from '../types';

describe('Data Quality Service', () => {
  const mockStock: StockInfo = {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 150,
    change: 1.5,
    changePercent: 1.0,
    previousClose: 148.5,
    market: 'US-Share',
    currency: 'USD',
    lastUpdated: new Date().toISOString(),
    sourceWeight: 1.0,
    dataSource: 'Yahoo Finance'
  };

  describe('calculateQualityScore', () => {
    it('should return a high score for perfect data', () => {
      const quality = calculateQualityScore(mockStock);
      expect(quality.score).toBeGreaterThanOrEqual(90);
      expect(quality.missingFields).toHaveLength(0);
    });

    it('should penalize for missing price', () => {
      const poorStock = { ...mockStock, price: 0 };
      const quality = calculateQualityScore(poorStock);
      expect(quality.score).toBeLessThanOrEqual(70);
      expect(quality.missingFields).toContain('Price');
    });

    it('should detect semantic issues like price outside day range', () => {
      const inconsistentStock = { 
        ...mockStock, 
        price: 200, 
        dayHigh: 160, 
        dayLow: 140 
      };
      const quality = calculateQualityScore(inconsistentStock);
      expect(quality.semanticIssues).toContain('Price significantly outside daily range');
      expect(quality.score).toBeLessThanOrEqual(90);
    });
  });

  describe('validateAnalysisSemantics', () => {
    it('should flag EV probabilities that do not sum to 100%', () => {
      const badEV = {
        expectedValueOutcome: {
          calculationLogic: 'Bull: 30%, Base: 40%, Bear: 10%' // Sum = 80%
        }
      };
      const issues = validateAnalysisSemantics(badEV);
      expect(issues).toContain('EV Probabilities sum to 80%, expected ~100%');
    });

    it('should flag business model profit formulas without cost component', () => {
      const badModel = {
        businessModel: {
          formula: '利润 = 销量 * 单价' // Missing cost deduction
        }
      };
      const issues = validateAnalysisSemantics(badModel);
      expect(issues).toContain('Profit formula missing cost deduction component');
    });

    it('should return no issues for valid analysis', () => {
      const goodAnalysis = {
        expectedValueOutcome: {
          calculationLogic: 'Bull: 20%, Base: 60%, Bear: 20%'
        },
        businessModel: {
          formula: '利润 = 销量 * (单价 - 成本)'
        }
      };
      const issues = validateAnalysisSemantics(goodAnalysis);
      expect(issues).toHaveLength(0);
    });
  });
});
