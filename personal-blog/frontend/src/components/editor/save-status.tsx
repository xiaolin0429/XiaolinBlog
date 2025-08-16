import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SaveStatusProps {
  saving: boolean;
  lastSaved: Date | null;
  error: string | null;
  className?: string;
}

export function SaveStatus({ saving, lastSaved, error, className }: SaveStatusProps) {
  // 格式化最后保存时间
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) {
      return '刚刚保存';
    } else if (minutes < 60) {
      return `${minutes}分钟前保存`;
    } else {
      const hours = Math.floor(minutes / 60);
      if (hours < 24) {
        return `${hours}小时前保存`;
      } else {
        return date.toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
  };

  if (error) {
    return (
      <Badge variant="destructive" className={cn("flex items-center gap-1", className)}>
        <AlertCircle className="h-3 w-3" />
        保存失败
      </Badge>
    );
  }

  if (saving) {
    return (
      <Badge variant="secondary" className={cn("flex items-center gap-1", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        保存中...
      </Badge>
    );
  }

  if (lastSaved) {
    return (
      <Badge variant="outline" className={cn("flex items-center gap-1 text-muted-foreground", className)}>
        <CheckCircle className="h-3 w-3 text-green-500" />
        {formatLastSaved(lastSaved)}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn("flex items-center gap-1 text-muted-foreground", className)}>
      <Clock className="h-3 w-3" />
      未保存
    </Badge>
  );
}

// 字数统计组件
interface WordCountProps {
  content: string;
  className?: string;
}

export function WordCount({ content, className }: WordCountProps) {
  const wordCount = content.replace(/\s+/g, '').length;
  const readingTime = Math.ceil(wordCount / 400); // 假设每分钟阅读400字

  return (
    <div className={cn("flex items-center gap-4 text-sm text-muted-foreground", className)}>
      <span>{wordCount} 字</span>
      <span>约 {readingTime} 分钟阅读</span>
    </div>
  );
}

// 编辑器状态栏
interface EditorStatusBarProps {
  saving: boolean;
  lastSaved: Date | null;
  error: string | null;
  content: string;
  className?: string;
}

export function EditorStatusBar({ 
  saving, 
  lastSaved, 
  error, 
  content, 
  className 
}: EditorStatusBarProps) {
  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-2 border-t bg-muted/30",
      className
    )}>
      <WordCount content={content} />
      <SaveStatus 
        saving={saving} 
        lastSaved={lastSaved} 
        error={error} 
      />
    </div>
  );
}