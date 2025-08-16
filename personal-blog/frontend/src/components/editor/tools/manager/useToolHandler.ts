"use client"

import { useCallback, useState, useEffect } from 'react';
import { ToolContext, ToolState } from '../types/tool-types';
import { useToolContext } from './ToolContext';

interface UseToolHandlerOptions {
  context: ToolContext;
  onStateChange?: (toolId: string, state: ToolState) => void;
}

interface UseToolHandlerReturn {
  executeTool: (toolId: string, data?: any) => Promise<void>;
  getToolState: (toolId: string) => ToolState;
  setToolState: (toolId: string, state: Partial<ToolState>) => void;
  getAvailableTools: () => import('../types/tool-types').Tool[];
  getToolsByGroup: (group: string) => import('../types/tool-types').Tool[];
}

export function useToolHandler({ 
  context, 
  onStateChange 
}: UseToolHandlerOptions): UseToolHandlerReturn {
  const { toolManager } = useToolContext();
  const [, forceUpdate] = useState({});

  // 强制重新渲染
  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  // 执行工具
  const executeTool = useCallback(async (toolId: string, data?: any) => {
    await toolManager.executeTool(toolId, context, data);
    triggerUpdate();
  }, [toolManager, context, triggerUpdate]);

  // 获取工具状态
  const getToolState = useCallback((toolId: string): ToolState => {
    return toolManager.getToolState(toolId, context);
  }, [toolManager, context]);

  // 设置工具状态
  const setToolState = useCallback((toolId: string, state: Partial<ToolState>) => {
    toolManager.setToolState(toolId, state);
    onStateChange?.(toolId, toolManager.getToolState(toolId, context));
    triggerUpdate();
  }, [toolManager, context, onStateChange, triggerUpdate]);

  // 获取可用工具
  const getAvailableTools = useCallback(() => {
    return toolManager.getAvailableTools();
  }, [toolManager]);

  // 按组获取工具
  const getToolsByGroup = useCallback((group: string) => {
    return toolManager.getToolsByGroup(group);
  }, [toolManager]);

  return {
    executeTool,
    getToolState,
    setToolState,
    getAvailableTools,
    getToolsByGroup
  };
}