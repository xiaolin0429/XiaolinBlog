"use client"

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePostEditor } from '@/hooks/use-post-editor';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { PostConfigDialog } from '@/components/editor/post-config-dialog';
import { EditorSkeleton } from '@/components/editor/editor-skeleton';
import { EditorStatusBar } from '@/components/editor/save-status';
import { useKeyboardShortcuts } from '@/components/editor/keyboard-shortcuts';
import { DiscardChangesDialog } from '@/components/editor/confirm-dialog';
import { FormErrors } from '@/components/editor/form-errors';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft, Settings, Eye, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { toast } from 'sonner';

function EditorPageContent() {
  const router = useRouter();
  const isNewPost = true; // 新建文章模式

  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const {
    loading,
    saving,
    error,
    lastSaved,
    validationErrors,
    formData,
    categories,
    tags,
    selectedTags,
    updateField,
    saveContent,
    saveConfig,
    saveAll,
    addTag,
    removeTag,
    createTag,
    clearValidationErrors,
  } = usePostEditor({ 
    postId: undefined, // 新建文章没有 postId
    autoSave: false, // 新建文章不自动保存
    autoSaveInterval: 30000
  });

  // 处理保存内容并跳转到配置页面
  const handleSaveContent = async (): Promise<boolean> => {
    const result = await saveContent();
    if (result.success && result.postId) {
      // 新建文章保存成功后，跳转到配置页面
      router.push(`/admin/posts/${result.postId}/config`);
      return true;
    }
    return result.success;
  };

  // 处理保存配置
  const handleSaveConfig = async (): Promise<boolean> => {
    const success = await saveConfig();
    if (success) {
      setShowConfigDialog(false);
      toast.success('配置保存成功');
    }
    return success;
  };

  // 处理保存全部
  const handleSaveAll = async (): Promise<boolean> => {
    const success = await saveAll();
    if (success) {
      setShowConfigDialog(false);
      toast.success('文章保存成功');
    }
    return success;
  };

  // 处理预览
  const handlePreview = () => {
    if (formData.slug) {
      window.open(`/posts/${formData.slug}`, '_blank');
    } else {
      toast.error('请先保存文章才能预览');
    }
  };

  // 处理模式切换
  const handleToggleMode = () => {
    // 新建文章需要先保存才能进入配置模式
    handleSaveContent();
  };

  // 处理返回操作
  const handleGoBack = () => {
    if (formData.content !== '' || formData.title !== '') {
      setShowDiscardDialog(true);
    } else {
      router.push('/admin/posts');
    }
  };

  // 确认放弃更改
  const handleDiscardChanges = () => {
    setShowDiscardDialog(false);
    router.push('/admin/posts');
  };

  // 键盘快捷键
  useKeyboardShortcuts({
    onSave: handleSaveContent,
    onSaveConfig: () => saveConfig(),
    onPreview: handlePreview,
    onToggleMode: handleToggleMode,
    disabled: loading || saving
  });

  if (loading) {
    return <EditorSkeleton />;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* 顶部工具栏 */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold">创建文章</h1>
              <p className="text-xs text-muted-foreground">专注写作模式</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 文章状态 */}
            <Badge variant="secondary">草稿</Badge>

            {/* 保存状态 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  <span>保存中...</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>已保存于 {lastSaved.toLocaleTimeString()}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span>未保存</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={!formData.slug}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                预览
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleMode}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                配置
              </Button>
              <Button
                onClick={handleSaveContent}
                disabled={saving}
                size="sm"
                className="gap-2"
              >
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-4 py-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* 验证错误提示 */}
      {validationErrors.length > 0 && (
        <div className="px-4 py-2">
          <FormErrors errors={validationErrors} />
        </div>
      )}

      {/* 主编辑区域 - 占满剩余空间 */}
      <div className="flex-1 flex flex-col overflow-hidden p-4">
        <RichTextEditor
          value={formData.content}
          onChange={(value: string) => updateField('content', value)}
          placeholder="开始写作吧... 支持 Markdown 格式"
          showWordCount={true}
          className="h-full"
          compact={false}
          toolbarPosition="top"
        />
      </div>

      {/* 配置弹窗 */}
      <PostConfigDialog
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        formData={formData}
        categories={categories}
        tags={tags}
        selectedTags={selectedTags}
        onUpdateField={updateField}
        onAddTag={addTag}
        onRemoveTag={removeTag}
        onCreateTag={createTag}
        onSaveConfig={handleSaveConfig}
        onSaveAll={handleSaveAll}
        onSkipConfig={() => setShowConfigDialog(false)}
        saving={saving}
      />

      {/* 放弃更改确认弹窗 */}
      <DiscardChangesDialog
        open={showDiscardDialog}
        onOpenChange={setShowDiscardDialog}
        onConfirm={handleDiscardChanges}
      />
    </div>
  );
}

export default function NewPostEditorPage() {
  return (
    <AuthGuard>
      <EditorPageContent />
    </AuthGuard>
  );
}
