import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Get stored value or use initial
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Update localStorage when state changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Save to state
        setStoredValue(valueToStore);
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Listen for changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        setStoredValue(JSON.parse(event.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

// Specialized hook for recent tickets
interface RecentTicket {
  key: string;
  summary: string;
  timestamp: number;
}

export function useRecentTickets(maxItems: number = 10) {
  const [recentTickets, setRecentTickets] = useLocalStorage<RecentTicket[]>('recent-tickets', []);

  const addRecentTicket = useCallback(
    (key: string, summary: string) => {
      setRecentTickets((prev) => {
        // Remove if already exists
        const filtered = prev.filter((t) => t.key !== key);
        // Add to beginning
        const updated = [
          { key, summary, timestamp: Date.now() },
          ...filtered,
        ].slice(0, maxItems);
        return updated;
      });
    },
    [setRecentTickets, maxItems]
  );

  const removeRecentTicket = useCallback(
    (key: string) => {
      setRecentTickets((prev) => prev.filter((t) => t.key !== key));
    },
    [setRecentTickets]
  );

  const clearRecentTickets = useCallback(() => {
    setRecentTickets([]);
  }, [setRecentTickets]);

  return {
    recentTickets,
    addRecentTicket,
    removeRecentTicket,
    clearRecentTickets,
  };
}

// Hook for UI preferences (safe to store)
export function useUIPreferences() {
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('sidebar-collapsed', false);
  const [lastUsedTemplate, setLastUsedTemplate] = useLocalStorage<string | null>(
    'last-used-template',
    null
  );
  const [dashboardView, setDashboardView] = useLocalStorage<'split' | 'full'>('dashboard-view', 'split');

  return {
    sidebarCollapsed,
    setSidebarCollapsed,
    lastUsedTemplate,
    setLastUsedTemplate,
    dashboardView,
    setDashboardView,
  };
}
