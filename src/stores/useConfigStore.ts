import { create } from 'zustand';
import { GeminiConfig } from '../types';

interface ConfigState {
  geminiConfig: GeminiConfig;
  setGeminiConfig: (config: GeminiConfig) => void;
  config: GeminiConfig;
  setConfig: (config: GeminiConfig) => void;
  tokenUsage: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
  addTokenUsage: (usage: { promptTokens?: number, candidatesTokens?: number, totalTokens?: number }) => void;
  availableModels: { id: string, name: string, description: string }[];
  setAvailableModels: (models: { id: string, name: string, description: string }[]) => void;
  feishuWebhook: string;
  setFeishuWebhook: (webhook: string) => void;
  cachingEnabled: boolean;
  toggleCaching: (enabled: boolean) => void;
}

export const useConfigStore = create<ConfigState>((set) => {
  const initialConfig = (() => {
    try {
      const saved = localStorage.getItem('gemini_config');
      return saved ? JSON.parse(saved) : { model: 'gemini-3-flash-preview' };
    } catch (e) {
      console.error('Failed to parse gemini_config from localStorage:', e);
      return { model: 'gemini-3-flash-preview' };
    }
  })();

  return {
    geminiConfig: initialConfig,
    config: initialConfig,
    tokenUsage: { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 },
    availableModels: [],
    setAvailableModels: (models) => set({ availableModels: models }),
    addTokenUsage: (usage) => set((state) => ({
      tokenUsage: {
        promptTokens: state.tokenUsage.promptTokens + (usage.promptTokens || 0),
        candidatesTokens: state.tokenUsage.candidatesTokens + (usage.candidatesTokens || 0),
        totalTokens: state.tokenUsage.totalTokens + (usage.totalTokens || 0),
      }
    })),
    setGeminiConfig: (config) => {
      localStorage.setItem('gemini_config', JSON.stringify(config));
      set({ geminiConfig: config, config: config });
    },
    setConfig: (config) => {
      localStorage.setItem('gemini_config', JSON.stringify(config));
      set({ geminiConfig: config, config: config });
    },
    feishuWebhook: localStorage.getItem('feishu_webhook') || '',
    setFeishuWebhook: (webhook) => {
      localStorage.setItem('feishu_webhook', webhook);
      set({ feishuWebhook: webhook });
    },
    cachingEnabled: localStorage.getItem('caching_enabled') !== 'false',
    toggleCaching: (enabled) => {
      localStorage.setItem('caching_enabled', enabled.toString());
      set({ cachingEnabled: enabled });
      set((state) => ({
        config: { ...state.config, cachingEnabled: enabled },
        geminiConfig: { ...state.geminiConfig, cachingEnabled: enabled }
      }));
    }
  };
});
