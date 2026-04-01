export type Market = "A-Share" | "HK-Share" | "US-Share";

export interface StockInfo {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  market: Market;
  currency: string;
  lastUpdated: string;
  previousClose: number;
  dailyHigh?: number;
  dailyLow?: number;
  dataFreshness?: string; // Timestamp from MCP/API
  dataSource?: string; // e.g. "FMP", "Bloomberg"
  sourceWeight?: number; // 0.0 - 1.0
  dataQuality?: DataQuality;
}

export interface DataQuality {
  score: number; // 0-100
  lastSync: string;
  sourcePriority: "Official API" | "Search/Scraped" | "AI Estimated";
  isStale: boolean;
  missingFields: string[];
  semanticIssues?: string[];
}

export interface NewsItem {
  title: string;
  source: string;
  time: string;
  url: string;
  summary: string;
}

export interface IndexInfo {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
}

export interface SectorAnalysis {
  name: string;
  trend: string;
  conclusion: string;
}

export interface CommodityAnalysis {
  name: string;
  trend: string;
  expectation: string;
}

export interface Recommendation {
  type: "Stock" | "Sector";
  name: string;
  reason: string;
}

export interface MarketOverview {
  id?: string;
  indices: IndexInfo[];
  topNews: NewsItem[];
  sectorAnalysis: SectorAnalysis[];
  commodityAnalysis: CommodityAnalysis[];
  recommendations: Recommendation[];
  marketSummary: string;
}

export interface StockFundamentals {
  pe: string;
  pb: string;
  roe: string;
  eps: string;
  revenueGrowth: string;
  valuationPercentile: string;
  netProfitGrowth?: string;
  debtToEquity?: string;
  grossMargin?: string;
  netMargin?: string;
  dividendYield?: string;
}

export interface FundamentalTableItem {
  indicator: string;
  value: string;
  consensus: string;
  deviation: string;
  remark: string;
}

export interface IndustryAnchor {
  variable: string;
  currentValue: string;
  weight: string;
  monthlyChange: string;
  logic: string;
}

export interface HistoricalData {
  yearHigh: string;
  yearLow: string;
  majorEvents: string[];
}

export interface ValuationAnalysis {
  comparison: string;
  marginOfSafetySummary: string;
}

export interface TradingPlan {
  entryPrice: string;
  targetPrice: string;
  stopLoss: string;
  strategy: string;
  strategyRisks: string;
  positionPlan?: { price: string; positionPercent: number }[]; // 分层建仓
  logicBasedStopLoss?: string; // 基于逻辑证伪的止损条件
  riskRewardRatio?: number;
}

export interface TradingPlanVersion {
  version: string;
  timestamp: string;
  changeReason: string;
  plan: TradingPlan;
}

export interface StockAnalysis {
  id?: string;
  symbol?: string;
  timestamp?: string;
  stockInfo: StockInfo;
  fundamentals?: StockFundamentals;
  historicalData?: HistoricalData;
  valuationAnalysis?: ValuationAnalysis;
  news: NewsItem[];
  summary: string;
  technicalAnalysis: string;
  fundamentalAnalysis: string;
  fundamentalTable?: FundamentalTableItem[];
  industryAnchors?: IndustryAnchor[];
  sentiment: "Bullish" | "Bearish" | "Neutral";
  score: number;
  recommendation: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";
  keyRisks: string[];
  keyOpportunities: string[];
  discussion?: AgentMessage[];
  finalConclusion?: string;
  tradingPlan?: TradingPlan;
  tradingPlanHistory?: TradingPlanVersion[];
  scenarios?: Scenario[];
  coreVariables?: CoreVariable[];
  businessModel?: BusinessModel;
  quantifiedRisks?: QuantifiedRisk[];
  riskAdjustedValuation?: number;
  dataQuality?: DataQuality;
  expectedValueOutcome?: ExpectedValueOutcome;
  sensitivityMatrix?: SensitivityMatrixRow[];
  backtestResult?: {
    previousDate: string;
    previousRecommendation: string;
    actualReturn: string;
    learningPoint: string;
  };
  valuationMatrix?: Scenario[];
  stressTestLogic?: string;
  catalystList?: Catalyst[];
  sensitivityFactors?: SensitivityFactor[];
  expectationGap?: ExpectationGap;
  analystWeights?: AnalystWeight[];
  calculations?: CalculationResult[];
  controversialPoints?: string[];
  positionManagement?: {
    layeredEntry: string[];
    sizingLogic: string;
    riskAdjustedStance: string;
  };
  timeDimension?: {
    expectedDuration: string;
    keyMilestones: string[];
    exitTriggers: string[];
  };
  moatAnalysis?: {
    type: string;
    strength: "Wide" | "Narrow" | "None";
    logic: string;
  };
  narrativeConsistency?: {
    score: number; // 0-100
    warning?: string;
    details: string;
  };
  netNetValue?: number;
  isDeepValue?: boolean;
  verificationMetrics?: {
    indicator: string;
    threshold: string;
    timeframe: string;
    logic: string;
  }[];
  dataVerification?: DataVerification[];
  capitalFlow?: {
    northboundFlow: string;
    institutionalHoldings: string;
    ahPremium?: string;
    marketSentiment: string;
  };
  cycleAnalysis?: {
    stage: "Early" | "Mid" | "Late" | "Bottom" | "Peak";
    logic: string;
    volatilityRisk: string;
  };
  chatHistory?: { id: string; role: "user" | "ai"; content: string }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
}

export type AgentRole =
  | "Technical Analyst"
  | "Fundamental Analyst"
  | "Sentiment Analyst"
  | "Risk Manager"
  | "Contrarian Strategist"
  | "Deep Research Specialist"
  | "Professional Reviewer"
  | "Chief Strategist"
  | "Moderator";

export interface AgentMessage {
  id?: string;
  role: AgentRole;
  content: string;
  timestamp: string;
  type?: "discussion" | "research" | "review" | "user_question" | "fact_check";
  references?: { title: string; url: string }[];
}

export interface Scenario {
  case: "Bull" | "Base" | "Stress";
  probability: number; // 0-100
  keyInputs: string;
  targetPrice: string;
  marginOfSafety: string;
  expectedReturn: string; // e.g. "18%"
  logic: string;
}

export interface Catalyst {
  event: string;
  probability: number;
  impact: string; // e.g. "±5% 股价"
}

export interface SensitivityFactor {
  factor: string; // e.g. "金价"
  change: string; // e.g. "±5%"
  impact: string; // e.g. "±3.2% 目标价"
  logic: string;
  formula?: string; // The standardized formula used
}

export interface SensitivityMatrixRow {
  variable: string;    // e.g. "Silicon Price"
  change: string;      // e.g. "-10%"
  profitImpact: string; // e.g. "-1.2B CNY"
  timeLag: string;     // e.g. "Immediate" vs "18-24mo"
}

export interface ExpectedValueOutcome {
  expectedPrice: number;
  calculationLogic: string; // "Σ(P_i * Price_i)"
  confidenceInterval: string; // e.g. "[25, 30]"
}

export interface ExpectationGap {
  marketConsensus: string;
  ourView: string;
  gapReason: string; // Alpha source explanation
  isSignificant: boolean;
  confidenceScore?: number; // 0-100
}

export interface AnalystWeight {
  role: AgentRole;
  weight: number; // 0-1
  isExpert: boolean;
  expertiseArea?: string; // e.g. "Tech", "Commodities"
}

export interface CalculationResult {
  formulaName: string;
  inputs: Record<string, any>;
  output: any;
  timestamp: string;
}

export interface AgentDiscussion {
  messages: AgentMessage[];
  finalConclusion: string;
  tradingPlan?: TradingPlan;
  tradingPlanHistory?: TradingPlanVersion[];
  controversialPoints?: string[];
  scenarios?: Scenario[];
  valuationMatrix?: Scenario[];
  stressTestLogic?: string;
  catalystList?: Catalyst[];
  sensitivityFactors?: SensitivityFactor[];
  expectationGap?: ExpectationGap;
  analystWeights?: AnalystWeight[];
  calculations?: CalculationResult[];
  dataFreshnessStatus?: "Fresh" | "Stale" | "Warning";
  dataVerification?: DataVerification[];
  coreVariables?: CoreVariable[];
  businessModel?: BusinessModel;
  quantifiedRisks?: QuantifiedRisk[];
  riskAdjustedValuation?: number;
  expectedValueOutcome?: ExpectedValueOutcome;
  sensitivityMatrix?: SensitivityMatrixRow[];
  backtestResult?: {
    previousDate: string;
    previousRecommendation: string;
    actualReturn: string;
    learningPoint: string;
  };
  verificationMetrics?: {
    indicator: string;
    threshold: string;
    timeframe: string;
    logic: string;
  }[];
  capitalFlow?: {
    northboundFlow: string;
    institutionalHoldings: string;
    ahPremium?: string;
    marketSentiment: string;
  };
  positionManagement?: {
    layeredEntry: string[];
    sizingLogic: string;
    riskAdjustedStance: string;
  };
  timeDimension?: {
    expectedDuration: string;
    keyMilestones: string[];
    exitTriggers: string[];
  };
}

export interface DataVerification {
  source: string;
  isVerified: boolean;
  discrepancy?: string;
  confidence: number; // 0-100
  lastChecked: string;
}

// === 阶段 1：核心变量体系 (Core Variable System) ===
export interface CoreVariable {
  name: string;            // 变量名，如"出货量"、"碳酸锂价格"
  value: number | string;  // 当前值
  unit: string;            // 单位，如 GWh、元/吨
  marketExpect: number | string; // 市场一致预期
  delta: string;           // 偏离说明，如 "+5% vs 预期"
  reason: string;          // 偏离原因
  evidenceLevel: "财报" | "研报共识" | "第三方监控" | "推算" | "信息缺失";
}

export type BusinessType = "manufacturing" | "saas" | "banking" | "retail" | "healthcare" | "tech" | "other";

export interface BusinessModel {
  businessType: BusinessType;         // 行业类型
  formula: string;                     // 利润公式，如 "利润 = 产量 × (售价 - 成本)"
  drivers: Record<string, string>;     // 关键因子，如 { volume: "40 GWh", price: "5000 元/GWh" }
  projectedProfit: string;             // 预测利润
  confidenceScore: number;             // 0-100 置信度
}

// === 阶段 2：风险概率化 (Quantified Risk) ===
export interface QuantifiedRisk {
  name: string;            // 风险名称
  probability: number;     // 发生概率 0-100
  impactPercent: number;   // 对利润的影响幅度 (负数表示损失)
  expectedLoss: number;    // 期望损失 = probability × impactPercent / 100
  mitigation: string;      // 对冲/缓释手段
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  feishuWebhookUrl?: string;
  cachingEnabled?: boolean;
}
