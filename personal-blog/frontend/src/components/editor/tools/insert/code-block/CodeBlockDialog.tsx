"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DialogToolProps } from '../../types/tool-types';
import { CodeBlockData } from './CodeBlockTool';

const POPULAR_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'text', label: 'Plain Text' }
];

export function CodeBlockDialog({ open, onOpenChange, onConfirm, initialData }: DialogToolProps) {
  const [formData, setFormData] = useState<CodeBlockData>({
    code: '',
    language: 'javascript',
    filename: '',
    showLineNumbers: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.code.trim()) {
      onConfirm(formData);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>插入代码块</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code-language">编程语言</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择编程语言" />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code-filename">文件名（可选）</Label>
              <Input
                id="code-filename"
                value={formData.filename || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, filename: e.target.value }))}
                placeholder="example.js"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="code-content">代码内容</Label>
            <Textarea
              id="code-content"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="请输入代码..."
              className="min-h-[200px] font-mono text-sm"
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-line-numbers"
              checked={formData.showLineNumbers}
              onCheckedChange={(checked: boolean) => 
                setFormData(prev => ({ ...prev, showLineNumbers: checked }))
              }
            />
            <Label htmlFor="show-line-numbers">显示行号</Label>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button type="submit">
              插入代码块
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}