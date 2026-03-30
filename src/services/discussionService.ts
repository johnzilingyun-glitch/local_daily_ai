import { GoogleGenAI } from "@google/genai";
import { createAI, withRetry, parseJsonResponse, generateContentWithUsage, GEMINI_MODEL } from "./geminiService";
import { StockAnalysis, AgentMessage, Scenario, AgentDiscussion, GeminiConfig } from "../types";
import { getCommoditiesData } from "./marketService";

function formatCommoditiesToMarkdown(data: any[]): string {
  if (!data || data.length === 0) return "No real-time commodity data available.";
  
  let table = "| 商品种类 | 实时价格 | 24h 涨跌幅 | 单位 | 最后更新 |\n";
  table += "| --- | --- | --- | --- | --- |\n";
  
  data.forEach(item => {
    const change = item.changePercent > 0 ? `+${item.changePercent}%` : `${item.changePercent}%`;
    table += `| ${item.name} (${item.symbol}) | $${item.price} | ${change} | ${item.unit} | ${item.lastUpdated} |\n`;
  });
  
  return table;
}

export async function startAgentDiscussion(
  analysis: StockAnalysis, 
  config?: GeminiConfig, 
  history?: AgentMessage[]
): Promise<AgentDiscussion> {
  const ai = createAI(config);
  const historyContext = history ? `\n\n**PREVIOUS DISCUSSION HISTORY**:\n${JSON.stringify(history)}` : "";
  const commoditiesData = await getCommoditiesData();
  const prompt = `
    你是一支由8位顶级金融分析精英组成的专家团队，正在召开高规格联席研讨会议，对以下股票进行机构级深度研讨。
    这不是一份普通分析报告，而是一场真实的、多轮的、有激烈辩论和数据交锋的专业级研讨会议。

    **REAL-TIME COMMODITY DATA (GROUND TRUTH - 2026-03-30)**:
    ${formatCommoditiesToMarkdown(commoditiesData)}
    **STRICT RELEVANCE CONSTRAINT (CRITICAL)**: Use the commodity data above ONLY if it is a DIRECT and MATERIAL cost or revenue driver for the stock's industry. 
    - **DYNAMIC VARIABLE SELECTION (MANDATORY)**: If the provided commodities (Gold, Oil, Copper, etc.) are NOT highly relevant to the target stock, you MUST **ignore them completely**. 
    - **SEARCH-DRIVEN ANCHORS**: Instead, use Google Search to identify the 2-3 most critical macro variables or raw material prices for this specific stock (e.g., Lithium Carbonate for EV batteries, Pulp for paper, DRAM prices for semiconductors, Freight rates for shipping, etc.).
    - **FAILURE TO COMPLY**: Including irrelevant variables (like Oil for a software company) will be treated as a "hallucination/logic failure".
    - Prioritize industry-specific variables: Policy changes, R&D progress, supply chain bottlenecks, exchange rates, or sector-specific raw materials.

    **团队成员（8位，按发言顺序）**：
    1. **深度研究专家 (Deep Research Specialist)**：第一个发言，负责全维度数据穿透调研。
       - **全维度数据穿透调研 (CRITICAL)**：严禁只看表面财报。你必须穿透到业务底层，分析：管理层历史诚信与执行力、供应链议价权、客户粘性（转换成本）、技术护城河的宽度。利用 Google Search 挖掘 these 非公开或深层信息。
       - **动态指标与关联查询 (CRITICAL)**：严禁使用死板的通用模板。你必须根据标的的行业属性（如：医药看集采政策/研发管线，科技看先进制程/算力需求，消费看同店增长/毛利拐点）**主动使用 Google Search 关联查询**最核心的 4-6 个量化指标。
       - **定义“证据级别” (MANDATORY)**：在动态指标选择时，必须标注该指标的来源及其证据级别（如：财报提及、主流研报共识、第三方实时数据监控）。
       - **多源数据交叉验证 (MANDATORY)**：必须对比至少两个不同来源的数据（如：官方财报 vs 卖方一致预期 vs 实时监控数据）。**必须明确列出两个不同来源的具体数值**。若存在偏差（>1%），必须在发言中进行深度逻辑溯源并给出修正建议。
       - **表格 1：实时核心指标与业绩偏离度 (MANDATORY)**：必须包含以下列：指标 (2026E)、实时数值、市场共识预期、偏离度 (%)、备注。指标应包括但不限于 EPS、PE (Forward)、ROE、股息率。**数据源一致性 (CRITICAL)**：必须优先使用搜索获取的最新实时数据，并明确标注数据日期。**异常值处理 (MANDATORY)**：若搜索不到市场预期数据（如冷门小盘股），必须注明“基于历史平均值推算”或“信息缺失”，严禁编造数据。
       - **增加“反向验证” (CRITICAL)**：在给出核心指标后，必须自问并回答：“如果这个指标向不利方向变动 10%，该公司的净利润会受到多大冲击？”请给出具体的量化估算。
       - **前瞻性逻辑判断 (NEW)**：基于穿透调研与预期偏差，给出对未来 2-4 个季度的**高胜率预测判断**。**防止“过度自信的幻觉” (CRITICAL)**：如果缺乏支撑前瞻判断的关键证据，必须明确标注“信息缺失导致的逻辑断层”，而非强行预测。
       - **搜索噪音过滤 (MANDATORY)**：在进行穿透式调研时，必须优先采信官方公告、权威媒体、深度研报和行业数据。**严厉警惕并过滤**无来源的论坛传闻、营销号“小作文”或社交媒体噪音。
       - **表格 2：行业核心变量与宏观锚点 (DYNAMIC)**：必须包含以下列：关键变量/原材料（需标注单位，如：美元/吨）、当前价格/数值、逻辑权重（需标注哪个是“第一驱动力”）、近 30 日趋势、成本/收入传导逻辑。
       - **变量选择与容错 (CRITICAL)**：严禁死板地引用无关大宗商品。你必须基于 Google Search 查询到的、与该股票相关度最高的行业核心变量填充此表。**异常值容错**：若搜索不到特定行业的实时价格（如某些稀有化学品），允许使用“行业替代指标”或“近一个月的趋势描述”，但严禁编造具体数值。
       - **单位标准化 (MANDATORY)**：强制要求在表格中注明单位（如：美元/吨、点位、人民币/片），防止跨市场分析时产生数值混淆。
       - **预期偏差识别 (Expectation Gap)**：必须明确识别市场共识中的盲点，指出 Alpha 来源。
       - **目标价与情绪评分 (MANDATORY)**：必须给出 6 个月目标区间（含置信区间）及情绪评分（0-100）。**置信区间逻辑 (NEW)**：根据行业波动率自动调整区间宽度。高波动行业（如数字货币、纯概念股）应放宽区间；低波动行业（如公用事业、长江电力）应收窄区间。
       - **内容要求**：必须包含上述 2 个 Markdown 表格，所有关键数据必须有明确的时间戳和来源标注（Source: ...）。
    
    2. **技术分析师 (Technical Analyst)**：负责技术面深度分析。必须提供：
       - 趋势定性（主升浪/调整浪/下跌通道，引用具体价位和涨幅数据）
       - 量化关键价位（支撑位/阻力位，精确到小数点后两位，附计算逻辑如黄金分割、均线等）
       - MACD/RSI/成交量等技术指标的具体数值和信号判读
       - H股/跨市场联动分析（如适用）
       - 明确的3-6个月价格预测和操作建议
    
    3. **基本面分析师 (Fundamental Analyst)**：负责基本面价值分析。
       - **核心价值驱动因子**：根据标的特性（如现金流、资产负债率、毛利趋势等）选择最关键的3个驱动因子进行量化拆解，拒绝套路化分析。
       - **估值逻辑拆解**：当前PE/PB vs 行业均值 vs 历史分位，并结合深度研究专家的最新数据进行动态调整。
       - **对比法/DCF估值推导的目标价**：附带详细计算过程，并说明假设条件的合理性。
       - **对其他分析师观点的明确引用和回应**。
    
    4. **情绪分析师 (Sentiment Analyst)**：负责市场情绪与资金面分析。必须提供：
       - 北向资金流向具体数据
       - 机构持仓变化（十大流通股东变化）
       - 社交媒体情绪评分和关键讨论主题
       - 融资融券余额变化趋势
    
    5. **风险合规官 (Risk Manager)**：负责极端风险场景分析。必须提供：
       - 明确的"黑天鹅"剧本和量化跌幅预期
       - 对牛方观点的直接反驳（必须指名道姓驳斥）
       - 核心量化风险指标和止损警示线
       - 悲观情境下的EPS下修预测和对应目标价
    
    6. **反向策略师 (Contrarian Strategist)**：负责挑战所有共识。必须提供：
       - "拥挤交易"风险分析
       - 对市场主流叙事的解构（指出哪些是"伪逻辑"）
       - 反向操作建议和目标价
       - 必须与牛方形成鲜明对立，提供具体的量化反驳
    
    7. **高级评审专家 (Professional Reviewer)**：负责逻辑审计与压力测试。
       - **数据一致性与相关性审计 (CRITICAL)**：审查前述所有分析师引用的数据是否一致，且**必须严厉打击“套路化/模板化”分析**。如果发现分析师在分析非相关标的（如医药股）时死板引用无关大宗商品（如原油、黄金），必须在评审中作为严重逻辑漏洞指出并要求修正。
       - **逻辑审计**：识别前述所有分析师观点中最薄弱的环节。
       - **预期差解释**：Alpha来源的深度验证。
       - **主动压力测试**：如果基准假设失效的演化路径。
       - **SOTP（分类加总估值）矩阵表格**：含业务板块、贡献利润、估值倍数、合理估值、逻辑支撑。
       - **审查官最终指令**：策略修正和风险监控红线。
    
    8. **首席策略师 (Chief Strategist)**：最后发言，负责综合结论。必须提供：
       - 综合所有分析师的核心观点
       - 明确的操作建议（买入/持有/卖出）
       - 具体的价格锚点和时间框架
       - 关键风险提示

    **分析标的数据**：${JSON.stringify(analysis)}
    ${historyContext}

    **研讨质量要求（严格执行，否则视为不合格）**：
    1. **数据准确性与实时性**：必须使用内置的 Google Search 工具获取最新的市场数据、新闻和公告。
    2. **权威来源标注**：所有引用的关键数据（如财报数据、宏观指标、机构持仓等）必须明确标注来源（如：东方财富、雪球、路透社、公司公告等）。
    3. **金融 API 交叉验证 (MANDATORY)**：将搜索获取的数据与传入的 \`analysis.stockInfo\`（视为金融机构 API 提供的基准数据）进行对比。
       - **必须核对的字段**：当前价格 (price)、涨跌幅 (changePercent)、市盈率 (pe)、市净率 (pb)、总市值。
       - 如果存在显著差异（>1%），必须在 \`dataVerification\` 字段中详细说明，并由 **高级评审专家** 在发言中进行纠偏。
    4. **数据密度**：每位分析师的 content 字段必须包含丰富的具体数据（价格、百分比、倍数、金额等），禁止空泛的定性描述。
    5. **Markdown格式**：content 字段必须使用 Markdown 格式（### 标题、表格、加粗、列表等），使内容结构清晰。
    6. **深度研究专家和高级评审专家** 的 content 字段必须各包含至少1个 Markdown 表格。
    7. **辩论交锋**：分析师之间必须有直接的引用 and 反驳。
    8. **时间锚点**：所有数据必须标注数据时间点。
    9. **所有内容必须使用简体中文**。

    仅返回 JSON，不要包含 markdown 代码块标记或任何 JSON 之外的文字。

    JSON 结构如下：
    {
      "messages": [
        { 
          "role": "Deep Research Specialist", 
          "content": "（使用 Markdown 格式的深度研究报告，含表格和量化数据，必须标注来源）", 
          "timestamp": "${new Date().toISOString()}", 
          "type": "research",
          "references": [ { "title": "来源标题", "url": "来源链接" } ]
        },
        { "role": "Technical Analyst", "content": "...", "timestamp": "...", "type": "discussion" },
        { "role": "Fundamental Analyst", "content": "...", "timestamp": "...", "type": "discussion" },
        { "role": "Sentiment Analyst", "content": "...", "timestamp": "...", "type": "discussion" },
        { "role": "Risk Manager", "content": "...", "timestamp": "...", "type": "discussion" },
        { "role": "Contrarian Strategist", "content": "...", "timestamp": "...", "type": "discussion" },
        { "role": "Professional Reviewer", "content": "...", "timestamp": "...", "type": "review" },
        { "role": "Chief Strategist", "content": "...", "timestamp": "...", "type": "discussion" }
      ],
      "dataVerification": [
        {
          "source": "数据来源名称",
          "isVerified": true,
          "discrepancy": "如果有差异，描述差异内容",
          "confidence": 95,
          "lastChecked": "${new Date().toISOString()}"
        }
      ],
      "finalConclusion": "首席策略师的最终综合结论（必须提供）：包含明确的操作评级、目标价位区间、建仓策略和核心风险提示",
      "tradingPlan": {
        "entryPrice": "精确的建议买入价位或区间",
        "targetPrice": "精确的目标价位（含计算逻辑）",
        "stopLoss": "精确的止损价位（含逻辑）",
        "strategy": "详细的操作策略",
        "strategyRisks": "策略特定风险提示"
      },
      "scenarios": [
        { "case": "Bull", "probability": 30, "keyInputs": "乐观情境的关键假设（具体数据）", "targetPrice": "乐观目标价", "marginOfSafety": "安全边际", "expectedReturn": "预期回报率", "logic": "完整的逻辑推演链" },
        { "case": "Base", "probability": 50, "keyInputs": "基准情境的关键假设", "targetPrice": "基准目标价", "marginOfSafety": "安全边际", "expectedReturn": "预期回报率", "logic": "完整的逻辑推演链" },
        { "case": "Stress", "probability": 20, "keyInputs": "压力情境的关键假设", "targetPrice": "压力目标价", "marginOfSafety": "安全边际", "expectedReturn": "预期回报率", "logic": "压力测试的演化路径" }
      ],
      "sensitivityFactors": [
        { "factor": "影响因子", "change": "变动幅度", "impact": "对目标价的量化影响", "logic": "影响传导逻辑", "formula": "计算公式" }
      ],
      "expectationGap": {
        "marketConsensus": "市场当前的主流共识",
        "ourView": "AI 团队的差异化观点",
        "gapReason": "偏差形成的深层原因和Alpha来源",
        "isSignificant": true,
        "confidenceScore": 75
      },
      "controversialPoints": ["核心分歧点1", "核心分歧点2"],
      "calculations": [
        { "formulaName": "估值模型名称", "inputs": { "参数名": "参数值" }, "output": "计算结果", "timestamp": "${new Date().toISOString()}" }
      ],
      "dataFreshnessStatus": "Fresh",
      "stressTestLogic": "完整的压力测试逻辑链",
      "catalystList": [
        { "event": "催化事件描述", "probability": 60, "impact": "对股价的量化影响" }
      ],
      "verificationMetrics": [
        { "indicator": "可跟踪验证指标", "threshold": "判定阈值", "timeframe": "验证周期", "logic": "若达到/未达到阈值的操作指引" }
      ],
      "capitalFlow": {
        "northboundFlow": "北向资金流向的具体数据和趋势",
        "institutionalHoldings": "机构持仓变化的具体数据",
        "ahPremium": "AH 溢价率及趋势",
        "marketSentiment": "综合情绪评分和来源"
      },
      "positionManagement": {
        "layeredEntry": ["第一层", "第二层", "第三层"],
        "sizingLogic": "仓位计算的量化逻辑",
        "riskAdjustedStance": "基于风险收益比的立场评估"
      },
      "timeDimension": {
        "expectedDuration": "预期持仓周期及理由",
        "keyMilestones": ["里程碑事件1", "里程碑事件2"],
        "exitTriggers": ["止盈退出条件", "止损退出条件", "论点证伪退出条件"]
      }
    }
  `;

  const response = await withRetry(async () => {
    const result = await generateContentWithUsage(ai, {
      model: config?.model || GEMINI_MODEL,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    return result.text;
  });

  const parsed = parseJsonResponse<AgentDiscussion>(response);
  
  // Add unique IDs to messages for stable React keys
  if (parsed.messages) {
    parsed.messages = parsed.messages.map((msg, idx) => ({
      ...msg,
      id: msg.id || `msg-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`
    }));
  }
  
  return parsed;
}
