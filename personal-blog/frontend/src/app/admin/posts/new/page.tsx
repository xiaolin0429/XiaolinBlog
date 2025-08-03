"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { ArrowLeft, Save, Eye, Upload, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { postsAPI, type PostCreate } from '@/lib/api/posts';
import { categoriesAPI, type Category } from '@/lib/api/categories';
import { tagsAPI, type Tag } from '@/lib/api/tags';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthGuard } from '@/components/AuthGuard';

function NewPostPageContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<PostCreate>({
    title: '',
    content: '',
    excerpt: '',
    slug: '',
    status: 'draft',
    is_featured: false,
    cover_image: '',
    category_id: undefined,
    tag_ids: [],
  });

  // 获取分类和标签数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsDataLoading(true);
        setError(null);
        
        const [categoriesData, tagsData] = await Promise.all([
          categoriesAPI.getCategories(),
          tagsAPI.getTags()
        ]);
        
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setTags(Array.isArray(tagsData) ? tagsData : []);
      } catch (error) {
        console.error('获取数据失败:', error);
        setError('获取分类和标签数据失败，请刷新页面重试');
        toast.error('获取数据失败');
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, []);

  // 自动生成slug
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // 处理表单字段变化
  const handleFieldChange = (field: keyof PostCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // 自动生成slug
      ...(field === 'title' && { slug: generateSlug(value) })
    }));
  };

  // 处理标签选择
  const handleTagToggle = (tagId: number) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId];
      
      setFormData(prevForm => ({
        ...prevForm,
        tag_ids: newTags
      }));
      
      return newTags;
    });
  };

  // 创建新标签
  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error('请输入标签名称');
      return;
    }

    try {
      const newTag = await tagsAPI.createTag({
        name: newTagName.trim(),
        slug: generateSlug(newTagName.trim())
      });

      setTags(prev => [...prev, newTag]);
      setSelectedTags(prev => [...prev, newTag.id]);
      setFormData(prev => ({
        ...prev,
        tag_ids: [...(prev.tag_ids || []), newTag.id]
      }));
      setNewTagName('');
      toast.success('标签创建成功');
    } catch (error) {
      toast.error('创建标签失败');
    }
  };

  // 自动生成摘要
  const generateExcerpt = () => {
    if (formData.content) {
      const plainText = formData.content
        .replace(/[#*`>\-\[\]()]/g, '')
        .replace(/\n/g, ' ')
        .trim();
      const excerpt = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
      handleFieldChange('excerpt', excerpt);
      toast.success('摘要已自动生成');
    } else {
      toast.error('请先输入文章内容');
    }
  };

  // 保存文章
  const handleSave = async (status: 'draft' | 'published') => {
    if (!formData.title.trim()) {
      toast.error('请输入文章标题');
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error('请输入文章内容');
      return;
    }

    setIsLoading(true);
    
    try {
      const postData = {
        ...formData,
        status,
        excerpt: formData.excerpt || formData.content.substring(0, 200) + '...'
      };
      
      const response = await postsAPI.createPost(postData);
      
      if (!response) {
        toast.error('创建文章失败');
        return;
      }
      
      toast.success(status === 'draft' ? '草稿保存成功' : '文章发布成功');
      router.push('/admin/posts');
    } catch (error) {
      console.error('保存文章失败:', error);
      toast.error('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 预览文章
  const handlePreview = () => {
    if (formData.slug) {
      window.open(`/posts/${formData.slug}`, '_blank');
    } else {
      toast.error('请先输入文章标题生成slug');
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">创建新文章</h1>
            <p className="text-muted-foreground">撰写并发布您的文章</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={!formData.slug}>
            <Eye className="h-4 w-4 mr-2" />
            预览
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSave('draft')}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            保存草稿
          </Button>
          <Button 
            onClick={() => handleSave('published')}
            disabled={isLoading}
          >
            发布文章
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 主要内容区域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 文章标题 */}
          <Card>
            <CardHeader>
              <CardTitle>文章信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="输入文章标题..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="slug">URL别名</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleFieldChange('slug', e.target.value)}
                  placeholder="文章URL别名（自动生成）"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  预览URL: /posts/{formData.slug || 'your-post-slug'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 文章内容 */}
          <Card>
            <CardHeader>
              <CardTitle>文章内容</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => handleFieldChange('content', value)}
                placeholder="开始撰写您的文章..."
              />
            </CardContent>
          </Card>

          {/* 文章摘要 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>文章摘要</CardTitle>
              <Button variant="outline" size="sm" onClick={generateExcerpt}>
                自动生成
              </Button>
            </CardHeader>
            <CardContent>
              <textarea
                value={formData.excerpt}
                onChange={(e) => handleFieldChange('excerpt', e.target.value)}
                placeholder="输入文章摘要，用于文章列表展示..."
                className="w-full min-h-[100px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {(formData.excerpt || '').length}/300 字符
              </p>
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
              <div>
                <Label htmlFor="status">状态</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleFieldChange('status', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">设为精选</Label>
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => handleFieldChange('is_featured', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 分类选择 */}
          <Card>
            <CardHeader>
              <CardTitle>分类</CardTitle>
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select 
                  value={formData.category_id?.toString()} 
                  onValueChange={(value) => handleFieldChange('category_id', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* 标签选择 */}
          <Card>
            <CardHeader>
              <CardTitle>标签</CardTitle>
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 创建新标签 */}
                  <div className="flex gap-2">
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="创建新标签..."
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                    />
                    <Button size="sm" onClick={handleCreateTag} disabled={!newTagName.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* 标签列表 */}
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleTagToggle(tag.id)}
                      >
                        {tag.name}
                        {selectedTags.includes(tag.id) && (
                          <X className="h-3 w-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                  </div>
                  
                  {selectedTags.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">已选择的标签:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedTags.map((tagId) => {
                          const tag = tags.find(t => t.id === tagId);
                          return tag ? (
                            <Badge key={tagId} variant="secondary" className="text-xs">
                              {tag.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 封面图片 */}
          <Card>
            <CardHeader>
              <CardTitle>封面图片</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Input
                  value={formData.cover_image || ''}
                  onChange={(e) => handleFieldChange('cover_image', e.target.value)}
                  placeholder="输入图片URL..."
                />
                <Button variant="outline" size="sm" className="w-full" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  上传图片 (开发中)
                </Button>
                {formData.cover_image && (
                  <div className="mt-3">
                    <img
                      src={formData.cover_image}
                      alt="封面预览"
                      className="w-full h-32 object-cover rounded-md border"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg?height=128&width=256';
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function NewPostPage() {
  return (
    <AuthGuard>
      <NewPostPageContent />
    </AuthGuard>
  );
}