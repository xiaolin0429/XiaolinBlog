import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface KeyboardShortcutsProps {
  onSave?: () => Promise<boolean> | boolean;
  onSaveConfig?: () => Promise<boolean> | boolean;
  onPreview?: () => void;
  onToggleMode?: () => void;
  disabled?: boolean;
}

export function useKeyboardShortcuts({
  onSave,
  onSaveConfig,
  onPreview,
  onToggleMode,
  disabled = false
}: KeyboardShortcutsProps) {
  
  const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
    if (disabled) return;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

    // Ctrl/Cmd + S: 保存
    if (ctrlKey && event.key === 's') {
      event.preventDefault();
      if (onSave) {
        const result = await onSave();
        if (result) {
          toast.success('保存成功 (Ctrl+S)');
        }
      }
      return;
    }

    // Ctrl/Cmd + Shift + S: 保存配置
    if (ctrlKey && event.shiftKey && event.key === 'S') {
      event.preventDefault();
      if (onSaveConfig) {
        const result = await onSaveConfig();
        if (result) {
          toast.success('配置保存成功 (Ctrl+Shift+S)');
        }
      }
      return;
    }

    // Ctrl/Cmd + P: 预览
    if (ctrlKey && event.key === 'p') {
      event.preventDefault();
      if (onPreview) {
        onPreview();
        toast.info('打开预览 (Ctrl+P)');
      }
      return;
    }

    // Ctrl/Cmd + M: 切换模式
    if (ctrlKey && event.key === 'm') {
      event.preventDefault();
      if (onToggleMode) {
        onToggleMode();
        toast.info('切换编辑模式 (Ctrl+M)');
      }
      return;
    }

    // Esc: 取消操作
    if (event.key === 'Escape') {
      // 可以用于关闭弹窗等操作
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.blur) {
        activeElement.blur();
      }
      return;
    }
  }, [onSave, onSaveConfig, onPreview, onToggleMode, disabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

// 快捷键帮助组件
export function KeyboardShortcutsHelp() {
  const isMac = typeof navigator !== 'undefined' && 
    navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const ctrlKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    { key: `${ctrlKey} + S`, description: '保存内容' },
    { key: `${ctrlKey} + Shift + S`, description: '保存配置' },
    { key: `${ctrlKey} + P`, description: '预览文章' },
    { key: `${ctrlKey} + M`, description: '切换编辑模式' },
    { key: 'Esc', description: '取消当前操作' },
  ];

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">键盘快捷键</h4>
      <div className="space-y-1">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{shortcut.description}</span>
            <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded">
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}