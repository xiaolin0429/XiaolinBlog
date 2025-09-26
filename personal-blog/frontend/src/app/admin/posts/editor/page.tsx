"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePostEditor } from '@/hooks/use-post-editor';
import SimpleEditor from '@/components/editor/SimpleEditor';
import { UnifiedPostConfigDialog } from '@/components/editor/unified-post-config-dialog';
import { DiscardChangesDialog } from '@/components/editor/confirm-dialog';
import { FormErrors } from '@/components/editor/form-errors';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  ArrowLeft, 
  Settings, 
  Eye, 
  CheckCircle, 
  Save,
  Loader2 
} from 'lucide-react';
import { AuthGuard } from '@/components/AuthGuard';
import { toast } from 'sonner';

function UnifiedEditorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 从URL参数获取文章ID，支持 ?id=123 或 ?postId=123
  const postIdParam = searchParams.get('id') || searchParams.get('postId');
  const postId = postIdParam ? parseInt(postIdParam) : undefined;
  const isNewPost = !postId;

  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
    validateContent,
    validateConfiguration,
  } = usePostEditor({ 
    postId,
    autoSave: !isNewPost, // 新建文章不自动保存
    autoSaveInterval: 30000
  });

  // 监听表单变化，标记未保存状态
  useEffect(() => {
    const hasChanges = formData.title !== '' || formData.content !== '' || formData.excerpt !== '';
    setHasUnsavedChanges(hasChanges && !lastSaved);
  }, [formData.title, formData.content, formData.excerpt, lastSaved]);

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleQuickSave();
      }
      
      // Ctrl/Cmd + Shift + S 打开配置弹窗
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        handleOpenConfig();
      }
      
      // ESC 关闭配置弹窗
      if (e.key === 'Escape' && showConfigDialog) {
        setShowConfigDialog(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showConfigDialog]);

  // 快速保存（仅保存内容）
  const handleQuickSave = useCallback(async () => {
    if (!validateContent()) {
      toast.error('请检查标题和内容');
      return;
    }

    const result = await saveContent();
    if (result.success) {
      if (isNewPost && result.postId) {
        // 新建文章保存成功后，更新URL但不跳转
        const newUrl = `/admin/posts/editor?id=${result.postId}`;
        window.history.replaceState({}, '', newUrl);
        toast.success('文章已创建，可继续编辑');
      } else {
        toast.success('内容已保存');
      }
    }
  }, [validateContent, saveContent, isNewPost]);

  // 打开配置弹窗
  const handleOpenConfig = useCallback(async () => {
    // 如果是新文章且未保存，先保存内容
    if (isNewPost && !postId) {
      const result = await saveContent();
      if (!result.success) {
        return;
      }
      if (result.postId) {
        // 更新URL
        const newUrl = `/admin/posts/editor?id=${result.postId}`;
        window.history.replaceState({}, '', newUrl);
      }
    }
    
    setShowConfigDialog(true);
  }, [isNewPost, postId, saveContent]);

  // 处理配置保存
  const handleSaveConfig = async (): Promise<boolean> => {
    if (!validateConfiguration()) {
      toast.error('请检查配置信息');
      return false;
    }

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
    } else if (postId) {
      window.open(`/posts/${postId}`, '_blank');
    } else {
      toast.error('请先保存文章才能预览');
    }
  };

  // 处理返回操作
  const handleGoBack = () => {
    if (hasUnsavedChanges) {
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

  // 获取文章状态显示
  const getStatusBadge = () => {
    switch (formData.status) {
      case 'published':
        return <Badge variant="default" className="bg-green-500">已发布</Badge>;
      case 'archived':
        return <Badge variant="secondary">已归档</Badge>;
      default:
        return <Badge variant="secondary">草稿</Badge>;
    }
  };

  // 获取保存状态显示
  const getSaveStatus = () => {
    if (saving) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>保存中...</span>
        </>
      );
    }
    
    if (lastSaved) {
      return (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>已保存于 {lastSaved.toLocaleTimeString()}</span>
        </>
      );
    }
    
    if (hasUnsavedChanges) {
      return (
        <>
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <span>有未保存的更改</span>
        </>
      );
    }
    
    return (
      <>
        <CheckCircle className="h-4 w-4 text-gray-400" />
        <span>无更改</span>
      </>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {isNewPost ? '初始化编辑器...' : '加载文章内容...'}
          </p>
        </div>
      </div>
    );
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
              <h1 className="text-lg font-semibold">
                {isNewPost ? '创建文章' : '编辑文章'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {formData.title || '未命名文章'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 文章状态 */}
            {getStatusBadge()}

            {/* 保存状态 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getSaveStatus()}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={!formData.slug && !postId}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                预览
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenConfig}
                className="gap-2"
                title="Ctrl+Shift+S"
              >
                <Settings className="h-4 w-4" />
                配置
              </Button>
              <Button
                onClick={handleQuickSave}
                disabled={saving}
                size="sm"
                className="gap-2"
                title="Ctrl+S"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                保存
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
          <FormErrors 
            errors={validationErrors} 
            onClear={clearValidationErrors}
          />
        </div>
      )}

      {/* 主编辑区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 标题输入 */}
        <div className="border-b px-4 py-3">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="输入文章标题..."
            className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* 内容编辑器 */}
        <div className="flex-1 p-4">
          <SimpleEditor
            content={formData.content}
            onChange={(value: string) => updateField('content', value)}
            placeholder="开始写作吧... 支持富文本编辑"
          />
        </div>
      </div>

      {/* 统一配置弹窗 */}
      <UnifiedPostConfigDialog
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
        isNewPost={isNewPost}
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

export default function UnifiedEditorPage() {
  return (
    <AuthGuard>
      <UnifiedEditorPageContent />
    </AuthGuard>
  );
}