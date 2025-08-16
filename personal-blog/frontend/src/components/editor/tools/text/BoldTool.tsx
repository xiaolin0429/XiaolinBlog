"use client"

import { Bold } from 'lucide-react';
import { SimpleTool, ToolHandler, ToolContext } from '../types/tool-types';

class BoldToolHandler implements ToolHandler {
  execute(context: ToolContext): void {
    const { textarea, value, selectionStart, selectionEnd, onChange } = context;
    const selectedText = value.substring(selectionStart, selectionEnd);
    
    // 检查是否已经是粗体格式
    const beforeText = value.substring(Math.max(0, selectionStart - 2), selectionStart);
    const afterText = value.substring(selectionEnd, Math.min(value.length, selectionEnd + 2));
    
    let newText: string;
    let newSelectionStart: number;
    let newSelectionEnd: number;
    
    if (beforeText === '**' && afterText === '**') {
      // 移除粗体格式
      newText = value.substring(0, selectionStart - 2) + selectedText + value.substring(selectionEnd + 2);
      newSelectionStart = selectionStart - 2;
      newSelectionEnd = selectionEnd - 2;
    } else {
      // 添加粗体格式
      const boldText = `**${selectedText}**`;
      newText = value.substring(0, selectionStart) + boldText + value.substring(selectionEnd);
      newSelectionStart = selectionStart + 2;
      newSelectionEnd = selectionEnd + 2;
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
    const selectedText = value.substring(selectionStart, selectionEnd);
    const beforeText = value.substring(Math.max(0, selectionStart - 2), selectionStart);
    const afterText = value.substring(selectionEnd, Math.min(value.length, selectionEnd + 2));
    
    // 检查当前选中文本是否为粗体
    const isActive = beforeText === '**' && afterText === '**';
    
    return {
      active: isActive,
      disabled: false,
      visible: true
    };
  }
}

export const boldTool: SimpleTool = {
  id: 'bold',
  name: '粗体',
  icon: Bold,
  title: '粗体',
  shortcut: 'Ctrl+B',
  group: 'format',
  order: 1,
  type: 'simple',
  handler: new BoldToolHandler()
};