import { StockInfo, DataQuality } from "../types";

const STALENESS_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours

export function calculateQualityScore(info: StockInfo): DataQuality {
  let score = 100;
  const missingFields: string[] = [];

  // Check critical fields
  if (!info.price || info.price <= 0) {
    score -= 30;
    missingFields.push("Price");
  }
  
  if (info.previousClose === undefined || info.previousClose === 0) {
    score -= 10;
    missingFields.push("Previous Close");
  }

  // Check source priority
  let sourcePriority: DataQuality["sourcePriority"] = "Official API";
  if (info.dataSource === "Google Search" || !info.dataSource) {
    sourcePriority = "Search/Scraped";
    score -= 10;
  } else if (info.dataSource === "AI Inference") {
    sourcePriority = "AI Estimated";
    score -= 25;
  }

  // Check forstaleness
  const lastUpdatedDate = new Date(info.lastUpdated);
  const now = new Date();
  const diff = now.getTime() - lastUpdatedDate.getTime();
  const isStale = diff > STALENESS_THRESHOLD_MS;

  if (isStale) {
    score -= 15;
  }

  const semanticIssues = checkSemanticConsistency(info);
  if (semanticIssues.length > 0) {
    score -= (semanticIssues.length * 10);
  }

  return {
    score: Math.max(0, score),
    lastSync: info.lastUpdated,
    sourcePriority,
    isStale,
    missingFields,
    semanticIssues: semanticIssues.length > 0 ? semanticIssues : undefined
  };
}

function checkSemanticConsistency(info: StockInfo): string[] {
  const issues: string[] = [];

  // 1. Expected Value Probability Check
  if (info.dataQuality?.semanticIssues === undefined) { 
    // This is a placeholder since StockInfo doesn't directly have EV, 
    // but the analysis object does. However, calculateQualityScore is called on StockInfo.
    // In our architecture, we should probably pass the whole analysis to a separate validator.
    // For now, let's add some basic price-related semantic checks.
  }

  if (info.dayHigh !== undefined && info.dayLow !== undefined) {
    if (info.dayHigh < info.dayLow) {
      issues.push("Day High is lower than Day Low");
    }
    if (info.price > info.dayHigh * 1.05 || info.price < info.dayLow * 0.95) {
       // Tolerance for delay, but 5% is suspicious
       issues.push("Price significantly outside daily range");
    }
  }

  return issues;
}

export function validateAnalysisSemantics(analysis: any): string[] {
  const issues: string[] = [];
  
  // EV Probability Check
  if (analysis.expectedValueOutcome && analysis.expectedValueOutcome.calculationLogic) {
     const probMatch = analysis.expectedValueOutcome.calculationLogic.match(/(\d+)%/g);
     if (probMatch) {
       const sum = probMatch.reduce((acc: number, curr: string) => acc + parseInt(curr), 0);
       if (sum < 95 || sum > 105) {
         issues.push(`EV Probabilities sum to ${sum}%, expected ~100%`);
       }
     }
  }

  // Business Model Formula Check
  if (analysis.businessModel && analysis.businessModel.formula) {
    if (analysis.businessModel.formula.includes("利润") && !analysis.businessModel.formula.includes("-")) {
       issues.push("Profit formula missing cost deduction component");
    }
  }

  return issues;
}

export function getQualityLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "High Precision", color: "text-emerald-400" };
  if (score >= 70) return { label: "Reliable", color: "text-blue-400" };
  if (score >= 50) return { label: "Moderate", color: "text-amber-400" };
  return { label: "Low Confidence", color: "text-rose-400" };
}
