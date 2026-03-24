import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  JiraTicket,
  JiraConfig,
  LLMConfig,
  Template,
  TestPlan,
  GenerateTestPlanRequest,
  GenerationStatus,
  ApiResponse,
  ConnectionTestResult,
  OllamaModel,
  TemplateUploadResponse,
  PaginatedResponse,
  HistoryFilters,
} from '@/types';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes timeout for generation
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
    console.error('[API Error]', errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
);

// JIRA API
export const jiraApi = {
  fetchTicket: async (ticketId: string): Promise<JiraTicket> => {
    const response = await apiClient.get<ApiResponse<JiraTicket>>(`/jira/ticket/${ticketId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch ticket');
    }
    return response.data.data;
  },

  testConnection: async (config: JiraConfig): Promise<ConnectionTestResult> => {
    const response = await apiClient.post<ApiResponse<ConnectionTestResult>>(
      '/jira/test-connection',
      config
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Connection test failed');
    }
    return response.data.data;
  },
};

// Settings API
export const settingsApi = {
  getSettings: async (): Promise<{ jira: JiraConfig; llm: LLMConfig }> => {
    const response = await apiClient.get<ApiResponse<{ jira: JiraConfig; llm: LLMConfig }>>(
      '/settings'
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch settings');
    }
    return response.data.data;
  },

  saveJiraConfig: async (config: JiraConfig): Promise<void> => {
    const response = await apiClient.post<ApiResponse<void>>('/settings/jira', config);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to save JIRA config');
    }
  },

  saveLLMConfig: async (config: LLMConfig): Promise<void> => {
    const response = await apiClient.post<ApiResponse<void>>('/settings/llm', config);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to save LLM config');
    }
  },

  testLLMConnection: async (config: LLMConfig): Promise<ConnectionTestResult> => {
    const response = await apiClient.post<ApiResponse<ConnectionTestResult>>(
      '/settings/test-llm',
      config
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'LLM connection test failed');
    }
    return response.data.data;
  },
};

// Templates API
export const templatesApi = {
  getTemplates: async (): Promise<Template[]> => {
    const response = await apiClient.get<ApiResponse<Template[]>>('/templates');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch templates');
    }
    return response.data.data;
  },

  uploadTemplate: async (file: File): Promise<TemplateUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<TemplateUploadResponse>>(
      '/templates/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to upload template');
    }
    return response.data.data;
  },

  deleteTemplate: async (templateId: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/templates/${templateId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete template');
    }
  },

  setActiveTemplate: async (templateId: string): Promise<void> => {
    const response = await apiClient.post<ApiResponse<void>>(`/templates/${templateId}/activate`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to activate template');
    }
  },
};

// LLM API
export const llmApi = {
  getOllamaModels: async (baseUrl: string): Promise<OllamaModel[]> => {
    const response = await apiClient.post<ApiResponse<OllamaModel[]>>('/llm/ollama-models', {
      baseUrl,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch Ollama models');
    }
    return response.data.data;
  },
};

// Test Plan API
export const testPlanApi = {
  generate: async (request: GenerateTestPlanRequest): Promise<TestPlan> => {
    const response = await apiClient.post<ApiResponse<TestPlan>>(
      '/test-plans/generate',
      request
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to generate test plan');
    }
    return response.data.data;
  },

  generateStream: async (
    request: GenerateTestPlanRequest,
    onStatus: (status: GenerationStatus) => void
  ): Promise<TestPlan> => {
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(
        `${apiClient.defaults.baseURL}/test-plans/generate-stream?request=${encodeURIComponent(
          JSON.stringify(request)
        )}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'status') {
            onStatus(data.status);
          } else if (data.type === 'complete') {
            eventSource.close();
            resolve(data.testPlan);
          } else if (data.type === 'error') {
            eventSource.close();
            reject(new Error(data.error));
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        eventSource.close();
        reject(new Error('Stream connection failed'));
      };

      // Timeout after 5 minutes
      setTimeout(() => {
        eventSource.close();
        reject(new Error('Generation timeout'));
      }, 300000);
    });
  },

  getHistory: async (
    filters?: HistoryFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<TestPlan>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.ticketKey) params.append('ticketKey', filters.ticketKey);

    const response = await apiClient.get<ApiResponse<PaginatedResponse<TestPlan>>>(
      `/test-plans/history?${params.toString()}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch history');
    }
    return response.data.data;
  },

  getById: async (id: string): Promise<TestPlan> => {
    const response = await apiClient.get<ApiResponse<TestPlan>>(`/test-plans/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch test plan');
    }
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/test-plans/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete test plan');
    }
  },

  export: async (id: string, format: 'markdown' | 'pdf'): Promise<Blob> => {
    const response = await apiClient.get(`/test-plans/${id}/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<{ status: string; version: string }> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

export default apiClient;
