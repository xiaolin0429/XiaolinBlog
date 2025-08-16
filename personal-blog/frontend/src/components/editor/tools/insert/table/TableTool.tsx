"use client"

import { Table } from 'lucide-react';
import { DialogTool, ToolHandler, ToolContext } from '../../types/tool-types';
import { TableDialog } from './TableDialog';

export interface TableData {
  rows: number;
  columns: number;
  headers: string[];
  includeHeader: boolean;
  alignment: 'left' | 'center' | 'right';
}

class TableToolHandler implements ToolHandler {
  private onOpenDialog?: (data: TableData) => void;

  setDialogHandler(handler: (data: TableData) => void) {
    this.onOpenDialog = handler;
  }

  execute(context: ToolContext, data?: TableData): void {
    if (data) {
      // 从对话框确认后执行插入
      this.insertTable(context, data);
    } else {
      // 打开对话框
      this.openTableDialog(context);
    }
  }

  private openTableDialog(context: ToolContext): void {
    const initialData: TableData = {
      rows: 3,
      columns: 3,
      headers: ['列1', '列2', '列3'],
      includeHeader: true,
      alignment: 'left'
    };
    
    this.onOpenDialog?.(initialData);
  }

  private insertTable(context: ToolContext, data: TableData): void {
    const { textarea, value, selectionStart, selectionEnd, onChange } = context;
    
    const alignmentChar = data.alignment === 'center' ? ':---:' : 
                         data.alignment === 'right' ? '---:' : '---';
    
    let tableText = '\n';
    
    // 创建表头
    if (data.includeHeader) {
      const headerRow = '| ' + data.headers.slice(0, data.columns).join(' | ') + ' |';
      const separatorRow = '| ' + Array(data.columns).fill(alignmentChar).join(' | ') + ' |';
      tableText += headerRow + '\n' + separatorRow + '\n';
    }
    
    // 创建数据行
    const startRow = data.includeHeader ? 0 : 1;
    for (let i = startRow; i < data.rows; i++) {
      const row = '| ' + Array(data.columns).fill('内容').join(' | ') + ' |';
      tableText += row + '\n';
    }
    
    tableText += '\n';
    
    const newText = value.substring(0, selectionStart) + tableText + value.substring(selectionEnd);
    
    onChange(newText);
    
    // 设置新的光标位置
    setTimeout(() => {
      textarea.focus();
      const newPosition = selectionStart + tableText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }

  canExecute(context: ToolContext): boolean {
    return context.textarea && !context.textarea.disabled;
  }

  getState(context: ToolContext) {
    return {
      active: false,
      disabled: false,
      visible: true
    };
  }
}

const tableHandler = new TableToolHandler();

export const tableTool: DialogTool = {
  id: 'table',
  name: '表格',
  icon: Table,
  title: '插入表格',
  group: 'insert',
  order: 6,
  type: 'dialog',
  handler: tableHandler,
  dialogComponent: TableDialog
};

// 导出处理器以便在对话框中使用
export { tableHandler };