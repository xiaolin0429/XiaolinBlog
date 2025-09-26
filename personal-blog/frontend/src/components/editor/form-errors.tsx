"use client"

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, X } from 'lucide-react';

interface ValidationError {
  field: string;
  message: string;
}

interface FormErrorsProps {
  errors: ValidationError[];
  onClear?: () => void;
  className?: string;
}

export function FormErrors({ errors, onClear, className = "" }: FormErrorsProps) {
  if (errors.length === 0) return null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <div className="flex-1">
        <AlertDescription>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium mb-2">请修正以下问题：</p>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1 h-1 bg-destructive rounded-full mt-2 flex-shrink-0" />
                    <span>
                      <strong>{getFieldLabel(error.field)}：</strong>
                      {error.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {onClear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="ml-2 h-auto p-1 hover:bg-destructive/20"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
}

// 字段标签映射
function getFieldLabel(field: string): string {
  const fieldLabels: Record<string, string> = {
    title: '标题',
    slug: 'URL别名',
    content: '内容',
    excerpt: '摘要',
    category_id: '分类',
    tag_ids: '标签',
    featured_image: '特色图片',
    status: '发布状态',
    is_featured: '精选设置',
  };

  return fieldLabels[field] || field;
}