"use client"

import { Code2 } from 'lucide-react';
import { DialogTool, ToolHandler, ToolContext } from '../../types/tool-types';
import { CodeBlockDialog } from './CodeBlockDialog';

export interface CodeBlockData {
  code: string;
  language: string;
  filename?: string;
  showLineNumbers?: boolean;
}

class CodeBlockToolHandler implements ToolHandler {
  private onOpenDialog?: (data: CodeBlockData) => void;

  setDialogHandler(handler: (data: CodeBlockData) => void) {
    this.onOpenDialog = handler;
  }

  execute(context: ToolContext, data?: CodeBlockData): void {
    if (data) {
      // 从对话框确认后执行插入
      this.insertCodeBlock(context, data);
    } else {
      // 打开对话框
      this.openCodeBlockDialog(context);
    }
  }

  private openCodeBlockDialog(context: ToolContext): void {
    const { value, selectionStart, selectionEnd } = context;
    const selectedText = value.substring(selectionStart, selectionEnd);
    
    // 检查选中文本是否已经是代码块
    const codeBlockMatch = selectedText.match(/^```(\w+)?\n([\s\S]*?)\n```$/);
    
    const initialData: CodeBlockData = codeBlockMatch 
      ? { 
          code: codeBlockMatch[2], 
          language: codeBlockMatch[1] || 'text',
          showLineNumbers: false
        }
      : { 
          code: selectedText, 
          language: 'javascript',
          showLineNumbers: false
        };
    
    this.onOpenDialog?.(initialData);
  }

  private insertCodeBlock(context: ToolContext, data: CodeBlockData): void {
    const { textarea, value, selectionStart, selectionEnd, onChange } = context;
    
    let codeBlockText = `\n\`\`\`${data.language}\n${data.code}\n\`\`\`\n`;
    
    // 如果有文件名，添加注释
    if (data.filename) {
      codeBlockText = `\n\`\`\`${data.language} title="${data.filename}"\n${data.code}\n\`\`\`\n`;
    }
    
    const newText = value.substring(0, selectionStart) + codeBlockText + value.substring(selectionEnd);
    
    onChange(newText);
    
    // 设置新的光标位置
    setTimeout(() => {
      textarea.focus();
      const newPosition = selectionStart + codeBlockText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }

  canExecute(context: ToolContext): boolean {
    return context.textarea && !context.textarea.disabled;
  }

  getState(context: ToolContext) {
    const { value, selectionStart, selectionEnd } = context;
    const selectedText = value.substring(selectionStart, selectionEnd);
    
    // 检查选中文本是否为代码块格式
    const isActive = /^```\w*\n[\s\S]*?\n```$/.test(selectedText);
    
    return {
      active: isActive,
      disabled: false,
      visible: true
    };
  }
}

const codeBlockHandler = new CodeBlockToolHandler();

export const codeBlockTool: DialogTool = {
  id: 'code-block',
  name: '代码块',
  icon: Code2,
  title: '插入代码块',
  group: 'insert',
  order: 5,
  type: 'dialog',
  handler: codeBlockHandler,
  dialogComponent: CodeBlockDialog
};

// 导出处理器以便在对话框中使用
export { codeBlockHandler };