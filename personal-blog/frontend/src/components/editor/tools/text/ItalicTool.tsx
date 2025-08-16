"use client"

import { Italic } from 'lucide-react';
import { SimpleTool, ToolHandler, ToolContext } from '../types/tool-types';

class ItalicToolHandler implements ToolHandler {
  execute(context: ToolContext): void {
    const { textarea, value, selectionStart, selectionEnd, onChange } = context;
    const selectedText = value.substring(selectionStart, selectionEnd);
    
    // 检查是否已经是斜体格式
    const beforeText = value.substring(Math.max(0, selectionStart - 1), selectionStart);
    const afterText = value.substring(selectionEnd, Math.min(value.length, selectionEnd + 1));
    
    let newText: string;
    let newSelectionStart: number;
    let newSelectionEnd: number;
    
    if (beforeText === '*' && afterText === '*') {
      // 移除斜体格式
      newText = value.substring(0, selectionStart - 1) + selectedText + value.substring(selectionEnd + 1);
      newSelectionStart = selectionStart - 1;
      newSelectionEnd = selectionEnd - 1;
    } else {
      // 添加斜体格式
      const italicText = `*${selectedText}*`;
      newText = value.substring(0, selectionStart) + italicText + value.substring(selectionEnd);
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
    
    // 检查当前选中文本是否为斜体
    const isActive = beforeText === '*' && afterText === '*';
    
    return {
      active: isActive,
      disabled: false,
      visible: true
    };
  }
}

export const italicTool: SimpleTool = {
  id: 'italic',
  name: '斜体',
  icon: Italic,
  title: '斜体',
  shortcut: 'Ctrl+I',
  group: 'format',
  order: 2,
  type: 'simple',
  handler: new ItalicToolHandler()
};