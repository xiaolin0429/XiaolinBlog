"use client"

import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Settings,
  MoreHorizontal,
  FileText,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface EditorToolbarProps {
  postId: number;
  title: string;
  slug: string;
  saving: boolean;
  lastSaved: Date | null;
  onSave: () => void;
  onOpenConfig: () => void;
  onPreview: () => void;
}

export function EditorToolbar({
  postId,
  title,
  slug,
  saving,
  lastSaved,
  onSave,
  onOpenConfig,
  onPreview
}: EditorToolbarProps) {
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center justify-between p-4">
        {/* 左侧：返回和标题 */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/posts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">
              {title || '无标题文章'}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>纯编辑模式</span>
              {lastSaved && (
                <>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>保存于 {lastSaved.toLocaleTimeString()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2">
          {/* 预览按钮 */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={onPreview}
            disabled={!slug}
          >
            <Eye className="h-4 w-4 mr-2" />
            预览
          </Button>

          {/* 配置按钮 */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={onOpenConfig}
          >
            <Settings className="h-4 w-4 mr-2" />
            配置
          </Button>

          {/* 保存按钮 */}
          <Button 
            onClick={onSave} 
            disabled={saving}
            size="sm"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存
          </Button>

          {/* 更多操作 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/posts/${postId}/config`}>
                  <Settings className="h-4 w-4 mr-2" />
                  文章配置
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/posts">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回列表
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}