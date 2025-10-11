import { useState, useEffect, useCallback } from 'react';

export interface SavedView {
  id: string;
  name: string;
  filters: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  createdAt: string;
  updatedAt: string;
}

interface UseSavedViewsReturn {
  views: SavedView[];
  currentView: SavedView | null;
  saveView: (name: string, filters: Record<string, any>, sortBy?: string, sortOrder?: 'asc' | 'desc') => void;
  loadView: (viewId: string) => void;
  deleteView: (viewId: string) => void;
  updateView: (viewId: string, updates: Partial<SavedView>) => void;
  clearCurrentView: () => void;
}

const STORAGE_KEY = 'skills-saved-views';
const CURRENT_VIEW_KEY = 'skills-current-view';

export const useSavedViews = (namespace: string = 'default'): UseSavedViewsReturn => {
  const storageKey = `${STORAGE_KEY}-${namespace}`;
  const currentViewKey = `${CURRENT_VIEW_KEY}-${namespace}`;

  const [views, setViews] = useState<SavedView[]>([]);
  const [currentView, setCurrentView] = useState<SavedView | null>(null);

  // Load views from localStorage on mount
  useEffect(() => {
    try {
      const savedViews = localStorage.getItem(storageKey);
      if (savedViews) {
        setViews(JSON.parse(savedViews));
      }

      const savedCurrentView = localStorage.getItem(currentViewKey);
      if (savedCurrentView) {
        setCurrentView(JSON.parse(savedCurrentView));
      }
    } catch (error) {
      console.error('Error loading saved views:', error);
    }
  }, [storageKey, currentViewKey]);

  // Save views to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(views));
    } catch (error) {
      console.error('Error saving views:', error);
    }
  }, [views, storageKey]);

  // Save current view to localStorage whenever it changes
  useEffect(() => {
    try {
      if (currentView) {
        localStorage.setItem(currentViewKey, JSON.stringify(currentView));
      } else {
        localStorage.removeItem(currentViewKey);
      }
    } catch (error) {
      console.error('Error saving current view:', error);
    }
  }, [currentView, currentViewKey]);

  const saveView = useCallback((
    name: string,
    filters: Record<string, any>,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ) => {
    const newView: SavedView = {
      id: `view-${Date.now()}`,
      name,
      filters,
      sortBy,
      sortOrder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setViews(prev => [...prev, newView]);
    setCurrentView(newView);
  }, []);

  const loadView = useCallback((viewId: string) => {
    const view = views.find(v => v.id === viewId);
    if (view) {
      setCurrentView(view);
    }
  }, [views]);

  const deleteView = useCallback((viewId: string) => {
    setViews(prev => prev.filter(v => v.id !== viewId));
    if (currentView?.id === viewId) {
      setCurrentView(null);
    }
  }, [currentView]);

  const updateView = useCallback((viewId: string, updates: Partial<SavedView>) => {
    setViews(prev => prev.map(v => 
      v.id === viewId
        ? { ...v, ...updates, updatedAt: new Date().toISOString() }
        : v
    ));

    if (currentView?.id === viewId) {
      setCurrentView(prev => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null);
    }
  }, [currentView]);

  const clearCurrentView = useCallback(() => {
    setCurrentView(null);
  }, []);

  return {
    views,
    currentView,
    saveView,
    loadView,
    deleteView,
    updateView,
    clearCurrentView,
  };
};

// Hook for high contrast mode
export const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('high-contrast-mode');
    if (saved === 'true') {
      setIsHighContrast(true);
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast(prev => {
      const newValue = !prev;
      localStorage.setItem('high-contrast-mode', String(newValue));
      
      if (newValue) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
      
      return newValue;
    });
  }, []);

  return { isHighContrast, toggleHighContrast };
};

