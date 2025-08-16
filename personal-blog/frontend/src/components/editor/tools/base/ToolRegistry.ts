import { Tool, ToolRegistry as IToolRegistry } from '../types/tool-types';

export class ToolRegistry implements IToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.id, tool);
  }

  unregister(toolId: string): void {
    this.tools.delete(toolId);
  }

  get(toolId: string): Tool | undefined {
    return this.tools.get(toolId);
  }

  getByGroup(group: string): Tool[] {
    return Array.from(this.tools.values())
      .filter(tool => tool.group === group)
      .sort((a, b) => a.order - b.order);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values())
      .sort((a, b) => {
        // 先按组排序，再按顺序排序
        if (a.group !== b.group) {
          return a.group.localeCompare(b.group);
        }
        return a.order - b.order;
      });
  }

  getGroups(): string[] {
    const groups = new Set<string>();
    this.tools.forEach(tool => groups.add(tool.group));
    return Array.from(groups).sort();
  }
}

// 全局工具注册表实例
export const toolRegistry = new ToolRegistry();