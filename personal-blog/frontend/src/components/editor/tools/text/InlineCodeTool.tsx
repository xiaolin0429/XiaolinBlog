"use client"

import { Code } from 'lucide-react';
import { SimpleTool, ToolHandler, ToolContext } from '../types/tool-types';

class InlineCodeToolHandler implements ToolHandler {
  execute(context: ToolContext): void {
    const { textarea, value, selectionStart, selectionEnd, onChange } = context;
    const selectedText = value.substring(selectionStart, selectionEnd);
    
    // 检查是否已经是行内代码格式
    const beforeText = value.substring(Math.max(0, selectionStart - 1), selectionStart);
    const afterText = value.substring(selectionEnd, Math.min(value.length, selectionEnd + 1));
    
    let newText: string;
    let newSelectionStart: number;
    let newSelectionEnd: number;
    
    if (beforeText === '`' && afterText === '`') {
      // 移除行内代码格式
      newText = value.substring(0, selectionStart - 1) + selectedText + value.substring(selectionEnd + 1);
      newSelectionStart = selectionStart - 1;
      newSelectionEnd = selectionEnd - 1;
    } else {
      // 添加行内代码格式
      const codeText = `\`${selectedText}\``;
      newText = value.substring(0, selectionStart) + codeText + value.substring(selectionEnd);
      newSelectionStart = selectionStart + 1;
      newSelectionEnd = selectionEnd + 1;
    }
    
    onChange(newText);
    
    // 设置新的光标位置
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
      } else {
        textarea.setSelectionRange(newSelectionStart, newSelectionStart);
      }
    }, 0);
  }

  canExecute(context: ToolContext): boolean {
    return context.textarea && !context.textarea.disabled;
  }

  getState(context: ToolContext) {
    const { value, selectionStart, selectionEnd } = context;
    const beforeText = value.substring(Math.max(0, selectionStart - 1), selectionStart);
    const afterText = value.substring(selectionEnd, Math.min(value.length, selectionEnd + 1));
    
    // 检查当前选中文本是否为行内代码
    const isActive = beforeText === '`' && afterText === '`';
    
    return {
      active: isActive,
      disabled: false,
      visible: true
    };
  }
}

export const inlineCodeTool: SimpleTool = {
  id: 'inline-code',
  name: '代码',
  icon: Code,
  title: '行内代码',
  shortcut: 'Ctrl+`',
  group: 'format',
  order: 5,
  type: 'simple',
  handler: new InlineCodeToolHandler()
};