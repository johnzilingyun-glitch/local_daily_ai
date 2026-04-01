import { Market, StockAnalysis, AgentMessage, Scenario } from "../types";
import { formatCommoditiesToMarkdown } from "../services/formatUtils";

export const getAnalyzeStockPrompt = (symbol: string, market: Market, realtimeData: any, commoditiesData: any[], history: any[], beijingDate: string, beijingShortDate: string, now: Date) => `
Current date and time (UTC): ${now.toISOString()}
Current date and time (China Standard Time): ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

**REAL-TIME DATA TOOL OUTPUT (ABSOLUTE GROUND TRUTH)**:
${realtimeData ? JSON.stringify(realtimeData, null, 2) : "No real-time data available from tool. Use Google Search grounding instead."}

**REAL-TIME COMMODITY DATA (GROUND TRUTH)**:
${formatCommoditiesToMarkdown(commoditiesData)}
**IMPORTANT**: Use the commodity data above ONLY if it is logically relevant to the stock's industry or cost structure. 
- **DYNAMIC VARIABLE SELECTION (MANDATORY)**: If the provided commodities (Gold, Oil, Copper, etc.) are NOT highly relevant to the target stock, you MUST **ignore them completely**. 
- **SEARCH-DRIVEN ANCHORS**: Instead, use Google Search to identify the 2-3 most critical macro variables or raw material prices for this specific stock (e.g., Lithium Carbonate for EV batteries, Pulp for paper, DRAM prices for semiconductors, Freight rates for shipping, etc.).
- **FAILURE TO COMPLY**: Including irrelevant variables (like Oil for a software company) will be treated as a "hallucination/logic failure".

You are a professional equity analyst.
Analyze stock "${symbol}" in the ${market} market using the latest available public information and Google Search grounding.
All output MUST be in Simplified Chinese (简体中文).

**DATA SOURCE HIERARCHY (CRITICAL)**: 
1. If the "REAL-TIME DATA TOOL OUTPUT" is provided above, you **MUST MUST MUST** use its exact values for ALL matching fields in your JSON output. This includes: "price", "change", "changePercent", "previousClose", "lastUpdated", "dailyHigh" (use dayHigh), "dailyLow" (use dayLow), "pe" (use pe), and currency.
2. **DO NOT** override ANY of the tool-provided numbers with data found in Google Search. The tool data is the absolute mathematical truth.
3. Use Google Search grounding **ONLY** for:
   - Filling in missing fundamental data not provided by the tool (e.g., PB, ROE, EPS, Revenue Growth).
   - Gathering qualitative context: company news, sector trends, management narratives, and analyst opinions.
4. If, and ONLY if, the "REAL-TIME DATA TOOL OUTPUT" says "No real-time data available", then you must use Google Search to find the latest valid price and fundamental data.

If the current time in China is past 15:00 CST (for A-shares) or 16:00 HKT (for HK-shares), the market is closed and you are summarizing the closing action.

Previous analysis context (for reference and continuity):
${JSON.stringify(history.filter((h: any) => h.stockInfo?.symbol === symbol).slice(0, 3))}

Return JSON only, with no markdown fences and no explanation outside the JSON object.
**IMPORTANT**: The JSON MUST have "stockInfo" at the root level. Do NOT wrap the entire response in another object like "analysis" or "data".

Requirements:
1. **STRICT MARKET ADHERENCE (CRITICAL)**: 
   - You MUST identify the company that matches this symbol SPECIFICALLY in the ${market} market. 
   - **NAME-TO-CODE RESOLUTION**: If "${symbol}" is a company name (e.g., "贵州茅台"), you MUST first find its official stock code (e.g., 600519.SH) before searching for price data. Ensure the suffix (.SH, .SZ, .HK) matches the ${market}.
   - **A-SHARE PINYIN SUPPORT**: For the A-Share market, the search term "${symbol}" might be a 6-digit code (e.g., 600989) OR a pinyin abbreviation (e.g., "GZMT" for 贵州茅台). You MUST resolve these abbreviations to the correct A-share stock.
   - If the symbol exists in multiple markets (e.g., "AAPL" in US vs "AAPL" as a placeholder elsewhere), you MUST prioritize the ${market} version.
   - The "market" field in the returned JSON MUST be exactly "${market}".
   - If the symbol is NOT found in the ${market} market, return an error in the "summary" field and provide empty data for other fields, but DO NOT return a stock from a different market.
2. Provide stockInfo with symbol, name, price, change, changePercent, market, currency, lastUpdated, and **previousClose** (the closing price of the previous trading day).
3. **SEARCH STRATEGY (CRITICAL)**: 
   - You MUST use Google Search to find the *real-time* or *latest* price for "${symbol}" in the ${market} market. 
   - **SPECIFIC SEARCH QUERIES**: Use queries like:
     - "${symbol} ${beijingDate} 现价 昨收 涨跌"
     - "${symbol} 东方财富 实时行情"
     - "${symbol} sina finance stock price today"
   - **DO NOT** rely on your internal knowledge for the current price. 
   - **VERIFY THE DATE & TIME (STRICT)**: You MUST verify that the data is for TODAY (${beijingDate}). 
   - **SNIPPET VERIFICATION**: Look for "${beijingShortDate}" or "今日" in the search result snippets. If you only find a previous date or "昨日", the data is STALE and you MUST keep searching or state it's unavailable.
   - **RELIABLE SOURCES (PRIORITY)**: Prioritize data from **Sina Finance (新浪财经)**, **East Money (东方财富)**, or **Xueqiu (雪球)**. These are the most authoritative for A-shares.
4. **FUNDAMENTAL DATA (NEW)**: Provide specific fundamental data (e.g., PE, PB, ROE, EPS, Revenue Growth).
5. **VALUATION LEVEL (NEW)**: Provide current "water level" (水位) - valuation percentile compared to historical data.
6. **DEEP FUNDAMENTAL ANALYSIS (CRITICAL)**: 
   - **INDUSTRY-SPECIFIC LOGIC (CRITICAL)**: Avoid boilerplate analysis. You MUST identify the 3 most critical value drivers for this SPECIFIC stock (e.g., for Mindray: R&D efficiency, healthcare policy, overseas expansion; for a tech stock: compute power costs, user growth). **Use Google Search to find these specific drivers.**
   - **FULL-DIMENSIONAL PENETRATION (NEW)**: Do not just look at financial statements. Penetrate to the business level: analyze management quality, supply chain control, customer stickiness, and technological moats.
   - **FORWARD-LOOKING JUDGMENT (NEW)**: Based on your research, provide a high-conviction prediction for the next 2-4 quarters. Identify potential inflection points or trend continuations. **PREVENT OVERCONFIDENCE (CRITICAL)**: If key evidence for a forward-looking judgment is missing, you MUST explicitly label it as "Logical Gap due to Missing Information" (信息缺失导致的逻辑断层) instead of forcing a prediction.
   - **SEARCH NOISE FILTERING (MANDATORY)**: When performing penetration research, prioritize official announcements, authoritative media, deep research reports, and industry data. **Be extremely cautious** and filter out unverified forum rumors, marketing content, or social media noise.
   - **TABLE 1: REAL-TIME CORE INDICATORS & DEVIATION (MANDATORY)**: Must include columns: 指标 (2026E), 实时数值, 市场共识预期, 偏离度 (%), 备注. Include EPS, PE (Forward), ROE, Dividend Yield. **DATA CONSISTENCY (CRITICAL)**: Prioritize the latest real-time data from search and explicitly label the data date. **OUTLIER HANDLING**: If consensus data is missing (e.g., for niche small-caps), you MUST state "Estimated based on historical averages" or "Missing Information" instead of making up data.
   - **TABLE 2: 行业核心变量与宏观锚点 (DYNAMIC)**: Must include columns: 关键变量/原材料（需标注单位，如：美元/吨）, 当前价格/数值, 逻辑权重（需标注哪个是“第一驱动力”）, 近 30 日涨跌幅, 成本/收入传导逻辑。
   - **变量选择与容错 (CRITICAL)**: 严禁死板地引用无关大宗商品。你必须基于 Google Search 查询到的、与该股票相关度最高的行业核心变量填充此表。**异常值容错**：若搜索不到特定行业的实时价格（如某些稀有化学品），允许使用“行业替代指标”或“近一个月的趋势描述”，但严禁编造具体数值。
   - **单位标准化 (MANDATORY)**: 强制要求在表格中注明单位（如：美元/吨、点位、人民币/片），防止跨市场分析时产生数值混淆。
   - **EXPECTATION GAP IDENTIFICATION**: Identify market blind spots and Alpha sources.
   - **TARGET PRICE & SENTIMENT**: Provide a 6-month target range (with confidence interval) and a sentiment score (0-100). **CONFIDENCE INTERVAL LOGIC (NEW)**: Adjust the interval width based on industry volatility. High-volatility sectors (e.g., crypto, concept stocks) should have wider intervals; low-volatility sectors (e.g., utilities) should have narrower intervals.
   - **EVIDENCE LEVEL (MANDATORY)**: When identifying these critical value drivers, you MUST label the source and its "Evidence Level" (证据级别) (e.g., "Mentioned in financial report", "Mainstream research consensus", "Third-party real-time monitoring").
   - **REVERSE VERIFICATION (CRITICAL)**: After identifying the core indicators, you MUST ask and answer: "If this indicator changes by 10% in an unfavorable direction, how much impact will the company's net profit suffer?" Provide a specific quantitative estimate.
   - **RELEVANCE CHECK (STRICT)**: **DO NOT** include irrelevant macro variables (e.g., Gold/Oil prices for a medical device company) in your analysis or sensitivity tables unless there is a direct, logical causal link. If you include a macro variable, you MUST explain the specific transmission mechanism (e.g., "Oil price affects plastic casing costs for medical devices"). If no direct link exists, use industry-specific variables (e.g., "Medical Insurance Reimbursement Rates") instead.
7. **HISTORICAL CONTEXT (NEW)**: Include historical price ranges and major historical events affecting the stock.
8. **CRITICAL DATA ACCURACY (HIGH PRIORITY)**: 
   - You MUST search for the most recent trading data for this stock. 
   - **CROSS-REFERENCE (MANDATORY)**: You MUST cross-reference at least TWO authoritative financial sources to verify the current price, previous close, change, and changePercent.
   - **MARKET STATUS**: Determine if the market is currently open or closed. If open, provide real-time data. If closed, provide the latest closing data.
   - **CALCULATION CHECK (CRITICAL)**: The "change" MUST be (Current Price - Previous Close). The "changePercent" MUST be (Change / Previous Close * 100). 
   - **PREVENT SWAPPING (CRITICAL)**: Double check if you are swapping "Current Price" and "Previous Close". "Previous Close" is the price from the END of the PREVIOUS trading day. "Current Price" is the price as of today.
   - **SOURCE NAMING**: You MUST explicitly state the source name (e.g., "Source: Sina Finance") AND the direct URL of the financial page you used for the price data at the end of the "summary" field.
   - **BEIJING TIME (CRITICAL)**: For A-shares and HK-shares, all times MUST be in Beijing Time (CST). The "lastUpdated" field MUST be in "YYYY-MM-DD HH:mm:ss CST" format.
9. Provide summary, technicalAnalysis, fundamentalAnalysis, sentiment, score, recommendation, keyRisks, keyOpportunities, and a detailed tradingPlan.
10. **MARGIN OF SAFETY (NEW)**: Incorporate "Margin of Safety" (安全边际) theory into the fundamental analysis and trading plan.
11. **EVIDENCE-BASED REASONING (CRITICAL)**: For every claim made in the analysis, you MUST provide specific evidence (data points, news snippets, or financial ratios). Avoid vague storytelling (叙事过强).
12. **TRADING PLAN LOGIC (NEW)**: 
    - If the recommendation is NOT "Buy" or "Strong Buy", the tradingPlan should state "Not Recommended" (不推荐) for entryPrice, targetPrice, and stopLoss. 
    - Do NOT provide specific price levels if not recommended.
    - **STRATEGY RISKS (NEW)**: Clearly state the specific risks associated with the recommended entry/target/stop-loss levels.
13. Include 3 to 5 recent and relevant news items for this exact company.

JSON schema:
{
  "stockInfo": {
    "symbol": "string",
    "name": "string",
    "price": 0,
    "change": 0,
    "changePercent": 0,
    "market": "${market}",
    "currency": "string",
    "lastUpdated": "string",
    "previousClose": 0,
    "dailyHigh": 0,
    "dailyLow": 0
  },
  "fundamentals": {
    "pe": "string",
    "pb": "string",
    "roe": "string",
    "eps": "string",
    "revenueGrowth": "string",
    "valuationPercentile": "string",
    "netProfitGrowth": "string",
    "debtToEquity": "string",
    "grossMargin": "string",
    "netMargin": "string",
    "dividendYield": "string"
  },
  "fundamentalTable": [
    {
      "indicator": "string",
      "value": "string",
      "consensus": "string",
      "deviation": "string",
      "remark": "string"
    }
  ],
  "industryAnchors": [
    {
      "variable": "string",
      "currentValue": "string",
      "weight": "string",
      "monthlyChange": "string",
      "logic": "string"
    }
  ],
  "historicalData": {
    "yearHigh": "string",
    "yearLow": "string",
    "majorEvents": ["string"]
  },
  "valuationAnalysis": {
    "comparison": "string",
    "marginOfSafetySummary": "string"
  },
  "news": [
    {
      "title": "string",
      "source": "string",
      "time": "string",
      "url": "string",
      "summary": "string"
    }
  ],
  "summary": "string",
  "technicalAnalysis": "string",
  "fundamentalAnalysis": "string",
  "sentiment": "Bullish | Bearish | Neutral",
  "score": 0,
  "recommendation": "Strong Buy | Buy | Hold | Sell | Strong Sell",
  "keyRisks": ["string"],
  "keyOpportunities": ["string"],
  "tradingPlan": {
    "entryPrice": "string",
    "targetPrice": "string",
    "stopLoss": "string",
    "strategy": "string",
    "strategyRisks": "string"
  }
}
`.trim();

export const getStockReportPrompt = (analysis: StockAnalysis) => `
    基于以下个股分析数据，生成一份简洁、专业的个股研究简报。
    报告应包含：
    1. 股票基本信息（名称、代码、当前价格、涨跌幅）。
    2. 核心观点总结（1-2句）。
    3. 技术面与基本面核心要点。
    4. AI 投资建议与风险提示。
    
    分析数据：
    ${JSON.stringify(analysis)}
    
    请使用 Markdown 格式，语气专业且客观。
`.trim();

export const getDiscussionReportPrompt = (analysis: StockAnalysis, discussion: AgentMessage[], commoditiesData: any[], scenarios?: Scenario[], backtestResult?: any) => `
    基于以下个股分析数据、AI 专家组研讨记录以及场景概率分布，生成一份完整的个股深度研究报告。
    
    报告应包含：
    1. 🚀 **股票基本信息**：名称、代码、当前价格、涨跌幅。
    2. 📊 **核心财务指标与基本面透视**：
       - PE, PB, ROE, EPS 等关键数据及当前估值水位。
       - **核心指标与预期偏差表** (2026E)。
       - **行业核心变量与宏观锚点表**。
    3. 🧠 **AI 专家组研讨摘要**：
       - 技术面、基本面、情绪面、风险管理、反向策略各方的核心观点。
       - 研讨中的主要分歧或共识点。
    4. 🔮 **场景概率分布 (Scenarios)**：
       ${scenarios ? scenarios.map(s => `- **${s.case} Case** (${s.probability}%): 目标价 ${s.targetPrice}, 逻辑: ${s.logic}`).join('\n') : '未提供'}
    5. 🎯 **首席策略师最终结论**：明确的操作建议。
    6. 🛡️ **安全边际评估**：基于安全边际理论的深度评价。
    7. 📈 **交易计划**：建议买入价、目标价、止损价。
    8. ⚠️ **核心机会与风险提示**。
    ${backtestResult ? `9. ⏪ **历史回测复盘**: 上次建议 ${backtestResult.previousRecommendation}, 实际收益 ${backtestResult.actualReturn}` : ''}
    
    10. **完整研讨记录**：在报告最后，以引用块的形式完整保留每一位分析师的发言。
    
    分析数据：
    ${JSON.stringify(analysis)}

    **REAL-TIME COMMODITY DATA (GROUND TRUTH)**:
    ${JSON.stringify(commoditiesData, null, 2)}
    
    研讨记录：
    ${discussion.map(m => `[${m.role}]: ${m.content}`).join('\n\n')}
    
    请使用 Markdown 格式，语气专业、客观且深度。
    使用丰富的 Emoji 增加可读性。
    回答语言：简体中文。
`.trim();
