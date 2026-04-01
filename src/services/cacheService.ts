import { telemetryService } from './telemetryService';

export interface CacheEntry<T> {
  value: T;
  expiry: number;
  timestamp: string;
}

class CacheService {
  private readonly PREFIX = 'trading_agents_cache_';

  /**
   * Generates a deterministic key for caching
   */
  getKey(serviceName: string, params: any): string {
    const paramString = typeof params === 'string' ? params : JSON.stringify(params);
    return `${this.PREFIX}${serviceName}_${this.base64Encode(paramString)}`;
  }

  private base64Encode(str: string): string {
    try {
      return btoa(unescape(encodeURIComponent(str))).substring(0, 32);
    } catch (e) {
      return str.substring(0, 32);
    }
  }

  /**
   * Stores an item in the cache with a TTL (in minutes)
   */
  set<T>(key: string, value: T, ttlMinutes: number): void {
    const entry: CacheEntry<T> = {
      value,
      expiry: Date.now() + ttlMinutes * 60 * 1000,
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      console.warn('Cache write failed (possibly quota exceeded):', e);
      // Fallback: clear old cache entries and try again
      this.clearExpired();
    }
  }

  /**
   * Retrieves an item from the cache
   */
  get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item) return null;

    try {
      const entry: CacheEntry<T> = JSON.parse(item);
      if (Date.now() > entry.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      // Found valid cache hit
      telemetryService.reportCacheHit(key.substring(0, 20));
      return entry.value;
    } catch (e) {
      localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Removes all expired items from localStorage
   */
  clearExpired(): void {
    const now = Date.now();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.PREFIX)) {
        try {
          const entry = JSON.parse(localStorage.getItem(key) || '');
          if (entry.expiry && now > entry.expiry) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Ignore invalid JSON
        }
      }
    }
  }

  /**
   * Clears the entire cache
   */
  clearAll(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }
}

export const cacheService = new CacheService();
