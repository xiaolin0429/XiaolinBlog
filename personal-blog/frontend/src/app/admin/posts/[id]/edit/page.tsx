"use client"

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload, 
  X,
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { postsAPI, type Post } from '@/lib/api/posts';
import { categoriesAPI, type Category } from '@/lib/api/categories';
import { tagsAPI, type Tag } from '@/lib/api/tags';
import { AuthGuard } from '@/components/AuthGuard';

interface PostFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  category_id: number | null;
  tag_ids: number[];
}

function EditPostPageContent() {
  const router = useRouter();
  const params = useParams();
  const postId = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    status: 'draft',
    is_featured: false,
    category_id: null,
    tag_ids: []
  });

  // 选项数据
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  // 新标签输入
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);

  // 获取文章详情
  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);

      const post = await postsAPI.getPost(postId);
      
      if (post) {
        setFormData({
          title: post.title || '',
          slug: post.slug || '',
          content: post.content || '',
          excerpt: post.excerpt || '',
          featured_image: post.cover_image || '',
          status: (post.status as 'draft' | 'published' | 'archived') || 'draft',
          is_featured: post.is_featured || false,
          category_id: post.category_id || null,
          tag_ids: post.tags?.map(tag => tag.id) || []
        });
      }

    } catch (err: any) {
      const errorMessage = err.message || '获取文章详情失败';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('获取文章详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取分类和标签选项
  const fetchOptions = async () => {
    try {
      const [categoriesResponse, tagsResponse] = await Promise.all([
        categoriesAPI.getCategories(),
        tagsAPI.getTags()
      ]);

      setCategories(categoriesResponse || []);
      setAvailableTags(tagsResponse || []);
    } catch (err: any) {
      console.error('获取选项数据失败:', err);
      toast.error('获取分类和标签数据失败');
    }
  };

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchOptions();
    }
  }, [postId]);

  // 根据标题自动生成slug
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-') // 空格替换为连字符
      .replace(/-+/g, '-') // 多个连字符合并为一个
      .trim();
  };

  // 处理表单字段变化
  const handleInputChange = (field: keyof PostFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 如果修改标题，自动更新slug
    if (field === 'title' && value) {
      const newSlug = generateSlug(value);
      setFormData(prev => ({
        ...prev,
        slug: newSlug
      }));
    }
  };

  // 添加标签
  const handleAddTag = (tagId: number) => {
    if (!formData.tag_ids.includes(tagId)) {
      setFormData(prev => ({
        ...prev,
        tag_ids: [...prev.tag_ids, tagId]
      }));
    }
  };

  // 移除标签
  const handleRemoveTag = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.filter(id => id !== tagId)
    }));
  };

  // 创建新标签
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      setCreatingTag(true);
      const newTag = await tagsAPI.createTag({
        name: newTagName.trim(),
        slug: generateSlug(newTagName.trim())
      });

      setAvailableTags(prev => [...prev, newTag]);
      handleAddTag(newTag.id);
      setNewTagName('');
      toast.success('标签创建成功');
    } catch (err: any) {
      toast.error(err.message || '创建标签失败');
    } finally {
      setCreatingTag(false);
    }
  };

  // 保存文章
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('请输入文章标题');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('请输入文章内容');
      return;
    }

    try {
      setSaving(true);

      await postsAPI.updatePost(postId, {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim(),
        featured_image: formData.featured_image.trim() || undefined,
        status: formData.status,
        is_featured: formData.is_featured,
        category_id: formData.category_id || undefined,
        tag_ids: formData.tag_ids
      });

      toast.success('文章保存成功');
      router.push('/admin/posts');
    } catch (err: any) {
      toast.error(err.message || '保存文章失败');
    } finally {
      setSaving(false);
    }
  };

  // 预览文章
  const handlePreview = () => {
    if (formData.slug) {
      window.open(`/posts/${formData.slug}`, '_blank');
    } else {
      toast.error('请先设置文章slug');
    }
  };

  // 获取选中的标签
  const selectedTags = availableTags.filter(tag => formData.tag_ids.includes(tag.id));

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

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-20" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
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
            <h1 className="text-3xl font-bold text-foreground">编辑文章</h1>
            <p className="text-muted-foreground">修改文章内容和设置</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            预览
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 主要内容 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>文章内容</CardTitle>
              <CardDescription>编辑文章的基本信息和内容</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 标题 */}
              <div className="space-y-2">
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="输入文章标题"
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">URL别名 *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="文章的URL别名"
                />
                <p className="text-xs text-muted-foreground">
                  文章的URL地址：/posts/{formData.slug}
                </p>
              </div>

              {/* 摘要 */}
              <div className="space-y-2">
                <Label htmlFor="excerpt">摘要</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  placeholder="输入文章摘要"
                  rows={3}
                />
              </div>

              {/* 内容 */}
              <div className="space-y-2">
                <Label htmlFor="content">内容 *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="输入文章内容（支持Markdown格式）"
                  rows={20}
                  className="font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 发布设置 */}
          <Card>
            <CardHeader>
              <CardTitle>发布设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 状态 */}
              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'draft' | 'published' | 'archived') => 
                    handleInputChange('status', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 精选文章 */}
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">精选文章</Label>
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 分类 */}
          <Card>
            <CardHeader>
              <CardTitle>分类</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.category_id?.toString() || '0'}
                onValueChange={(value) => 
                  handleInputChange('category_id', value === '0' ? null : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">无分类</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* 标签 */}
          <Card>
            <CardHeader>
              <CardTitle>标签</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 已选标签 */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                      {tag.name}
                      <button
                        onClick={() => handleRemoveTag(tag.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* 选择标签 */}
              <Select onValueChange={(value) => handleAddTag(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="添加标签" />
                </SelectTrigger>
                <SelectContent>
                  {availableTags
                    .filter(tag => !formData.tag_ids.includes(tag.id))
                    .map((tag) => (
                      <SelectItem key={tag.id} value={tag.id.toString()}>
                        {tag.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* 创建新标签 */}
              <div className="flex gap-2">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="新标签名称"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                />
                <Button
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || creatingTag}
                >
                  {creatingTag ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 特色图片 */}
          <Card>
            <CardHeader>
              <CardTitle>特色图片</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="featured_image">图片URL</Label>
                <Input
                  id="featured_image"
                  value={formData.featured_image}
                  onChange={(e) => handleInputChange('featured_image', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {formData.featured_image && (
                <div className="space-y-2">
                  <Label>预览</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={formData.featured_image}
                      alt="特色图片预览"
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg?height=128&width=256';
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function EditPostPage() {
  return (
    <AuthGuard>
      <EditPostPageContent />
    </AuthGuard>
  );
}