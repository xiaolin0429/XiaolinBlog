"use client"

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tool, ToolContext, ToolState } from '../types/tool-types';

interface BaseToolProps {
  tool: Tool;
  context: ToolContext;
  state?: ToolState;
  onClick: (toolId: string, data?: any) => void;
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export function BaseTool({ 
  tool, 
  context,
  state = {},
  onClick, 
  className,
  showLabel = false,
  compact = false
}: BaseToolProps) {
  const Icon = tool.icon;
  
  const handleClick = () => {
    if (tool.handler.canExecute && !tool.handler.canExecute(context)) {
      return;
    }
    onClick(tool.id);
  };

  const isActive = state.active || (tool.handler.getState && tool.handler.getState(context)?.active);
  const isDisabled = state.disabled || (tool.handler.getState && tool.handler.getState(context)?.disabled);
  const isVisible = state.visible !== false && (tool.handler.getState ? tool.handler.getState(context)?.visible !== false : true);

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      size={compact ? "sm" : "sm"}
      onClick={handleClick}
      disabled={isDisabled}
      title={`${tool.title}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
      className={cn(
        "h-8 transition-colors",
        compact ? "w-8 p-0" : showLabel ? "px-3" : "w-8 p-0",
        isActive && "bg-primary text-primary-foreground",
        className
      )}
    >
      <Icon className={cn(
        "h-4 w-4",
        showLabel && "mr-2"
      )} />
      {showLabel && (
        <span className="text-xs">{tool.name}</span>
      )}
    </Button>
  );
}