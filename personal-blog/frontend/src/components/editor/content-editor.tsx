"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Save, 
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { PostFormData } from '@/hooks/use-post-editor';

interface ContentEditorProps {
  formData: PostFormData;
  onUpdateField: (field: keyof PostFormData, value: any) => void;
  onSave: () => Promise<boolean>;
  saving: boolean;
  lastSaved: Date | null;
  className?: string;
}

export function ContentEditor({
  formData,
  onUpdateField,
  onSave,
  saving,
  lastSaved,
  className = ""
}: ContentEditorProps) {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // 计算字数和字符数
  useEffect(() => {
    const content = formData.content || '';
    setCharCount(content.length);
    // 简单的中英文字数统计
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const chineseChars = content.match(/[\u4e00-\u9fa5]/g) || [];
    setWordCount(words.length + chineseChars.length);
  }, [formData.content]);

  const handleSave = async () => {
    const success = await onSave();
    // 可以根据保存结果进行额外的UI反馈
    if (!success) {
      // 保存失败的处理已经在 hook 中完成
      console.log('保存失败');
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 编辑器主体 - 占满剩余空间 */}
      <div className="flex-1 flex flex-col p-4">
        {/* 内容编辑器标题栏 */}
        <div className="flex items-center justify-between mb-4">
          <Label htmlFor="content" className="text-base font-medium">
            文章内容 *
          </Label>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {wordCount} 字
            </span>
            <span>{charCount} 字符</span>
          </div>
        </div>
        
        {/* 内容编辑器 - 占满剩余空间 */}
        <div className="flex-1">
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => onUpdateField('content', e.target.value)}
            placeholder="开始写作吧... 支持 Markdown 格式"
            className="font-mono text-sm leading-relaxed resize-none h-full border-0 shadow-none focus-visible:ring-0 p-4"
          />
        </div>
      </div>
    </div>
  );
}
