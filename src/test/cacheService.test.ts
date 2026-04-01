import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheService } from '../services/cacheService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'btoa', { value: (str: string) => Buffer.from(str).toString('base64') });
Object.defineProperty(global, 'unescape', { value: (str: string) => str });

describe('CacheService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should generate a deterministic key', () => {
    const key1 = cacheService.getKey('test', { a: 1 });
    const key2 = cacheService.getKey('test', { a: 1 });
    const key3 = cacheService.getKey('test', { a: 2 });

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key1).toContain('trading_agents_cache_test_');
  });

  it('should set and get values correctly', () => {
    const key = 'test_key';
    const data = { foo: 'bar' };
    
    cacheService.set(key, data, 10);
    const retrieved = cacheService.get(key);
    
    expect(retrieved).toEqual(data);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should return null for expired items', () => {
    const key = 'expired_key';
    const data = { old: 'data' };
    
    // Set with 0 TTL to expire immediately
    cacheService.set(key, data, -1);
    
    const retrieved = cacheService.get(key);
    expect(retrieved).toBeNull();
  });

  it('should clear all items with prefix', () => {
    cacheService.set(cacheService.getKey('s1', {}), { v: 1 }, 10);
    cacheService.set(cacheService.getKey('s2', {}), { v: 2 }, 10);
    localStorage.setItem('other_key', 'some_value');

    cacheService.clearAll();

    expect(localStorage.length).toBe(1);
    expect(localStorage.getItem('other_key')).toBe('some_value');
  });

  it('should handle JSON parse errors gracefully', () => {
    const key = cacheService.getKey('bad', {});
    localStorage.setItem(key, 'invalid-json');

    const retrieved = cacheService.get(key);
    expect(retrieved).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith(key);
  });
});
