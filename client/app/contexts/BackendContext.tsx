'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export interface Backend {
  name: string;
  baseUrl: string;
}

interface BackendContextType {
  selectedBackend: Backend | null;
  setSelectedBackend: (backend: Backend) => void;
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export function BackendProvider({ children }: { children: React.ReactNode }) {
  const [selectedBackend, setSelectedBackend] = useState<Backend | null>(null);

  useEffect(() => {
    // Load selected backend from localStorage on mount
    const storedBackend = localStorage.getItem('selectedBackend');
    if (storedBackend) {
      setSelectedBackend(JSON.parse(storedBackend));
    }
  }, []);

  const handleSetBackend = (backend: Backend) => {
    localStorage.setItem('selectedBackend', JSON.stringify(backend));
    setSelectedBackend(backend);
  };

  return (
    <BackendContext.Provider value={{ selectedBackend, setSelectedBackend: handleSetBackend }}>
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend() {
  const context = useContext(BackendContext);
  if (context === undefined) {
    throw new Error('useBackend must be used within a BackendProvider');
  }
  return context;
} 