import { createAI, withRetry, parseJsonResponse, generateContentWithUsage, GEMINI_MODEL, getDeduplicatedContent } from "./geminiService";
import { getMarketOverviewPrompt, getDailyReportPrompt } from "../prompts";
import { MarketOverview, GeminiConfig, Market } from "../types";
import { getHistoryContext, saveAnalysisToHistory } from "./adminService";
import { getBeijingDate } from "./dateUtils";
import { cacheService } from "./cacheService";
import { useConfigStore } from "../stores/useConfigStore";

export async function getMarketOverview(config?: GeminiConfig, market: Market = "A-Share", forceRefresh: boolean = false): Promise<MarketOverview> {
  const isCachingEnabled = useConfigStore.getState().config?.cachingEnabled !== false;
  const cacheKey = cacheService.getKey('getMarketOverview', { market });

  if (isCachingEnabled && !forceRefresh) {
    const cached = cacheService.get<MarketOverview>(cacheKey);
    if (cached) {
      console.log(`[CACHE HIT] Returning cached market overview for ${market}`);
      return cached;
    }
  }

  const now = new Date();
  const today = getBeijingDate(now);
  
  const ai = createAI(config);
  const history = await getHistoryContext();
  const beijingDate = today;

  let indicesData = [];
  try {
    const res = await fetch(`/api/stock/indices?market=${market}`);
    if (res.ok) {
      indicesData = await res.json();
    }
  } catch (e) {
    console.warn('Indices tool failed, falling back to search:', e);
  }

  const commoditiesData = await getCommoditiesData();
  const prompt = getMarketOverviewPrompt(indicesData, commoditiesData, history, beijingDate, now, market);

  const model = config?.model || GEMINI_MODEL;
  const isProModel = model.includes('pro');

  let overview: MarketOverview;
  try {
    overview = await getDeduplicatedContent(cacheKey, () => 
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
          const parsed = parseJsonResponse<MarketOverview>(result.text);
          parsed.id = `market-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          return parsed;
        },
        3,
        2000,
        isProModel ? async () => {
          console.warn(`[AI FALLBACK] Switching to Flash model for market overview`);
          const result = await generateContentWithUsage(ai, {
            model: GEMINI_MODEL,
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });
          return parseJsonResponse<MarketOverview>(result.text);
        } : undefined
      )
    );
  } catch (error) {
    console.error(`[AI ERROR] Failed to generate market overview summary:`, error);
    // Graceful Degradation: Return raw indices/commodities with a fallback summary
    overview = {
      id: `market-degraded-${Date.now()}`,
      marketSummary: "⚠️ 智能研报服务因高负载暂时不可用，正在为您展示实时市场成交数据。",
      indices: indicesData,
      sectorAnalysis: [
        { name: "系统提示", trend: "DEGRADED", conclusion: "AI 分析模块由于接口配额限制暂时关闭，请参考下方实时行情进行自主判断。" }
      ],
      recommendations: [],
      timestamp: new Date().toISOString()
    };
  }

  if (isCachingEnabled && overview.id && !overview.id.includes('degraded')) {
    cacheService.set(cacheKey, overview, 15); // 15 minute cache for successful AI results
  }
  
  if (overview.indices && overview.indices.length > 0) {
    // Only save to history if it's not a degraded placeholder, or maybe we do save?
    // Let's not save degraded ones to avoid polluting history
    if (!overview.id.includes('degraded')) {
      await saveAnalysisToHistory('market', overview);
    }
  }

  return overview;
}

export async function getCommoditiesData(): Promise<any[]> {
  try {
    const res = await fetch('/api/stock/commodities');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Commodities fetch failed:', e);
  }
  return [];
}

export async function getDailyReport(marketOverview: MarketOverview, config?: GeminiConfig): Promise<string> {
  const isCachingEnabled = useConfigStore.getState().config?.cachingEnabled !== false;
  const cacheKey = cacheService.getKey('getDailyReport', { overviewId: marketOverview.id });

  if (isCachingEnabled) {
    const cached = cacheService.get<string>(cacheKey);
    if (cached) return cached;
  }

  const ai = createAI(config);
  const now = new Date();
  const beijingDate = getBeijingDate(now);
  const commoditiesData = await getCommoditiesData();
  const prompt = getDailyReportPrompt(marketOverview, commoditiesData, now, beijingDate);

  const report = await getDeduplicatedContent(cacheKey, () => 
    withRetry(async () => {
      const result = await generateContentWithUsage(ai, {
        model: config?.model || GEMINI_MODEL,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      return result.text;
    })
  );

  if (isCachingEnabled) {
    cacheService.set(cacheKey, report, 15); // 15 minute cache
  }

  return report;
}
