import { useState, useCallback } from 'react';
import { jiraApi } from '@/services/api';
import type { JiraTicket, JiraConfig, ConnectionTestResult } from '@/types';

interface UseJiraReturn {
  ticket: JiraTicket | null;
  isLoading: boolean;
  error: string | null;
  fetchTicket: (ticketId: string) => Promise<void>;
  testConnection: (config: JiraConfig) => Promise<ConnectionTestResult>;
  clearTicket: () => void;
  clearError: () => void;
}

export function useJira(): UseJiraReturn {
  const [ticket, setTicket] = useState<JiraTicket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = useCallback(async (ticketId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate ticket ID format
      const trimmedId = ticketId.trim().toUpperCase();
      if (!trimmedId) {
        throw new Error('Please enter a ticket ID');
      }

      // Basic JIRA key validation (e.g., PROJ-123)
      const jiraKeyPattern = /^[A-Z][A-Z0-9]*-\d+$/;
      if (!jiraKeyPattern.test(trimmedId)) {
        throw new Error('Invalid ticket ID format. Expected format: PROJECT-123');
      }

      const fetchedTicket = await jiraApi.fetchTicket(trimmedId);
      setTicket(fetchedTicket);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ticket';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testConnection = useCallback(async (config: JiraConfig): Promise<ConnectionTestResult> => {
    try {
      const result = await jiraApi.testConnection(config);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed';
      throw new Error(errorMessage);
    }
  }, []);

  const clearTicket = useCallback(() => {
    setTicket(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    ticket,
    isLoading,
    error,
    fetchTicket,
    testConnection,
    clearTicket,
    clearError,
  };
}
