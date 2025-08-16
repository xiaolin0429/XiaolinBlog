"use client"

import { useRouter, useParams } from 'next/navigation';
import { usePostEditor } from '@/hooks/use-post-editor';
import { PostConfigForm } from '@/components/editor/post-config-form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Edit,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { toast } from 'sonner';

function ConfigPageContent() {
  const router = useRouter();
  const params = useParams();
  const postId = parseInt(params.id as string);

  const {
    loading,
    saving,
    error,
    formData,
    categories,
    tags,
    selectedTags,
    updateField,
    saveConfig,
    saveAll,
    addTag,
    removeTag,
    createTag,
    fetchPost,
  } = usePostEditor({ postId });

  // 处理保存配置
  const handleSaveConfig = async () => {
    const success = await saveConfig();
    if (success) {
      router.push('/admin/posts');
    }
  };

  // 处理保存全部
  const handleSaveAll = async () => {
    const success = await saveAll();
    if (success) {
      router.push('/admin/posts');
    }
  };

  // 处理预览
  const handlePreview = () => {
    if (formData.slug) {
      window.open(`/posts/${formData.slug}`, '_blank');
    } else {
      toast.error('请先设置文章slug');
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-8 max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-destructive mb-2">加载失败</h3>
            <p className="text-destructive mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={fetchPost} variant="outline">
                <Loader2 className="h-4 w-4 mr-2" />
                重新加载
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/posts">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回列表
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/posts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">文章配置</h1>
            <p className="text-muted-foreground">
              配置文章的发布信息和元数据
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={!formData.slug}>
            <Eye className="h-4 w-4 mr-2" />
            预览
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/posts/${postId}/editor`}>
              <Edit className="h-4 w-4 mr-2" />
              编辑内容
            </Link>
          </Button>
          <Button onClick={handleSaveConfig} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存配置
          </Button>
        </div>
      </div>

      {/* 面包屑导航 */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/admin/posts" className="hover:text-foreground">
          文章管理
        </Link>
        <span>/</span>
        <Link href={`/admin/posts/${postId}/editor`} className="hover:text-foreground">
          编辑文章
        </Link>
        <span>/</span>
        <span className="text-foreground">配置信息</span>
      </nav>

      {/* 配置表单 */}
      <div className="max-w-2xl mx-auto">
        <PostConfigForm
          formData={formData}
          categories={categories}
          tags={tags}
          selectedTags={selectedTags}
          onUpdateField={updateField}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onCreateTag={createTag}
          saving={saving}
        />

        {/* 底部操作按钮 */}
        <div className="flex justify-between items-center pt-6 mt-6 border-t">
          <Button variant="outline" asChild>
            <Link href={`/admin/posts/${postId}/editor`}>
              <Edit className="h-4 w-4 mr-2" />
              返回编辑
            </Link>
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveConfig} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              仅保存配置
            </Button>
            <Button onClick={handleSaveAll} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              保存并发布
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfigPage() {
  return (
    <AuthGuard>
      <ConfigPageContent />
    </AuthGuard>
  );
}