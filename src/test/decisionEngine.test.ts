import { describe, it, expect } from 'vitest';
import { performBacktest } from '../services/backtestService';
import { calculateQualityScore, getQualityLabel } from '../services/dataQualityService';
import { StockAnalysis } from '../types';

describe('Decision Engine: Backtest Service', () => {
  const currentAnalysis = {
    stockInfo: { price: 150, lastUpdated: new Date().toISOString() }
  } as StockAnalysis;

  it('should detect a Target Hit correctly', () => {
    const previousAnalysis = {
      stockInfo: { price: 100, lastUpdated: '2026-03-01T00:00:00Z' },
      recommendation: 'Buy',
      tradingPlan: { targetPrice: '145', stopLoss: '90' }
    } as any as StockAnalysis;

    const result = performBacktest(currentAnalysis, previousAnalysis);
    expect(result?.status).toBe('Target Hit');
    expect(result?.returnSincePrev).toBe('+50.00%');
    expect(result?.accuracy).toBeGreaterThan(90);
  });

  it('should detect a Stop Loss Hit correctly', () => {
    const previousAnalysis = {
      stockInfo: { price: 200, lastUpdated: '2026-03-01T00:00:00Z' },
      recommendation: 'Buy',
      tradingPlan: { targetPrice: '250', stopLoss: '180' }
    } as any as StockAnalysis;

    const result = performBacktest(currentAnalysis, previousAnalysis); // current is 150
    expect(result?.status).toBe('Stop Loss Hit');
    expect(result?.returnSincePrev).toBe('-25.00%');
    expect(result?.accuracy).toBeLessThan(20);
  });

  it('should calculate "In Progress" correctly', () => {
    const previousAnalysis = {
      stockInfo: { price: 140, lastUpdated: '2026-03-01T00:00:00Z' },
      recommendation: 'Buy',
      tradingPlan: { targetPrice: '200', stopLoss: '120' }
    } as any as StockAnalysis;

    const result = performBacktest(currentAnalysis, previousAnalysis); // current is 150
    expect(result?.status).toBe('In Progress');
    expect(result?.accuracy).toBe(70); // Direction matches (up)
  });
});

describe('Decision Engine: Data Quality Service', () => {
  it('should grant 100 score for perfect fresh official data', () => {
    const now = new Date();
    const info = {
      price: 100,
      previousClose: 99,
      dataSource: 'Official API',
      lastUpdated: now.toISOString()
    } as any;

    const quality = calculateQualityScore(info);
    expect(quality.score).toBe(100);
    expect(quality.isStale).toBe(false);
    expect(quality.sourcePriority).toBe('Official API');
  });

  it('should penalize search-based and stale data', () => {
    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);
    const info = {
      price: 100,
      previousClose: 99,
      dataSource: 'Google Search',
      lastUpdated: tenHoursAgo.toISOString()
    } as any;

    const quality = calculateQualityScore(info);
    // 100 - 10 (Search) - 15 (Stale) = 75
    expect(quality.score).toBe(75);
    expect(quality.isStale).toBe(true);
    expect(quality.sourcePriority).toBe('Search/Scraped');
  });

  it('should identify missing critical fields', () => {
    const info = {
      price: 0, // Invalid
      previousClose: 0, // Missing
      dataSource: 'Official API',
      lastUpdated: new Date().toISOString()
    } as any;

    const quality = calculateQualityScore(info);
    expect(quality.missingFields).toContain('Price');
    expect(quality.missingFields).toContain('Previous Close');
    expect(quality.score).toBeLessThan(70);
  });

  it('should provide correct quality labels', () => {
    expect(getQualityLabel(95).label).toBe('High Precision');
    expect(getQualityLabel(75).label).toBe('Reliable');
    expect(getQualityLabel(55).label).toBe('Moderate');
    expect(getQualityLabel(30).label).toBe('Low Confidence');
  });
});
