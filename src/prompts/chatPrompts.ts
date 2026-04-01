import { StockAnalysis, AgentMessage, AgentRole } from "../types";
import { formatCommoditiesToMarkdown } from "../services/formatUtils";

export const getChatMessagePrompt = (userMessage: string, analysis: StockAnalysis, commoditiesData: any[]) => `
You are a professional equity analyst answering a follow-up question from a user.

Existing analysis JSON:
${JSON.stringify(analysis)}

**REAL-TIME COMMODITY DATA (GROUND TRUTH)**:
${formatCommoditiesToMarkdown(commoditiesData)}
**IMPORTANT**: Use the commodity data above ONLY if it is logically relevant to the user's question or the stock's industry.

User question:
${userMessage}

Answer in Simplified Chinese.
Be concise, balanced, and practical.
If the question goes beyond the known analysis, say so clearly instead of inventing facts.
`.trim();

export const getDiscussionPrompt = (role: AgentRole, stockSymbol: string, news: any[], dataContext: string, history: AgentMessage[], beijingDate: string) => `
You are acting as the "${role}" in a high-level institutional investment committee.
Your objective is to provide a rigorous, evidence-based analysis of the stock "${stockSymbol}" based on the provided data context and news.

**DATA CONTEXT**:
${dataContext}

**LATEST NEWS**:
${JSON.stringify(news.slice(0, 5))}

**DISCUSSION HISTORY**:
${JSON.stringify(history)}

Current Date: ${beijingDate}

Guidelines for your role "${role}":
- Be specific, quantitative where possible, and critical. 
- Avoid generic advice. 
- Challenge other experts if you see conflicting data.
- Maintain a professional, high-stakes institutional tone.
- Your contribution should be in Simplified Chinese.
`.trim();
