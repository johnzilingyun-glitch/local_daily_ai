const API_BASE = '/api';

export interface ResilienceEvent {
  type: 'cache_hit' | 'model_fallback' | 'retry' | 'request_dedupe';
  model?: string;
  symbol?: string;
  attempt?: number;
  savedTokens?: number;
  duration?: number;
}

class TelemetryService {
  async reportMetric(event: ResilienceEvent) {
    try {
      // Direct call to the new server endpoint
      await fetch(`${API_BASE}/telemetry/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      // Fail silently for telemetry to avoid breaking core logic
      console.warn('[Telemetry] Failed to report metric:', error);
    }
  }

  // Specialized helpers
  reportCacheHit(symbol?: string) {
    this.reportMetric({ type: 'cache_hit', symbol });
  }

  reportFallback(fromModel: string, toModel: string, symbol?: string) {
    this.reportMetric({ 
      type: 'model_fallback', 
      model: `${fromModel} -> ${toModel}`, 
      symbol 
    });
  }

  reportRetry(model: string, attempt: number, symbol?: string) {
    this.reportMetric({ type: 'retry', model, attempt, symbol });
  }

  reportDedupe(symbol?: string) {
    this.reportMetric({ type: 'request_dedupe', symbol });
  }
}

export const telemetryService = new TelemetryService();
