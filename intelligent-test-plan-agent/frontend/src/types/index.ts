// JIRA Types
export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  description: string;
  priority: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
  status: string;
  issueType: string;
  assignee?: string;
  reporter?: string;
  created?: string;
  updated?: string;
  labels?: string[];
  components?: string[];
  fixVersions?: string[];
  attachments?: JiraAttachment[];
  comments?: JiraComment[];
  subtasks?: JiraSubtask[];
  url?: string;
}

export interface JiraAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
}

export interface JiraComment {
  id: string;
  author: string;
  body: string;
  created: string;
}

export interface JiraSubtask {
  id: string;
  key: string;
  summary: string;
  status: string;
}

export interface JiraConfig {
  baseUrl: string;
  username: string;
  apiToken: string;
  isConfigured: boolean;
}

// LLM Types
export type LLMProvider = 'groq' | 'ollama';

export interface GroqConfig {
  apiKey: string;
  model: string;
}

export interface OllamaConfig {
  baseUrl: string;
  model: string;
}

export interface LLMConfig {
  provider: LLMProvider;
  groq?: GroqConfig;
  ollama?: OllamaConfig;
  isConfigured: boolean;
}

export const GROQ_MODELS = [
  { value: 'llama3-70b-8192', label: 'Llama 3 70B' },
  { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
  { value: 'gemma-7b-it', label: 'Gemma 7B' },
  { value: 'llama3-8b-8192', label: 'Llama 3 8B' },
] as const;

// Template Types
export interface Template {
  id: string;
  name: string;
  originalName: string;
  uploadDate: string;
  size: number;
  pageCount?: number;
  isActive: boolean;
}

export interface TemplateUploadResponse {
  success: boolean;
  template?: Template;
  message: string;
}

// Test Plan Types
export interface TestPlan {
  id: string;
  ticketKey: string;
  ticketSummary: string;
  content: string;
  createdAt: string;
  templateUsed?: string;
  metadata: TestPlanMetadata;
}

export interface TestPlanMetadata {
  jiraTicket: string;
  generatedAt: string;
  modelUsed: string;
  provider: LLMProvider;
  templateUsed?: string;
}

export interface GenerateTestPlanRequest {
  ticketId: string;
  templateId?: string;
  options?: GenerateOptions;
}

export interface GenerateOptions {
  includeEdgeCases?: boolean;
  includeRegression?: boolean;
  includePerformance?: boolean;
  includeSecurity?: boolean;
  customInstructions?: string;
}

// Generation Status
export type GenerationStep = 
  | 'idle'
  | 'fetching'
  | 'analyzing'
  | 'retrieving_context'
  | 'generating'
  | 'formatting'
  | 'complete'
  | 'error';

export interface GenerationStatus {
  step: GenerationStep;
  message: string;
  progress: number;
  error?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    version?: string;
    serverInfo?: string;
  };
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

// UI Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
}

// Settings Types
export interface AppSettings {
  jira: JiraConfig;
  llm: LLMConfig;
  recentTickets: string[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  autoSave: boolean;
  defaultTemplate?: string;
  exportFormat: 'markdown' | 'pdf' | 'both';
  theme: 'light' | 'dark' | 'system';
}

// History Types
export interface HistoryFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  ticketKey?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
