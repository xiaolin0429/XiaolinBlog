"use client"

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { BaseToolComponent as BaseTool } from '../index';
import { useToolHandler } from '../manager/useToolHandler';
import { ToolContext, DialogTool, Tool } from '../types/tool-types';
import { linkHandler } from '../insert/link/LinkTool';
import { codeBlockHandler } from '@/components/editor/tools';
import { tableHandler } from '../insert/table/TableTool';
import { LinkDialog } from '../insert/link/LinkDialog';
import { CodeBlockDialog } from '../insert/code-block/CodeBlockDialog';
import { TableDialog } from '../insert/table/TableDialog';
import { ToolbarSeparator } from './ToolbarSeparator';

interface ToolbarProps {
  context: ToolContext;
  className?: string;
  showLabels?: boolean;
  compact?: boolean;
  position?: 'top' | 'bottom' | 'floating';
}

export function Toolbar({
  context,
  className,
  showLabels = false,
  compact = false,
  position = 'top'
}: ToolbarProps) {
  const { executeTool, getToolState, getToolsByGroup } = useToolHandler({ context });
  
  // 对话框状态
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [dialogData, setDialogData] = useState<any>(null);

  // 工具分组
  const formatTools = getToolsByGroup('format');
  const headingTools = getToolsByGroup('heading');
  const insertTools = getToolsByGroup('insert');

  // 处理工具点击
  const handleToolClick = useCallback(async (toolId: string, data?: any) => {
    const tool = [...formatTools, ...headingTools, ...insertTools].find(t => t.id === toolId);
    
    if (tool?.type === 'dialog') {
      const dialogTool = tool as DialogTool;
      
      // 设置对话框处理器
      if (toolId === 'link') {
        linkHandler.setDialogHandler((data) => {
          setDialogData(data);
          setActiveDialog(toolId);
        });
      } else if (toolId === 'code-block') {
        codeBlockHandler.setDialogHandler((data) => {
          setDialogData(data);
          setActiveDialog(toolId);
        });
      } else if (toolId === 'table') {
        tableHandler.setDialogHandler((data) => {
          setDialogData(data);
          setActiveDialog(toolId);
        });
      }
    }
    
    await executeTool(toolId, data);
  }, [executeTool, formatTools, headingTools, insertTools]);

  // 处理对话框确认
  const handleDialogConfirm = useCallback(async (data: any) => {
    if (activeDialog) {
      await executeTool(activeDialog, data);
      setActiveDialog(null);
      setDialogData(null);
    }
  }, [activeDialog, executeTool]);

  // 处理对话框关闭
  const handleDialogClose = useCallback(() => {
    setActiveDialog(null);
    setDialogData(null);
  }, []);

  // 渲染工具组
  const renderToolGroup = (tools: Tool[], groupName: string) => {
    if (tools.length === 0) return null;

    return (
      <div key={groupName} className="flex items-center gap-0.5">
        {tools.map((tool) => (
          <BaseTool
            key={tool.id}
            tool={tool}
            context={context}
            state={getToolState(tool.id)}
            onClick={handleToolClick}
            showLabel={showLabels}
            compact={compact}
          />
        ))}
        <ToolbarSeparator />
      </div>
    );
  };

  return (
    <>
      <div className={cn(
        "flex items-center gap-1 p-2 border-b bg-muted/30",
        position === 'bottom' && "border-t border-b-0",
        position === 'floating' && "border rounded-lg shadow-sm bg-background",
        compact && "p-1",
        className
      )}>
        {renderToolGroup(formatTools, 'format')}
        {renderToolGroup(headingTools, 'heading')}
        {renderToolGroup(insertTools, 'insert')}
      </div>

      {/* 链接对话框 */}
      <LinkDialog
        open={activeDialog === 'link'}
        onOpenChange={handleDialogClose}
        onConfirm={handleDialogConfirm}
        initialData={dialogData}
      />

      {/* 代码块对话框 */}
      <CodeBlockDialog
        open={activeDialog === 'code-block'}
        onOpenChange={handleDialogClose}
        onConfirm={handleDialogConfirm}
        initialData={dialogData}
      />

      {/* 表格对话框 */}
      <TableDialog
        open={activeDialog === 'table'}
        onOpenChange={handleDialogClose}
        onConfirm={handleDialogConfirm}
        initialData={dialogData}
      />
    </>
  );
}