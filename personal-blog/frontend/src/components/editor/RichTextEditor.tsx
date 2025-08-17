"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye,
  Edit3,
  FileText
} from 'lucide-react';
import { ToolProvider } from './tools/manager/ToolContext';
import { Toolbar } from './tools/components/Toolbar';
import { ToolContext } from './tools/types/tool-types';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showWordCount?: boolean;
  toolbarPosition?: 'top' | 'bottom' | 'floating';
  compact?: boolean;
  showLabels?: boolean;
}

export function RichTextEditor({
  value, 
  onChange, 
  placeholder = "开始写作...",
  className = "",
  showWordCount = false,
  toolbarPosition = 'top',
  compact = false,
  showLabels = false
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 创建工具上下文
  const toolContext: ToolContext = useMemo(() => ({
    textarea: textareaRef.current!,
    value,
    selectionStart,
    selectionEnd,
    onChange,
    onSelectionChange: (start, end) => {
      setSelectionStart(start);
      setSelectionEnd(end);
    }
  }), [value, selectionStart, selectionEnd, onChange]);

  // 计算字数和字符数
  useEffect(() => {
    if (showWordCount) {
      const content = value || '';
      setCharCount(content.length);
      // 简单的中英文字数统计
      const words = content.trim().split(/\s+/).filter(word => word.length > 0);
      const chineseChars = content.match(/[\u4e00-\u9fa5]/g) || [];
      setWordCount(words.length + chineseChars.length);
    }
  }, [value, showWordCount]);

  // 处理选择变化
  const handleSelectionChange = useCallback(() => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      setSelectionStart(start);
      setSelectionEnd(end);
    }
  }, []);

  // 处理键盘快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab键插入空格
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.setSelectionRange(start + 2, start + 2);
        handleSelectionChange();
      }, 0);
    }
  }, [value, onChange, handleSelectionChange]);

  // 渲染Markdown预览
  const renderPreview = useMemo(() => {
    // 简单的Markdown渲染（实际项目中建议使用专业的Markdown解析器）
    let html = value
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
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

  return (
    <ToolProvider>
      <div className={`border rounded-lg flex flex-col focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all ${className}`}>
        {/* 顶部工具栏 */}
        {toolbarPosition === 'top' && (
          <Toolbar
            context={toolContext}
            showLabels={showLabels}
            compact={compact}
            position={toolbarPosition}
          />
        )}

        {/* 编辑器内容 */}
        <div className="flex-1 relative flex flex-col">
          {/* 浮动工具栏 */}
          {toolbarPosition === 'floating' && (
            <div className="absolute top-4 left-4 z-10">
              <Toolbar
                context={toolContext}
                showLabels={showLabels}
                compact={compact}
                position={toolbarPosition}
                className="shadow-lg"
              />
            </div>
          )}

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')} className="flex flex-col h-full">
            {/* 标签栏 */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
              <div className="flex items-center gap-4">
                {/* 字数统计 */}
                {showWordCount && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {wordCount} 字
                    </span>
                    <span>{charCount} 字符</span>
                  </div>
                )}
              </div>
              
              <TabsList className="grid w-full max-w-[200px] grid-cols-2">
                <TabsTrigger value="edit" className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  编辑
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  预览
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="edit" className="mt-0 flex-1">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onSelect={handleSelectionChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="h-full resize-none rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </TabsContent>
            
            <TabsContent value="preview" className="mt-0 flex-1">
              <div 
                className="h-full p-4 prose prose-sm max-w-none overflow-auto"
                dangerouslySetInnerHTML={{ __html: renderPreview || '<p class="text-muted-foreground">暂无内容...</p>' }}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* 底部工具栏 */}
        {toolbarPosition === 'bottom' && (
          <Toolbar
            context={toolContext}
            showLabels={showLabels}
            compact={compact}
            position={toolbarPosition}
          />
        )}
      </div>
    </ToolProvider>
  );
}