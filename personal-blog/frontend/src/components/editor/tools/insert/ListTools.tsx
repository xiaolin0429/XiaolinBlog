"use client"

import { List, ListOrdered } from 'lucide-react';
import { SimpleTool, ToolHandler, ToolContext } from '../types/tool-types';

class UnorderedListToolHandler implements ToolHandler {
  execute(context: ToolContext): void {
    const { textarea, value, selectionStart, onChange } = context;
    
    // 找到当前行的开始位置
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEnd = value.indexOf('\n', selectionStart);
    const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
    
    const currentLine = value.substring(lineStart, actualLineEnd);
    const listPrefix = '- ';
    
    let newLine: string;
    let newSelectionStart: number;
    
    // 检查当前行是否已经是无序列表
    if (currentLine.startsWith(listPrefix)) {
      // 移除列表格式
      newLine = currentLine.substring(listPrefix.length);
      newSelectionStart = selectionStart - listPrefix.length;
    } else {
      // 移除有序列表格式（如果存在）
      const cleanLine = currentLine.replace(/^\d+\.\s*/, '');
      newLine = listPrefix + cleanLine;
      newSelectionStart = selectionStart + listPrefix.length - (currentLine.length - cleanLine.length);
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
    const isActive = currentLine.startsWith('- ');
    
    return {
      active: isActive,
      disabled: false,
      visible: true
    };
  }
}

class OrderedListToolHandler implements ToolHandler {
  execute(context: ToolContext): void {
    const { textarea, value, selectionStart, onChange } = context;
    
    // 找到当前行的开始位置
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEnd = value.indexOf('\n', selectionStart);
    const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
    
    const currentLine = value.substring(lineStart, actualLineEnd);
    const listPrefix = '1. ';
    
    let newLine: string;
    let newSelectionStart: number;
    
    // 检查当前行是否已经是有序列表
    if (/^\d+\.\s/.test(currentLine)) {
      // 移除列表格式
      newLine = currentLine.replace(/^\d+\.\s*/, '');
      newSelectionStart = selectionStart - (currentLine.length - newLine.length);
    } else {
      // 移除无序列表格式（如果存在）
      const cleanLine = currentLine.replace(/^-\s*/, '');
      newLine = listPrefix + cleanLine;
      newSelectionStart = selectionStart + listPrefix.length - (currentLine.length - cleanLine.length);
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
    const isActive = /^\d+\.\s/.test(currentLine);
    
    return {
      active: isActive,
      disabled: false,
      visible: true
    };
  }
}

export const unorderedListTool: SimpleTool = {
  id: 'unordered-list',
  name: '无序列表',
  icon: List,
  title: '无序列表',
  group: 'insert',
  order: 2,
  type: 'simple',
  handler: new UnorderedListToolHandler()
};

export const orderedListTool: SimpleTool = {
  id: 'ordered-list',
  name: '有序列表',
  icon: ListOrdered,
  title: '有序列表',
  group: 'insert',
  order: 3,
  type: 'simple',
  handler: new OrderedListToolHandler()
};