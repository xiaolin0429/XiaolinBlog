import { Tool, ToolContext, ToolManagerConfig, ToolState } from '../types/tool-types';
import { toolRegistry } from '../base/ToolRegistry';

export class ToolManager {
  private config: ToolManagerConfig;
  private toolStates = new Map<string, ToolState>();

  constructor(config: ToolManagerConfig = {}) {
    this.config = config;
  }

  // 执行工具
  async executeTool(toolId: string, context: ToolContext, data?: any): Promise<void> {
    const tool = toolRegistry.get(toolId);
    if (!tool) {
      console.warn(`Tool ${toolId} not found`);
      return;
    }

    // 检查工具是否可执行
    if (tool.handler.canExecute && !tool.handler.canExecute(context)) {
      return;
    }

    // 执行工具
    await tool.handler.execute(context, data);
  }

  // 获取工具状态
  getToolState(toolId: string, context: ToolContext): ToolState {
    const tool = toolRegistry.get(toolId);
    if (!tool) {
      return { disabled: true, visible: false };
    }

    // 合并配置状态和工具自身状态
    const configState = this.toolStates.get(toolId) || {};
    const toolState = tool.handler.getState ? tool.handler.getState(context) : {};
    
    return {
      ...toolState,
      ...configState,
      // 应用配置中的启用/禁用设置
      disabled: this.isToolDisabled(toolId) || toolState.disabled || configState.disabled,
      visible: this.isToolVisible(toolId) && (toolState.visible !== false) && (configState.visible !== false)
    };
  }

  // 设置工具状态
  setToolState(toolId: string, state: Partial<ToolState>): void {
    const currentState = this.toolStates.get(toolId) || {};
    this.toolStates.set(toolId, { ...currentState, ...state });
  }

  // 获取可用工具列表
  getAvailableTools(): Tool[] {
    return toolRegistry.getAll().filter(tool => this.isToolVisible(tool.id));
  }

  // 按组获取工具
  getToolsByGroup(group: string): Tool[] {
    return toolRegistry.getByGroup(group).filter(tool => this.isToolVisible(tool.id));
  }

  // 检查工具是否被禁用
  private isToolDisabled(toolId: string): boolean {
    const { disabledTools = [] } = this.config;
    return disabledTools.includes(toolId);
  }

  // 检查工具是否可见
  private isToolVisible(toolId: string): boolean {
    const { enabledTools, disabledTools = [] } = this.config;
    
    // 如果有启用列表，只显示列表中的工具
    if (enabledTools && enabledTools.length > 0) {
      return enabledTools.includes(toolId);
    }
    
    // 否则显示所有未被禁用的工具
    return !disabledTools.includes(toolId);
  }

  // 更新配置
  updateConfig(config: Partial<ToolManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}