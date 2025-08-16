"use client"

import { Quote } from 'lucide-react';
import { SimpleTool, ToolHandler, ToolContext } from '../types/tool-types';

class QuoteToolHandler implements ToolHandler {
  execute(context: ToolContext): void {
    const { textarea, value, selectionStart, onChange } = context;
    
    // 找到当前行的开始位置
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEnd = value.indexOf('\n', selectionStart);
    const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
    
    const currentLine = value.substring(lineStart, actualLineEnd);
    const quotePrefix = '> ';
    
    let newLine: string;
    let newSelectionStart: number;
    
    // 检查当前行是否已经是引用
    if (currentLine.startsWith(quotePrefix)) {
      // 移除引用格式
      newLine = currentLine.substring(quotePrefix.length);
      newSelectionStart = selectionStart - quotePrefix.length;
    } else {
      // 添加引用格式
      newLine = quotePrefix + currentLine;
      newSelectionStart = selectionStart + quotePrefix.length;
    }
    
    const newText = value.substring(0, lineStart) + newLine + value.substring(actualLineEnd);
    onChange(newText);
    
    // 设置新的光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newSelectionStart, newSelectionStart);
    }, 0);
  }

  canExecute(context: ToolContext): boolean {
    return context.textarea && !context.textarea.disabled;
  }

  getState(context: ToolContext) {
    const { value, selectionStart } = context;
    
    // 找到当前行的开始位置
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEnd = value.indexOf('\n', selectionStart);
    const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
    
    const currentLine = value.substring(lineStart, actualLineEnd);
    const isActive = currentLine.startsWith('> ');
    
    return {
      active: isActive,
      disabled: false,
      visible: true
    };
  }
}

export const quoteTool: SimpleTool = {
  id: 'quote',
  name: '引用',
  icon: Quote,
  title: '引用块',
  group: 'insert',
  order: 1,
  type: 'simple',
  handler: new QuoteToolHandler()
};