"use client"

import { Heading1, Heading2, Heading3 } from 'lucide-react';
import { SimpleTool, ToolHandler, ToolContext } from '../types/tool-types';

class HeadingToolHandler implements ToolHandler {
  constructor(private level: number) {}

  execute(context: ToolContext): void {
    const { textarea, value, selectionStart, onChange } = context;
    
    // 找到当前行的开始位置
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEnd = value.indexOf('\n', selectionStart);
    const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
    
    const currentLine = value.substring(lineStart, actualLineEnd);
    const headingPrefix = '#'.repeat(this.level) + ' ';
    
    let newLine: string;
    let newSelectionStart: number;
    
    // 检查当前行是否已经是相同级别的标题
    if (currentLine.startsWith(headingPrefix)) {
      // 移除标题格式
      newLine = currentLine.substring(headingPrefix.length);
      newSelectionStart = selectionStart - headingPrefix.length;
    } else {
      // 移除其他级别的标题格式（如果存在）
      const cleanLine = currentLine.replace(/^#+\s*/, '');
      newLine = headingPrefix + cleanLine;
      newSelectionStart = selectionStart + headingPrefix.length - (currentLine.length - cleanLine.length);
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
    const headingPrefix = '#'.repeat(this.level) + ' ';
    
    // 检查当前行是否为指定级别的标题
    const isActive = currentLine.startsWith(headingPrefix);
    
    return {
      active: isActive,
      disabled: false,
      visible: true
    };
  }
}

export const heading1Tool: SimpleTool = {
  id: 'heading1',
  name: 'H1',
  icon: Heading1,
  title: '一级标题',
  group: 'heading',
  order: 1,
  type: 'simple',
  handler: new HeadingToolHandler(1)
};

export const heading2Tool: SimpleTool = {
  id: 'heading2',
  name: 'H2',
  icon: Heading2,
  title: '二级标题',
  group: 'heading',
  order: 2,
  type: 'simple',
  handler: new HeadingToolHandler(2)
};

export const heading3Tool: SimpleTool = {
  id: 'heading3',
  name: 'H3',
  icon: Heading3,
  title: '三级标题',
  group: 'heading',
  order: 3,
  type: 'simple',
  handler: new HeadingToolHandler(3)
};