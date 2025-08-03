"use client"

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link, 
  Image, 
  Code, 
  Quote,
  Eye,
  Edit3
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "开始写作...",
  className = ""
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // 插入文本到光标位置
  const insertText = useCallback((textarea: HTMLTextAreaElement, text: string) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + text + value.substring(end);
    onChange(newValue);
    
    // 设置新的光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  }, [value, onChange]);

  // 包装选中文本
  const wrapText = useCallback((textarea: HTMLTextAreaElement, prefix: string, suffix: string = prefix) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = prefix + selectedText + suffix;
    const newValue = value.substring(0, start) + newText + value.substring(end);
    onChange(newValue);
    
    // 设置新的光标位置
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }
    }, 0);
  }, [value, onChange]);

  // 工具栏按钮处理函数
  const handleToolbarAction = useCallback((action: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    switch (action) {
      case 'bold':
        wrapText(textarea, '**');
        break;
      case 'italic':
        wrapText(textarea, '*');
        break;
      case 'underline':
        wrapText(textarea, '<u>', '</u>');
        break;
      case 'code':
        wrapText(textarea, '`');
        break;
      case 'quote':
        insertText(textarea, '\n> ');
        break;
      case 'ul':
        insertText(textarea, '\n- ');
        break;
      case 'ol':
        insertText(textarea, '\n1. ');
        break;
      case 'link':
        wrapText(textarea, '[', '](url)');
        break;
      case 'image':
        insertText(textarea, '\n![alt text](image-url)\n');
        break;
      default:
        break;
    }
  }, [wrapText, insertText]);

  // 渲染Markdown预览
  const renderPreview = useMemo(() => {
    // 简单的Markdown渲染（实际项目中建议使用专业的Markdown解析器）
    let html = value
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
      .replace(/\n/g, '<br>');

    // 包装列表项
    html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
    
    return html;
  }, [value]);

  const toolbarButtons = [
    { icon: Bold, action: 'bold', title: '粗体 (Ctrl+B)' },
    { icon: Italic, action: 'italic', title: '斜体 (Ctrl+I)' },
    { icon: Underline, action: 'underline', title: '下划线' },
    { icon: Code, action: 'code', title: '代码' },
    { icon: Quote, action: 'quote', title: '引用' },
    { icon: List, action: 'ul', title: '无序列表' },
    { icon: ListOrdered, action: 'ol', title: '有序列表' },
    { icon: Link, action: 'link', title: '链接' },
    { icon: Image, action: 'image', title: '图片' },
  ];

  return (
    <div className={`border rounded-lg ${className}`}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-1">
          {toolbarButtons.map((button) => {
            const Icon = button.icon;
            return (
              <Button
                key={button.action}
                variant="ghost"
                size="sm"
                onClick={() => handleToolbarAction(button.action)}
                title={button.title}
                className="h-8 w-8 p-0"
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              编辑
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              预览
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 编辑器内容 */}
      <div className="min-h-[400px]">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')}>
          <TabsContent value="edit" className="mt-0">
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="min-h-[400px] border-0 resize-none focus-visible:ring-0 rounded-none"
              onKeyDown={(e) => {
                // 快捷键支持
                if (e.ctrlKey || e.metaKey) {
                  switch (e.key) {
                    case 'b':
                      e.preventDefault();
                      handleToolbarAction('bold');
                      break;
                    case 'i':
                      e.preventDefault();
                      handleToolbarAction('italic');
                      break;
                    default:
                      break;
                  }
                }
                
                // Tab键插入空格
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const textarea = e.target as HTMLTextAreaElement;
                  insertText(textarea, '  ');
                }
              }}
            />
          </TabsContent>
          
          <TabsContent value="preview" className="mt-0">
            <div 
              className="min-h-[400px] p-4 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderPreview || '<p className="text-muted-foreground">暂无内容...</p>' }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}