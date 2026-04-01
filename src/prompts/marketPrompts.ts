import { Market, MarketOverview } from "../types";
import { formatCommoditiesToMarkdown } from "../services/formatUtils";

export const getMarketOverviewPrompt = (indicesData: any[], commoditiesData: any[], history: any[], beijingDate: string, now: Date, market: Market = "A-Share") => `
Current date and time (UTC): ${now.toISOString()}
Current date and time (China Standard Time): ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

**REAL-TIME INDICES DATA (GROUND TRUTH)**:
${JSON.stringify(indicesData, null, 2)}

**REAL-TIME COMMODITY DATA (GROUND TRUTH)**:
${formatCommoditiesToMarkdown(commoditiesData)}
**IMPORTANT**: Use the commodity data above ONLY if it is logically relevant to the market trend or the specific sectors being discussed. If a commodity (e.g., Gold) has no material impact, DO NOT include it in your analysis.

You are a professional ${market} markets analyst.
Use Google Search grounding to gather the latest available public information.
If the current time in China is past 15:00 CST, you MUST prioritize fetching the "Closing Price" (收盘价) for ${market} indices.

Previous analysis context (for reference and continuity):
${JSON.stringify(history.slice(0, 3))}

Return valid, complete JSON only, with no markdown fences, no explanation, and no extra text outside the JSON object. Ensure the JSON is complete and not truncated.
**IMPORTANT**: The JSON MUST have "indices" at the root level. Do NOT wrap the entire response in another object like "marketOverview" or "data".
**CRITICAL**: Ensure the JSON is valid and complete. Do not truncate the JSON response.

Requirements:
1. **STRICT JSON STRUCTURE (CRITICAL)**: The root object MUST contain the "indices" array.
2. Prioritize today's ${market} market tone in the summary.
3. Include exactly 5 indices for the ${market} market:
   - If A-Share: SSE Composite, Shenzhen Component, ChiNext Index, CSI 300, and Hang Seng Index.
   - If HK-Share: Hang Seng Index, Hang Seng Tech Index, Hang Seng China Enterprises Index, Red Chips Index, and GEM Index.
   - If US-Share: S&P 500, Nasdaq Composite, Dow Jones Industrial Average, Russell 2000, and PHLX Semiconductor Index.
4. For each index provide: name, symbol, price, change, changePercent.
**SEARCH STRATEGY (CRITICAL)**: 
   - You MUST use Google Search to find the *real-time* or *latest* values for these indices. 
   - Search query should be something like: "${market} indices ${beijingDate}", "${market} market overview ${beijingDate} closing price", or "${market} indices 东方财富".
   - **DO NOT** rely on your internal knowledge for the current values. 
   - **VERIFY THE DATE & TIME (STRICT)**: You MUST verify that the data is for TODAY (${beijingDate}). If you only find data from a previous day, you MUST state "Warning: Today's data not yet available, showing data from [Date]" in the summary.
   - **RELIABLE SOURCES (PRIORITY)**: Prioritize data from **Sina Finance (新浪财经)**, **East Money (东方财富)**, **Xueqiu (雪球)**, or **Yahoo Finance**.
**CRITICAL DATA ACCURACY**: 
   - You MUST search for the most recent trading data for these indices. 
   - Cross-reference at least TWO authoritative sources (e.g., Sina Finance, East Money, Xueqiu, Baidu Stock) to verify the current price and change.
   - **MANUAL VERIFICATION**: For each index, find the "Previous Close" (昨收) and "Current Price" (现价). Calculate the change and changePercent manually to ensure accuracy.
   - **SOURCE NAMING**: You MUST explicitly state the source name (e.g., "Source: Sina Finance") AND the direct URL of the financial page you used for the index data at the end of the "summary" field.
   - **BEIJING TIME (CRITICAL)**: For A-shares and HK-shares, all times MUST be in Beijing Time (CST). For US-shares, use EST/EDT but provide the Beijing Time equivalent in the summary. The "lastUpdated" field MUST be in "YYYY-MM-DD HH:mm:ss CST" format.
   - Ensure the data is from TODAY'S trading session if the market is open. Note the source and time (with timezone, e.g. UTC+8) in the summary. Briefly mention the calculation used for indices (e.g., "Price 3000 - Prev Close 3010 = -10 (-0.33%)").
   - **DATA INTEGRITY CHECK**: If the "change" or "changePercent" is exactly 0, verify if the stock was suspended or if it's a non-trading day. Check the "Turnover" (成交额) to confirm trading activity.
4. **SECTOR ANALYSIS (NEW)**: Analyze current hot sectors (板块) in the ${market} market and provide a conclusion for each.
5. **COMMODITY ANALYSIS (NEW)**: Analyze major commodity trends (e.g., Gold, Oil, Copper). **RELEVANCE (CRITICAL)**: Only analyze commodities that are currently driving the market or have a significant impact on the specific sectors being discussed.
6. **RECOMMENDATIONS**: Provide recommended stocks or sectors in the ${market} market based on the above analysis.
7. Include exactly 5 major financial news items from the latest market day for the ${market} market.
8. Each news item must have title, source, time, url, and summary.
9. All user-facing text fields must be in Simplified Chinese.
10. **ANTI-HALLUCINATION (CRITICAL)**: If you cannot find the data, state it clearly in the summary. Do NOT invent numbers.
11. **NEWS ACCURACY & ACCESSIBILITY (CRITICAL)**: 
   - Each "url" MUST be the exact, direct, and publicly accessible link to the SPECIFIC article.
   - **STRICTLY PROHIBITED**: Do NOT use homepages (e.g., finance.sina.com.cn), search result pages, or login-required/paywalled content.
   - **VERIFICATION**: You MUST verify that the URL actually points to the specific article described by the title.
   - **SOURCES**: Prioritize authoritative and highly accessible sources: Sina Finance (新浪财经), East Money (东方财富), Xueqiu (雪球), and Phoenix Finance (凤凰财经).
   - **AVOID**: Avoid sources that frequently have broken links or paywalls like Economic Observer (经济观察网 - eeo.com.cn) unless you are certain the link is public.
   - If a specific article URL is not available, do NOT include that news item.
   - **LATEST DATA**: Use Google Search to ensure all news and data are from the most recent trading session or the current day.
   - **TEST CASE**: A valid URL should look like 'https://finance.sina.com.cn/stock/s/2024-03-22/doc-imnvvxyz1234567.shtml' not 'https://finance.sina.com.cn/'.
8. Use real source URLs, never placeholder/example URLs.
9. Continuity: Based on previous analysis, identify if trends are continuing or reversing.
10. **LANGUAGE (MANDATORY)**: All output MUST be in Simplified Chinese (简体中文).

JSON schema:
{
  "indices": [
    {
      "name": "string",
      "symbol": "string",
      "price": 0,
      "change": 0,
      "changePercent": 0,
      "previousClose": 0
    }
  ],
  "topNews": [
    {
      "title": "string",
      "source": "string",
      "time": "string",
      "url": "string",
      "summary": "string"
    }
  ],
  "sectorAnalysis": [
    {
      "name": "string",
      "trend": "string",
      "conclusion": "string"
    }
  ],
  "commodityAnalysis": [
    {
      "name": "string",
      "trend": "string",
      "expectation": "string"
    }
  ],
  "recommendations": [
    {
      "type": "Stock | Sector",
      "name": "string",
      "reason": "string"
    }
  ],
  "marketSummary": "string"
}
`.trim();

export const getDailyReportPrompt = (marketOverview: MarketOverview, commoditiesData: any[], now: Date, beijingDate: string) => `
    Current date and time: ${now.toISOString()}
    
    You are a professional China-focused markets analyst.
    Use Google Search grounding to gather the latest available public information about the market situation from the previous day or the weekend.
    
    Market Overview Data (for context):
    ${JSON.stringify(marketOverview)}

    **REAL-TIME COMMODITY DATA (GROUND TRUTH)**:
    ${formatCommoditiesToMarkdown(commoditiesData)}
    **IMPORTANT**: Use the commodity data above ONLY if it is logically relevant to the market trend or the specific sectors being discussed.
    
    Requirements:
    1. Summarize the A-share market tone (previous day or weekend news).
    2. Include key indices performance (SSE, SZSE, ChiNext, CSI 300, HSI).
    3. List 3-5 major financial news items.
    4. **NEWS ACCURACY & ACCESSIBILITY (CRITICAL)**: 
       - Each news item MUST include a direct, publicly accessible URL to the SPECIFIC article.
       - **STRICTLY PROHIBITED**: Do NOT use homepages (e.g., finance.sina.com.cn), search result pages, or login-required/paywalled content.
       - **SOURCES**: Prioritize authoritative and highly accessible sources: Sina Finance (新浪财经), East Money (东方财富), Xueqiu (雪球), and Phoenix Finance (凤凰财经).
       - **AVOID**: Avoid sources that frequently have broken links or paywalls like Economic Observer (经济观察网 - eeo.com.cn) unless you are certain the link is public.
       - **LATEST DATA**: Use Google Search to ensure all news and data are from the most recent trading session or the current day.
    5. Provide a prediction for today's market opening and trend.
    6. Recommend 3 stocks or sectors to watch today with brief reasons.
    7. Format the output in Markdown, suitable for a Feishu message.
    8. Use rich Emojis and clear section dividers (---) to make it look like a professional newsletter.
    9. Language: Simplified Chinese.
    
    Structure:
    # 📅 每日早间市场内参 (${new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(now)})
    
    ---
    
    ## 🏦 1. 大盘回顾与总结
    ...
    
    ## 📰 2. 核心财经要闻
    ...
    
    ## 🔮 3. 今日预测与操作建议
    ...
    
    ## 🌟 4. 今日关注个股/板块
    ...
    
    ---
    *本报告由 TradingAgents AI 专家组自动生成，仅供参考。*
`.trim();
