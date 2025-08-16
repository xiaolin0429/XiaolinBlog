"use client"

import { Underline } from 'lucide-react';
import { SimpleTool, ToolHandler, ToolContext } from '../types/tool-types';

class UnderlineToolHandler implements ToolHandler {
  execute(context: ToolContext): void {
    const { textarea, value, selectionStart, selectionEnd, onChange } = context;
    const selectedText = value.substring(selectionStart, selectionEnd);
    
    // 检查是否已经是下划线格式
    const beforeText = value.substring(Math.max(0, selectionStart - 3), selectionStart);
    const afterText = value.substring(selectionEnd, Math.min(value.length, selectionEnd + 4));
    
    let newText: string;
    let newSelectionStart: number;
    let newSelectionEnd: number;
    
    if (beforeText === '<u>' && afterText === '</u>') {
      // 移除下划线格式
      newText = value.substring(0, selectionStart - 3) + selectedText + value.substring(selectionEnd + 4);
      newSelectionStart = selectionStart - 3;
      newSelectionEnd = selectionEnd - 3;
    } else {
      // 添加下划线格式
      const underlineText = `<u>${selectedText}</u>`;
      newText = value.substring(0, selectionStart) + underlineText + value.substring(selectionEnd);
      newSelectionStart = selectionStart + 3;
      newSelectionEnd = selectionEnd + 3;
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
    const beforeText = value.substring(Math.max(0, selectionStart - 3), selectionStart);
    const afterText = value.substring(selectionEnd, Math.min(value.length, selectionEnd + 4));
    
    // 检查当前选中文本是否为下划线
    const isActive = beforeText === '<u>' && afterText === '</u>';
    
    return {
      active: isActive,
      disabled: false,
      visible: true
    };
  }
}

export const underlineTool: SimpleTool = {
  id: 'underline',
  name: '下划线',
  icon: Underline,
  title: '下划线',
  shortcut: 'Ctrl+U',
  group: 'format',
  order: 3,
  type: 'simple',
  handler: new UnderlineToolHandler()
};