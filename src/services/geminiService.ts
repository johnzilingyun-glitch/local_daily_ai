import { GoogleGenAI } from "@google/genai";
import { useConfigStore } from "../stores/useConfigStore";
import { useUIStore } from "../stores/useUIStore";
import { telemetryService } from "./telemetryService";

export const GEMINI_MODEL = "gemini-3-flash-preview";

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function getApiKey(config?: { apiKey?: string }): string {
  if (config?.apiKey) return config.apiKey;
  const storeApiKey = useConfigStore.getState().config?.apiKey;
  if (storeApiKey) return storeApiKey;
  
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("MY_GEMINI_API_KEY")) {
    console.warn("No Gemini API key found in config or environment variables.");
    return "";
  }
  return apiKey;
}

export function createAI(config?: { apiKey?: string }) {
  const apiKey = getApiKey(config);
  if (!apiKey) throw new Error("Missing Gemini API Key");
  return new GoogleGenAI({ apiKey });
}

// Global registry for deduplicating in-flight requests
const pendingRequests = new Map<string, Promise<any>>();

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000,
  fallbackFn?: () => Promise<T>
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
      
      // Expanded retryable error conditions
      const isRetryable = 
        errorStr.includes('429') || 
        errorStr.includes('503') ||
        errorStr.includes('500') ||
        errorStr.includes('504') ||
        errorStr.toLowerCase().includes('quota') || 
        errorStr.includes('RESOURCE_EXHAUSTED') ||
        errorStr.toLowerCase().includes('unavailable') ||
        errorStr.toLowerCase().includes('deadline_exceeded') ||
        error?.status === 429 ||
        error?.status === 503 ||
        error?.status === 500 ||
        error?.status === 504;
      
      if (isRetryable && attempt < maxRetries) {
        // Multiplicative backoff with jitter
        const waitTime = baseDelay * Math.pow(2.5, attempt - 1) + Math.random() * 1000;
        console.warn(`[AI RETRY] ${error?.status || 'Error'} hit. Retrying in ${Math.round(waitTime)}ms... (Attempt ${attempt}/${maxRetries})`);
        
        if (isQuotaError(error)) {
          useUIStore.getState().setAIHealth('degraded');
        }
        
        telemetryService.reportRetry(GEMINI_MODEL, attempt);
        await delay(waitTime);
        continue;
      }
      
      // If we have a fallback function and hit a specific error (quota/unavailable)
      if (fallbackFn && (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('503'))) {
        console.warn(`[AI FALLBACK] Strategy engaged due to error: ${error?.status || 'Quota'}.`);
        telemetryService.reportFallback(GEMINI_MODEL, 'gemini-1.5-flash');
        return await fallbackFn();
      }

      // If not retryable or max retries reached, throw
      if (attempt >= maxRetries) {
        const isQuota = isQuotaError(error);
        
        if (isQuota) {
          useUIStore.getState().setAIHealth('error');
        }
        
        const finalError = isQuota 
          ? new Error(`AI 服务配额已耗尽 (API Quota Exhausted). 请稍后再试或在设置中更换 API Key。`) 
          : (error instanceof Error ? error : new Error(errorStr));

        console.error(`[AI FATAL] Max retries reached or non-retryable error:`, errorStr);
        throw finalError;
      }
      
      // Small fixed delay for non-specified errors before final throw
      await delay(1000);
    }
  }
  throw lastError;
}

export function extractJsonBlock(raw: string): string {
  let cleaned = raw.trim();
  
  // 1. Try to find triple backtick blocks
  const tripleBacktickMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (tripleBacktickMatch?.[1]) {
    cleaned = tripleBacktickMatch[1].trim();
  } else {
    // Also try single backticks
    const singleBacktickMatch = cleaned.match(/`\s*([\s\S]*?)\s*`/);
    if (singleBacktickMatch?.[1]) {
      cleaned = singleBacktickMatch[1].trim();
    }
  }

  // 2. Find the start of the JSON object or array
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  
  let start = -1;
  let opener = '';
  let closer = '';
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    opener = '{';
    closer = '}';
  } else if (firstBracket !== -1) {
    start = firstBracket;
    opener = '[';
    closer = ']';
  }
  
  if (start === -1) {
    throw new Error("Gemini returned a non-JSON response (No opener found).");
  }

  // 3. Robust balanced brace counting to find the actual end
  let balance = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === opener) {
        balance++;
      } else if (char === closer) {
        balance--;
        if (balance === 0) {
          // Found the matching closing brace!
          return cleaned.slice(start, i + 1);
        }
      }
    }
  }
  
  // Fallback to simple slice if balancing fails (e.g. truncated)
  const lastCloser = cleaned.lastIndexOf(closer);
  if (lastCloser > start) {
    return cleaned.slice(start, lastCloser + 1);
  }
  
  throw new Error("Gemini returned a non-JSON response (Mismatched braces).");
}

export function parseJsonResponse<T>(raw: string): T {
  if (!raw || raw.trim() === "") {
    throw new Error("Gemini returned an empty response.");
  }

  try {
    const jsonBlock = extractJsonBlock(raw);
    const parsed = JSON.parse(jsonBlock);
    
    // Intelligent heuristic for nested structures
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      // Common Gemini nesting patterns
      if (parsed.analysis && typeof parsed.analysis === 'object') return parsed.analysis as T;
      if (parsed.data && typeof parsed.data === 'object') return parsed.data as T;
      
      // If it looks like the target structure already
      if (parsed.stockInfo && (parsed.stockInfo.symbol || parsed.stockInfo.name)) return parsed as T;
      if (parsed.indices && Array.isArray(parsed.indices)) return parsed as T;
      
      // Single-key wrappers
      const keys = Object.keys(parsed);
      if (keys.length === 1) {
        const firstKey = keys[0];
        const nested = parsed[firstKey];
        if (nested && typeof nested === 'object' && (nested.stockInfo || nested.indices || nested.messages)) {
          return nested as T;
        }
      }
    }
    return parsed as T;
  } catch (error) {
    console.error("Critical JSON Parse Error. Raw string length:", raw.length);
    console.error("Raw response snippet:", raw.substring(0, 200) + "...");
    throw new Error(
      error instanceof Error
        ? `AI Response Parsing Failure: ${error.message}`
        : "Failed to decode AI response architecture."
    );
  }
}

export async function generateContentWithUsage(ai: any, params: any) {
  const result = await ai.models.generateContent(params);
  if (result.usageMetadata) {
    useConfigStore.getState().addTokenUsage({
      promptTokens: result.usageMetadata.promptTokenCount || 0,
      candidatesTokens: result.usageMetadata.candidatesTokenCount || 0,
      totalTokens: result.usageMetadata.totalTokenCount || 0,
    });
  }
  return result;
}

/**
 * Deduplicates in-flight requests based on a unique key
 */
export async function getDeduplicatedContent<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  const existing = pendingRequests.get(key);
  if (existing) {
    console.log(`[AI DEDUPE] Sharing existing request for key: ${key.substring(0, 40)}...`);
    return existing;
  }

  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

export async function fetchAvailableModelsList(config?: any) {
  const ai = createAI(config);
  
  const modelsToCheck = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Fast & Balanced)', description: 'Best for general analysis and quick summaries.' },
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Advanced Reasoning)', description: 'Best for complex financial logic and deep analysis.' },
    { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite (Ultra Fast)', description: 'Optimized for speed and low-latency tasks.' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Stable fast model.' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Stable reasoning model.' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Legacy fast model.' }
  ];

  const availableModels = [];

  for (const m of modelsToCheck) {
    try {
      await ai.models.generateContent({
        model: m.id,
        contents: "ping",
      });
      availableModels.push(m);
    } catch (e: any) {
      console.warn(`Model ${m.id} skipped:`, e?.message);
    }
  }

  if (availableModels.length === 0) {
    throw new Error("无可用模型 (No working models found). 请检查配额或网络.");
  }

  return availableModels;
}

export function isQuotaError(error: any): boolean {
  const errorStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
  return (
    errorStr.includes('429') || 
    errorStr.includes('RESOURCE_EXHAUSTED') || 
    errorStr.toLowerCase().includes('quota') ||
    error?.status === 429
  );
}
