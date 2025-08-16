// 导出所有工具类型
export * from './types/tool-types';

// 导出基础组件和服务 (使用别名避免冲突)
export { BaseTool as BaseToolComponent } from './base/BaseTool';
export * from './manager/ToolManager';
export * from './manager/ToolContext';
export * from './manager/useToolHandler';

// 文本格式化工具
export * from './text/BoldTool';
export * from './text/ItalicTool';
export * from './text/UnderlineTool';
export * from './text/StrikethroughTool';
export * from './text/InlineCodeTool';

// 标题工具
export * from './heading/HeadingTools';

// 插入工具
export * from './insert/QuoteTool';
export * from './insert/ListTools';
export * from './insert/link/LinkTool';
export * from './insert/code-block/CodeBlockTool';
export * from './insert/table/TableTool';

// 工具注册
import { toolRegistry } from './base/ToolRegistry';
import { boldTool } from './text/BoldTool';
import { italicTool } from './text/ItalicTool';
import { underlineTool } from './text/UnderlineTool';
import { strikethroughTool } from './text/StrikethroughTool';
import { inlineCodeTool } from './text/InlineCodeTool';
import { heading1Tool, heading2Tool, heading3Tool } from './heading/HeadingTools';
import { quoteTool } from './insert/QuoteTool';
import { unorderedListTool, orderedListTool } from './insert/ListTools';
import { linkTool } from './insert/link/LinkTool';
import { codeBlockTool } from './insert/code-block/CodeBlockTool';
import { tableTool } from './insert/table/TableTool';

// 注册所有工具
export function registerAllTools() {
  // 文本格式化工具
  toolRegistry.register(boldTool);
  toolRegistry.register(italicTool);
  toolRegistry.register(underlineTool);
  toolRegistry.register(strikethroughTool);
  toolRegistry.register(inlineCodeTool);
  
  // 标题工具
  toolRegistry.register(heading1Tool);
  toolRegistry.register(heading2Tool);
  toolRegistry.register(heading3Tool);
  
  // 插入工具
  toolRegistry.register(quoteTool);
  toolRegistry.register(unorderedListTool);
  toolRegistry.register(orderedListTool);
  toolRegistry.register(linkTool);
  toolRegistry.register(codeBlockTool);
  toolRegistry.register(tableTool);
}

// 自动注册所有工具
registerAllTools();