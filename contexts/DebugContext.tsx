import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';

interface DebugContextType {
  isOpen: boolean;
  togglePanel: () => void;
  debugData: Record<string, any>;
  setDebugData: (key: string, value: any) => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export const DebugProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugData, setDebugDataState] = useState<Record<string, any>>({});

  const togglePanel = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const setDebugData = useCallback((key: string, value: any) => {
    setDebugDataState(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  const value = useMemo(() => ({
      isOpen,
      togglePanel,
      debugData,
      setDebugData
  }), [isOpen, togglePanel, debugData, setDebugData]);

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  );
};

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
};
