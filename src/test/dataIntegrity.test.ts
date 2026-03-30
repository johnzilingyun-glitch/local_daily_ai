import { describe, it, expect } from 'vitest';
import { AgentDiscussion, StockAnalysis } from '../types';
import { parseJsonResponse } from '../services/geminiService';

describe('Data Integrity and Verification Tests', () => {
  it('should correctly parse AgentDiscussion with dataVerification and references', () => {
    const mockResponse = JSON.stringify({
      messages: [
        {
          role: "Deep Research Specialist",
          content: "### 深度调研\n| 指标 | 数值 |\n| --- | --- |\n| PE | 15.2 |",
          timestamp: "2026-03-30T08:00:00Z",
          type: "research",
          references: [
            { title: "东方财富网", url: "https://quote.eastmoney.com/sh600519.html" }
          ]
        },
        {
          role: "Chief Strategist",
          content: "综合结论：买入。",
          timestamp: "2026-03-30T08:05:00Z",
          type: "discussion"
        }
      ],
      dataVerification: [
        {
          source: "金融机构 API",
          isVerified: true,
          confidence: 98,
          lastChecked: "2026-03-30T08:00:00Z"
        },
        {
          source: "Google Search",
          isVerified: false,
          discrepancy: "价格偏差 0.5%",
          confidence: 90,
          lastChecked: "2026-03-30T08:00:00Z"
        }
      ],
      finalConclusion: "买入建议",
      tradingPlan: {
        entryPrice: "1800",
        targetPrice: "2000",
        stopLoss: "1700",
        strategy: "分批建仓",
        strategyRisks: "市场波动"
      }
    });

    const parsed = parseJsonResponse<AgentDiscussion>(mockResponse);

    expect(parsed.messages).toHaveLength(2);
    expect(parsed.messages[0].role).toBe("Deep Research Specialist");
    expect(parsed.messages[0].references).toHaveLength(1);
    expect(parsed.messages[0].references![0].title).toBe("东方财富网");
    
    expect(parsed.dataVerification).toHaveLength(2);
    expect(parsed.dataVerification![0].isVerified).toBe(true);
    expect(parsed.dataVerification![1].isVerified).toBe(false);
    expect(parsed.dataVerification![1].discrepancy).toBe("价格偏差 0.5%");
  });

  it('should correctly parse StockAnalysis with dataVerification', () => {
    const mockResponse = JSON.stringify({
      stockInfo: {
        symbol: "600519.SS",
        name: "贵州茅台",
        price: 1800,
        change: 10,
        changePercent: 0.56,
        market: "A-Share",
        currency: "CNY",
        lastUpdated: "2026-03-30 15:00:00 CST",
        previousClose: 1790
      },
      dataVerification: [
        {
          source: "Sina Finance",
          isVerified: true,
          confidence: 100,
          lastChecked: "2026-03-30T08:00:00Z"
        }
      ],
      summary: "分析总结",
      technicalAnalysis: "技术分析",
      fundamentalAnalysis: "基本面分析",
      sentiment: "Bullish",
      score: 85,
      recommendation: "Buy",
      keyRisks: ["风险1"],
      keyOpportunities: ["机会1"]
    });

    const parsed = parseJsonResponse<StockAnalysis>(mockResponse);

    expect(parsed.stockInfo.symbol).toBe("600519.SS");
    expect(parsed.dataVerification).toBeDefined();
    expect(parsed.dataVerification).toHaveLength(1);
    expect(parsed.dataVerification![0].source).toBe("Sina Finance");
  });
});
