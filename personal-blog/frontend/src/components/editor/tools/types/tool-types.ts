import { LucideIcon } from 'lucide-react';

// 工具基础接口
export interface BaseTool {
  id: string;
  name: string;
  icon: LucideIcon;
  title: string;
  shortcut?: string;
  group: string;
  order: number;
}

// 工具处理器接口
export interface ToolHandler {
  execute(context: ToolContext, data?: any): Promise<void> | void;
  canExecute?(context: ToolContext): boolean;
  getState?(context: ToolContext): ToolState;
}

// 工具上下文
export interface ToolContext {
  textarea: HTMLTextAreaElement;
  value: string;
  selectionStart: number;
  selectionEnd: number;
  onChange: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
}

// 工具状态
export interface ToolState {
  active?: boolean;
  disabled?: boolean;
  visible?: boolean;
}

// 简单工具配置
export interface SimpleTool extends BaseTool {
  type: 'simple';
  handler: ToolHandler;
}

// 对话框工具配置
export interface DialogTool extends BaseTool {
  type: 'dialog';
  handler: ToolHandler;
  dialogComponent: React.ComponentType<DialogToolProps>;
}

// 面板工具配置
export interface PanelTool extends BaseTool {
  type: 'panel';
  handler: ToolHandler;
  panelComponent: React.ComponentType<PanelToolProps>;
}

// 工具联合类型
export type Tool = SimpleTool | DialogTool | PanelTool;

// 对话框工具属性
export interface DialogToolProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: any) => void;
  initialData?: any;
}

// 面板工具属性
export interface PanelToolProps {
  context: ToolContext;
  onAction: (action: string, data?: any) => void;
}

// 工具注册表
export interface ToolRegistry {
  register(tool: Tool): void;
  unregister(toolId: string): void;
  get(toolId: string): Tool | undefined;
  getByGroup(group: string): Tool[];
  getAll(): Tool[];
}

// 工具管理器配置
export interface ToolManagerConfig {
  enabledTools?: string[];
  disabledTools?: string[];
  toolOrder?: Record<string, number>;
  groupOrder?: Record<string, number>;
}