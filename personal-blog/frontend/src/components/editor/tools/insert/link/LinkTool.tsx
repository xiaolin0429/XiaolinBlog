"use client"

import { Link } from 'lucide-react';
import { DialogTool, ToolHandler, ToolContext } from '../../types/tool-types';
import { LinkDialog } from './LinkDialog';

export interface LinkData {
  text: string;
  url: string;
  title?: string;
}

class LinkToolHandler implements ToolHandler {
  private onOpenDialog?: (data: LinkData) => void;

  setDialogHandler(handler: (data: LinkData) => void) {
    this.onOpenDialog = handler;
  }

  execute(context: ToolContext, data?: LinkData): void {
    if (data) {
      // 从对话框确认后执行插入
      this.insertLink(context, data);
    } else {
      // 打开对话框
      this.openLinkDialog(context);
    }
  }

  private openLinkDialog(context: ToolContext): void {
    const { value, selectionStart, selectionEnd } = context;
    const selectedText = value.substring(selectionStart, selectionEnd);
    
    // 检查选中文本是否已经是链接
    const linkMatch = selectedText.match(/^\[([^\]]*)\]\(([^)]*)\)$/);
    
    const initialData: LinkData = linkMatch 
      ? { text: linkMatch[1], url: linkMatch[2] }
      : { text: selectedText, url: '' };
    
    this.onOpenDialog?.(initialData);
  }

  private insertLink(context: ToolContext, data: LinkData): void {
    const { textarea, value, selectionStart, selectionEnd, onChange } = context;
    
    const linkText = `[${data.text}](${data.url}${data.title ? ` "${data.title}"` : ''})`;
    const newText = value.substring(0, selectionStart) + linkText + value.substring(selectionEnd);
    
    onChange(newText);
    
    // 设置新的光标位置
    setTimeout(() => {
      textarea.focus();
      const newPosition = selectionStart + linkText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }

  canExecute(context: ToolContext): boolean {
    return context.textarea && !context.textarea.disabled;
  }

  getState(context: ToolContext) {
    const { value, selectionStart, selectionEnd } = context;
    const selectedText = value.substring(selectionStart, selectionEnd);
    
    // 检查选中文本是否为链接格式
    const isActive = /^\[([^\]]*)\]\(([^)]*)\)$/.test(selectedText);
    
    return {
      active: isActive,
      disabled: false,
      visible: true
    };
  }
}

const linkHandler = new LinkToolHandler();

export const linkTool: DialogTool = {
  id: 'link',
  name: '链接',
  icon: Link,
  title: '插入链接',
  shortcut: 'Ctrl+K',
  group: 'insert',
  order: 4,
  type: 'dialog',
  handler: linkHandler,
  dialogComponent: LinkDialog
};

// 导出处理器以便在对话框中使用
export { linkHandler };