"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X,
  Plus,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { useState } from 'react';
import { PostFormData } from '@/hooks/use-post-editor';
import type { Category } from '@/lib/api/categories';
import type { Tag } from '@/lib/api/tags';

interface PostConfigFormProps {
  formData: PostFormData;
  categories: Category[];
  tags: Tag[];
  selectedTags: Tag[];
  onUpdateField: (field: keyof PostFormData, value: any) => void;
  onAddTag: (tagId: number) => void;
  onRemoveTag: (tagId: number) => void;
  onCreateTag: (name: string) => Promise<Tag | null>;
  saving?: boolean;
  className?: string;
}

export function PostConfigForm({
  formData,
  categories,
  tags,
  selectedTags,
  onUpdateField,
  onAddTag,
  onRemoveTag,
  onCreateTag,
  saving = false,
  className = ""
}: PostConfigFormProps) {
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);

  // 创建新标签
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      setCreatingTag(true);
      const newTag = await onCreateTag(newTagName.trim());
      if (newTag) {
        onAddTag(newTag.id);
        setNewTagName('');
      }
    } finally {
      setCreatingTag(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 基础信息 */}
      <Card>
        <CardHeader>
          <CardTitle>基础信息</CardTitle>
          <CardDescription>设置文章的基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 文章标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">文章标题 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => onUpdateField('title', e.target.value)}
              placeholder="输入一个吸引人的标题..."
              className="text-lg font-medium"
            />
          </div>

          {/* URL别名 */}
          <div className="space-y-2">
            <Label htmlFor="slug">URL别名</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => onUpdateField('slug', e.target.value)}
              placeholder="url-slug"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              文章链接：/posts/{formData.slug || 'your-slug'}
            </p>
          </div>

          {/* 摘要 */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">文章摘要</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => onUpdateField('excerpt', e.target.value)}
              placeholder="简要描述文章内容，用于搜索引擎优化和文章列表展示..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              建议长度：100-200字符，有助于SEO优化
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 分类和标签 */}
      <Card>
        <CardHeader>
          <CardTitle>分类和标签</CardTitle>
          <CardDescription>为文章选择合适的分类和标签</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 分类选择 */}
          <div className="space-y-2">
            <Label>文章分类</Label>
            <Select
              value={formData.category_id?.toString() || '0'}
              onValueChange={(value) => 
                onUpdateField('category_id', value === '0' ? null : parseInt(value))
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
          </div>

          {/* 已选标签 */}
          {selectedTags.length > 0 && (
            <div className="space-y-2">
              <Label>已选标签</Label>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                    {tag.name}
                    <button
                      onClick={() => onRemoveTag(tag.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 选择标签 */}
          <div className="space-y-2">
            <Label>添加标签</Label>
            <Select onValueChange={(value) => onAddTag(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="选择标签" />
              </SelectTrigger>
              <SelectContent>
                {tags
                  .filter(tag => !formData.tag_ids.includes(tag.id))
                  .map((tag) => (
                    <SelectItem key={tag.id} value={tag.id.toString()}>
                      {tag.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* 创建新标签 */}
          <div className="space-y-2">
            <Label>创建新标签</Label>
            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="输入新标签名称"
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
          </div>
        </CardContent>
      </Card>

      {/* 特色图片 */}
      <Card>
        <CardHeader>
          <CardTitle>特色图片</CardTitle>
          <CardDescription>设置文章的封面图片</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="featured_image">图片URL</Label>
            <Input
              id="featured_image"
              value={formData.featured_image}
              onChange={(e) => onUpdateField('featured_image', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* 图片预览 */}
          {formData.featured_image && (
            <div className="space-y-2">
              <Label>预览</Label>
              <div className="border rounded-lg overflow-hidden bg-muted">
                <img
                  src={formData.featured_image}
                  alt="特色图片预览"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg?height=192&width=384';
                  }}
                />
              </div>
            </div>
          )}

          {/* 上传按钮占位 */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              拖拽图片到此处或点击上传
            </p>
            <Button variant="outline" size="sm" disabled>
              <Upload className="h-4 w-4 mr-2" />
              选择图片
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              支持 JPG、PNG、GIF 格式，建议尺寸 1200x630px
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 发布设置 */}
      <Card>
        <CardHeader>
          <CardTitle>发布设置</CardTitle>
          <CardDescription>控制文章的发布状态和可见性</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 发布状态 */}
          <div className="space-y-2">
            <Label>发布状态</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'draft' | 'published' | 'archived') => 
                onUpdateField('status', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    草稿
                  </div>
                </SelectItem>
                <SelectItem value="published">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    已发布
                  </div>
                </SelectItem>
                <SelectItem value="archived">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                    已归档
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 精选文章 */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="featured" className="text-sm font-medium">
                精选文章
              </Label>
              <p className="text-xs text-muted-foreground">
                精选文章将在首页和推荐位置显示
              </p>
            </div>
            <Switch
              id="featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => onUpdateField('is_featured', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}