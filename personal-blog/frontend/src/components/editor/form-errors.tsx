import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { PostValidationError } from '@/lib/validations/post';

interface FormErrorsProps {
  errors: PostValidationError[];
  className?: string;
}

export function FormErrors({ errors, className = "" }: FormErrorsProps) {
  if (errors.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {errors.map((error, index) => (
        <Alert key={index} variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{getFieldDisplayName(error.field)}:</strong> {error.message}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

// 字段名称映射
function getFieldDisplayName(field: string): string {
  const fieldNames: Record<string, string> = {
    'title': '标题',
    'slug': 'URL别名',
    'content': '文章内容',
    'excerpt': '摘要',
    'category_id': '分类',
    'tag_ids': '标签',
    'featured_image': '特色图片',
    'status': '发布状态',
    'is_featured': '精选标记',
    'general': '表单'
  };

  return fieldNames[field] || field;
}

// 单个字段错误组件
interface FieldErrorProps {
  errors: PostValidationError[];
  field: string;
  className?: string;
}

export function FieldError({ errors, field, className = "" }: FieldErrorProps) {
  const fieldErrors = errors.filter(error => error.field === field);
  
  if (fieldErrors.length === 0) return null;

  return (
    <div className={`text-sm text-destructive ${className}`}>
      {fieldErrors.map((error, index) => (
        <p key={index}>{error.message}</p>
      ))}
    </div>
  );
}