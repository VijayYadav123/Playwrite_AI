import { useState, useCallback, useEffect } from 'react';
import { templatesApi } from '@/services/api';
import type { Template, TemplateUploadResponse } from '@/types';

interface UseTemplatesReturn {
  templates: Template[];
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
  fetchTemplates: () => Promise<void>;
  uploadTemplate: (file: File) => Promise<TemplateUploadResponse>;
  deleteTemplate: (templateId: string) => Promise<void>;
  setActiveTemplate: (templateId: string) => Promise<void>;
  clearError: () => void;
  getActiveTemplate: () => Template | undefined;
}

export function useTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedTemplates = await templatesApi.getTemplates();
      setTemplates(fetchedTemplates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch templates';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadTemplate = useCallback(async (file: File): Promise<TemplateUploadResponse> => {
    setUploadProgress(0);
    setError(null);

    try {
      // Validate file type
      const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
      const allowedExtensions = ['.pdf', '.txt', '.md'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        throw new Error('Invalid file type. Please upload PDF, TXT, or MD files.');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit.');
      }

      // Simulate progress (actual progress tracking would require XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await templatesApi.uploadTemplate(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Refresh templates list
      await fetchTemplates();

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload template';
      setError(errorMessage);
      throw err;
    } finally {
      setTimeout(() => setUploadProgress(0), 500);
    }
  }, [fetchTemplates]);

  const deleteTemplate = useCallback(async (templateId: string) => {
    setError(null);

    try {
      await templatesApi.deleteTemplate(templateId);
      await fetchTemplates();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      setError(errorMessage);
      throw err;
    }
  }, [fetchTemplates]);

  const setActiveTemplate = useCallback(async (templateId: string) => {
    setError(null);

    try {
      await templatesApi.setActiveTemplate(templateId);
      await fetchTemplates();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate template';
      setError(errorMessage);
      throw err;
    }
  }, [fetchTemplates]);

  const getActiveTemplate = useCallback(() => {
    return templates.find((t) => t.isActive);
  }, [templates]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    isLoading,
    error,
    uploadProgress,
    fetchTemplates,
    uploadTemplate,
    deleteTemplate,
    setActiveTemplate,
    clearError,
    getActiveTemplate,
  };
}
