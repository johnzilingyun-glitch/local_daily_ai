import { GoogleGenAI } from "@google/genai";
import { createAI, withRetry, parseJsonResponse, generateContentWithUsage, GEMINI_MODEL, getDeduplicatedContent, isQuotaError } from "./geminiService";
import { getAnalyzeStockPrompt, getDiscussionPrompt, getStockReportPrompt, getDiscussionReportPrompt, getChatMessagePrompt } from "../prompts";
import { Market, StockAnalysis, AgentMessage, Scenario, AgentDiscussion, GeminiConfig } from "../types";
import { getHistoryContext, saveAnalysisToHistory } from "./adminService";
import { getBeijingDate } from "./dateUtils";
import { getCommoditiesData } from "./marketService";
import { calculateQualityScore } from "./dataQualityService";
import { cacheService } from "./cacheService";
import { useConfigStore } from "../stores/useConfigStore";

export async function analyzeStock(symbol: string, market: Market, config?: GeminiConfig): Promise<StockAnalysis> {
  const isCachingEnabled = useConfigStore.getState().config?.cachingEnabled !== false;
  const cacheKey = cacheService.getKey('analyzeStock', { symbol, market });

  if (isCachingEnabled) {
    const cached = cacheService.get<StockAnalysis>(cacheKey);
    if (cached) {
      console.log(`[CACHE HIT] Returning cached analysis for ${symbol}`);
      return cached;
    }
  }

  const ai = createAI(config);
  const history = await getHistoryContext();
  const now = new Date();
  const beijingDate = getBeijingDate(now);
  const beijingShortDate = beijingDate.split(/[-/]/).slice(1).join('/');

  let realtimeData = null;
  const res = await fetch(`/api/stock/realtime?symbol=${encodeURIComponent(symbol)}&market=${market}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    if (res.status === 404) {
      throw new Error(`未找到股票 "${symbol}"。请确认代码是否正确（例如 A 股建议输入 6 位数字代码，如 600519.SS）。`);
    }
    const errorMsg = typeof errData.error === 'object' 
      ? (errData.error.message || JSON.stringify(errData.error)) 
      : errData.error;
    throw new Error(errorMsg || `无法获取股票信息，请检查代码或拼写。`);
  }
  realtimeData = await res.json();
  const symMatch = (realtimeData.symbol || '').toUpperCase();
  if (market === 'A-Share' && !(symMatch.endsWith('.SS') || symMatch.endsWith('.SZ') || symMatch.endsWith('.BJ'))) {
    throw new Error(`请核实查询代码及范围：无法在 A 股 中找到 "${symbol}"。你可能输入了非A股代码。`);
  }
  if (market === 'HK-Share' && !symMatch.endsWith('.HK')) {
    throw new Error(`请核实查询代码及范围：无法在 港股 中找到 "${symbol}"。你可能输入了非港股代码。`);
  }

  const commoditiesData = await getCommoditiesData();
  const prompt = getAnalyzeStockPrompt(symbol, market, realtimeData, commoditiesData, history, beijingDate, beijingShortDate, now);

  const model = config?.model || GEMINI_MODEL;
  const isProModel = model.includes('pro');

  const analysis = await getDeduplicatedContent(cacheKey, () => 
    withRetry(
      async () => {
        const result = await generateContentWithUsage(ai, {
          model,
          contents: prompt,
          config: { 
            responseMimeType: "application/json",
            tools: [{ googleSearch: {} }]
          }
        });
        const parsed = parseJsonResponse<StockAnalysis>(result.text);
        
        // Calculate and associate data quality metadata
        parsed.dataQuality = calculateQualityScore(parsed.stockInfo);
        parsed.stockInfo.dataQuality = parsed.dataQuality;
        parsed.id = `stock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        parsed.timestamp = new Date().toISOString();
        
        return parsed;
      },
      3,
      2000,
      isProModel ? async () => {
        console.warn(`[AI FALLBACK] Switching to Flash model for ${symbol}`);
        const result = await generateContentWithUsage(ai, {
          model: GEMINI_MODEL, // Fallback to Flash
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        return parseJsonResponse<StockAnalysis>(result.text);
      } : undefined
    )
  ).catch(err => {
    if (isQuotaError(err)) {
      console.warn(`[AI QUOTA] Returning partial data-only analysis for ${symbol}`);
      // Return a partial object that the UI can still use to show charts/info
      return {
        id: `partial-${Date.now()}`,
        timestamp: new Date().toISOString(),
        stockInfo: {
          ...realtimeData,
          name: realtimeData.name || symbol,
          symbol: realtimeData.symbol || symbol,
          price: realtimeData.price || 0,
          change: realtimeData.change || 0,
          changePercent: realtimeData.changePercent || 0,
          summary: "⚠️ AI 研报配额已耗尽。当前仅为您展示实时成交数据与财务指标，深度研判功能暂时不可用。",
          status: 'degraded'
        },
        marketOverview: "配额受限，仅展示基础成交数据。",
        keyMetrics: [],
        riskFactors: [],
        tradingPlan: { entry: "N/A", target: "N/A", stopLoss: "N/A", timeframe: "N/A" },
        isDegraded: true
      } as any;
    }
    throw err;
  });

  if (isCachingEnabled) {
    cacheService.set(cacheKey, analysis, 60); // 1 hour cache
  }
  
  return analysis;
}

export async function sendChatMessage(userMessage: string, analysis: StockAnalysis, config?: GeminiConfig): Promise<string> {
  const ai = createAI(config);
  const commoditiesData = await getCommoditiesData();
  const prompt = getChatMessagePrompt(userMessage, analysis, commoditiesData);

  const response = await withRetry(async () => {
    const result = await generateContentWithUsage(ai, {
      model: config?.model || GEMINI_MODEL,
      contents: prompt
    });
    return result.text;
  });

  return response;
}

export async function getStockReport(analysis: StockAnalysis, config?: GeminiConfig): Promise<string> {
  const isCachingEnabled = useConfigStore.getState().config?.cachingEnabled !== false;
  const cacheKey = cacheService.getKey('getStockReport', { analysisId: analysis.id });

  if (isCachingEnabled) {
    const cached = cacheService.get<string>(cacheKey);
    if (cached) return cached;
  }

  const ai = createAI(config);
  const prompt = getStockReportPrompt(analysis);

  const report = await getDeduplicatedContent(cacheKey, () => 
    withRetry(async () => {
      const result = await generateContentWithUsage(ai, {
        model: config?.model || GEMINI_MODEL,
        contents: prompt
      });
      return result.text;
    })
  );

  if (isCachingEnabled) {
    cacheService.set(cacheKey, report, 120); // 2 hour cache for reports
  }

  return report;
}

export async function getChatReport(stockName: string, chatHistory: { role: string; content: string }[], config?: GeminiConfig): Promise<string> {
  const ai = createAI(config);
  const prompt = `
    Based on the following chat history about ${stockName}, generate a concise summary report.
    
    Chat History:
    ${JSON.stringify(chatHistory)}
    
    Format the output in Markdown.
  `.trim();

  const response = await withRetry(async () => {
    const result = await generateContentWithUsage(ai, {
      model: config?.model || GEMINI_MODEL,
      contents: prompt
    });
    return result.text;
  });

  return response;
}

export async function getDiscussionReport(
  analysis: StockAnalysis, 
  discussion: AgentMessage[], 
  scenarios?: Scenario[], 
  backtestResult?: any,
  config?: GeminiConfig
): Promise<string> {
  const isCachingEnabled = useConfigStore.getState().config?.cachingEnabled !== false;
  const cacheKey = cacheService.getKey('getDiscussionReport', { analysisId: analysis.id, msgCount: discussion.length });

  if (isCachingEnabled) {
    const cached = cacheService.get<string>(cacheKey);
    if (cached) return cached;
  }

  const ai = createAI(config);
  const commoditiesData = await getCommoditiesData();
  const prompt = getDiscussionReportPrompt(analysis, discussion, commoditiesData, scenarios, backtestResult);

  const report = await getDeduplicatedContent(cacheKey, () => 
    withRetry(async () => {
      const result = await generateContentWithUsage(ai, {
        model: config?.model || GEMINI_MODEL,
        contents: prompt
      });
      return result.text;
    })
  );

  if (isCachingEnabled) {
    cacheService.set(cacheKey, report, 1440); // 24 hour cache for full reports
  }

  return report;
}
