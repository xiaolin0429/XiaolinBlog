"use client"

import { createContext, useContext, ReactNode } from 'react';
import { ToolManager } from './ToolManager';
import { ToolManagerConfig } from '../types/tool-types';

interface ToolContextValue {
  toolManager: ToolManager;
}

const ToolContext = createContext<ToolContextValue | null>(null);

interface ToolProviderProps {
  children: ReactNode;
  config?: ToolManagerConfig;
}

export function ToolProvider({ children, config = {} }: ToolProviderProps) {
  const toolManager = new ToolManager(config);

  return (
    <ToolContext.Provider value={{ toolManager }}>
      {children}
    </ToolContext.Provider>
  );
}

export function useToolContext(): ToolContextValue {
  const context = useContext(ToolContext);
  if (!context) {
    throw new Error('useToolContext must be used within a ToolProvider');
  }
  return context;
}