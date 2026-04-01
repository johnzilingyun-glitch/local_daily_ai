import { Request, Response, NextFunction } from 'express';
import { addLogEntry } from '../services/fileStore';

export interface TelemetryData {
  path: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: string;
}

export interface ResilienceEvent {
  type: 'cache_hit' | 'model_fallback' | 'retry' | 'request_dedupe';
  model?: string;
  symbol?: string;
  attempt?: number;
  savedTokens?: number;
  duration?: number;
}

export const telemetryMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const data: TelemetryData = {
      path: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
    };

    // Console logging for instant feedback in dev
    if (res.statusCode >= 400) {
      console.warn(`[TELEMETRY] ${data.method} ${data.path} ${data.statusCode} - ${data.duration}ms`);
    }

    // Persist to logs for AdminPanel
    if (req.originalUrl.startsWith('/api/')) {
      void addLogEntry(
        'api_telemetry', 
        null, 
        null, 
        `API Call: ${data.method} ${data.path} finished with ${data.statusCode} in ${data.duration}ms`
      );
    }
  });

  next();
};

export const recordResilienceEvent = async (event: ResilienceEvent) => {
  const message = `[RESILIENCE] ${event.type.toUpperCase()}${event.symbol ? ` for ${event.symbol}` : ''}${event.model ? ` (model: ${event.model})` : ''}${event.attempt ? ` (attempt: ${event.attempt})` : ''}`;
  console.log(message);
  await addLogEntry('ai_resilience', null, JSON.stringify(event), message);
};
