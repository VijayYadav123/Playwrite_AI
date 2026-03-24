import { useState, useCallback } from 'react';
import { settingsApi, llmApi } from '@/services/api';
import type { LLMConfig, LLMProvider, OllamaModel, ConnectionTestResult } from '@/types';

interface UseLLMReturn {
  config: LLMConfig | null;
  isLoading: boolean;
  error: string | null;
  ollamaModels: OllamaModel[];
  isLoadingModels: boolean;
  saveConfig: (config: LLMConfig) => Promise<void>;
  testConnection: (config: LLMConfig) => Promise<ConnectionTestResult>;
  fetchOllamaModels: (baseUrl: string) => Promise<void>;
  fetchConfig: () => Promise<void>;
  clearError: () => void;
}

const defaultConfig: LLMConfig = {
  provider: 'groq',
  groq: {
    apiKey: '',
    model: 'llama3-70b-8192',
  },
  isConfigured: false,
};

export function useLLM(): UseLLMReturn {
  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const settings = await settingsApi.getSettings();
      setConfig(settings.llm);
    } catch (err) {
      // If settings don't exist, use default
      setConfig(defaultConfig);
    }
  }, []);

  const saveConfig = useCallback(async (newConfig: LLMConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate config based on provider
      if (newConfig.provider === 'groq') {
        if (!newConfig.groq?.apiKey) {
          throw new Error('Groq API key is required');
        }
        if (!newConfig.groq?.model) {
          throw new Error('Please select a model');
        }
      } else if (newConfig.provider === 'ollama') {
        if (!newConfig.ollama?.baseUrl) {
          throw new Error('Ollama base URL is required');
        }
        if (!newConfig.ollama?.model) {
          throw new Error('Please select a model');
        }
      }

      await settingsApi.saveLLMConfig({
        ...newConfig,
        isConfigured: true,
      });
      setConfig(newConfig);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testConnection = useCallback(async (testConfig: LLMConfig): Promise<ConnectionTestResult> => {
    try {
      const result = await settingsApi.testLLMConnection(testConfig);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed';
      throw new Error(errorMessage);
    }
  }, []);

  const fetchOllamaModels = useCallback(async (baseUrl: string) => {
    setIsLoadingModels(true);
    setError(null);

    try {
      if (!baseUrl) {
        throw new Error('Please enter Ollama base URL');
      }

      // Validate URL format
      let url = baseUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
      }

      const models = await llmApi.getOllamaModels(url);
      setOllamaModels(models);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Ollama models';
      setError(errorMessage);
      setOllamaModels([]);
      throw err;
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    config,
    isLoading,
    error,
    ollamaModels,
    isLoadingModels,
    saveConfig,
    testConnection,
    fetchOllamaModels,
    fetchConfig,
    clearError,
  };
}
