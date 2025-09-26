"use client"

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  X,
  Plus,
  Loader2,
  Settings,
  FileText,
  CheckCircle,
  Tag as TagIcon,
  Image as ImageIcon,
  Globe,
  Eye,
  AlertCircle
} from 'lucide-react';
import { PostFormData } from '@/hooks/use-post-editor';
import type { Category } from '@/lib/api/categories';
import type { Tag } from '@/lib/api/tags';

interface UnifiedPostConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: PostFormData;
  categories: Category[];
  tags: Tag[];
  selectedTags: Tag[];
  onUpdateField: (field: keyof PostFormData, value: any) => void;
  onAddTag: (tagId: number) => void;
  onRemoveTag: (tagId: number) => void;
  onCreateTag: (name: string) => Promise<Tag | null>;
  onSaveConfig: () => Promise<boolean>;
  onSaveAll: () => Promise<boolean>;
  onSkipConfig: () => void;
  saving?: boolean;
  isNewPost?: boolean;
}

export function UnifiedPostConfigDialog({
  open,
  onOpenChange,
  formData,
  categories,
  tags,
  selectedTags,
  onUpdateField,
  onAddTag,
  onRemoveTag,
  onCreateTag,
  onSaveConfig,
  onSaveAll,
  onSkipConfig,
  saving = false,
  isNewPost = false
}: UnifiedPostConfigDialogProps) {
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // 表单验证
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.title.trim()) {
      errors.push('文章标题不能为空');
    }
    
    if (!formData.slug.trim()) {
      errors.push('URL别名不能为空');
    }
    
    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.push('URL别名只能包含小写字母、数字和连字符');
    }
    
    if (formData.excerpt && formData.excerpt.length > 500) {
      errors.push('文章摘要不能超过500字符');
    }
    
    if (formData.featured_image && !isValidUrl(formData.featured_image)) {
      errors.push('特色图片URL格式不正确');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // URL验证
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

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

  // 处理保存并完成
  const handleSaveAndFinish = async () => {
    if (!validateForm()) {
      return;
    }
    
    const success = await onSaveAll();
    if (success) {
      onOpenChange(false);
    }
  };

  // 处理仅保存配置
  const handleSaveConfigOnly = async () => {
    if (!validateForm()) {
      return;
    }
    
    const success = await onSaveConfig();
    if (success) {
      onOpenChange(false);
    }
  };

  // 处理跳过配置
  const handleSkip = () => {
    onSkipConfig();
    onOpenChange(false);
  };

  // 键盘快捷键
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter 保存并完成
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSaveAndFinish();
      }
      
      // ESC 关闭弹窗
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // 自动生成slug
  const handleTitleChange = (title: string) => {
    onUpdateField('title', title);
    
    // 如果slug为空或与标题相关，自动生成新的slug
    if (!formData.slug || formData.slug === generateSlug(formData.title)) {
      const newSlug = generateSlug(title);
      onUpdateField('slug', newSlug);
    }
  };

  // 生成slug
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {isNewPost ? '完善文章信息' : '编辑文章配置'}
          </DialogTitle>
          <DialogDescription>
            配置文章的详细信息，提升展示效果和SEO优化
          </DialogDescription>
        </DialogHeader>

        {/* 验证错误提示 */}
        {validationErrors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-destructive font-medium mb-2">
              <AlertCircle className="h-4 w-4" />
              请修正以下问题：
            </div>
            <ul className="text-sm text-destructive space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-destructive rounded-full" />
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                基础信息
              </TabsTrigger>
              <TabsTrigger value="taxonomy" className="flex items-center gap-2">
                <TagIcon className="h-4 w-4" />
                分类标签
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                媒体设置
              </TabsTrigger>
              <TabsTrigger value="publish" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                发布设置
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              {/* 基础信息 */}
              <TabsContent value="basic" className="space-y-6 mt-0">
                <div className="grid gap-4">
                  {/* 文章标题 */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      文章标题 *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="输入一个吸引人的标题..."
                      className="text-lg font-medium"
                    />
                  </div>

                  {/* URL别名 */}
                  <div className="space-y-2">
                    <Label htmlFor="slug" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      URL别名 *
                    </Label>
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
                    <Label htmlFor="excerpt" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      文章摘要
                      <span className="text-xs text-muted-foreground">(推荐)</span>
                    </Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => onUpdateField('excerpt', e.target.value)}
                      placeholder="简要描述文章内容，有助于SEO和社交分享..."
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>建议长度：100-200字符</span>
                      <span>{formData.excerpt.length}/500</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* 分类标签 */}
              <TabsContent value="taxonomy" className="space-y-6 mt-0">
                <div className="grid gap-6">
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
                </div>
              </TabsContent>

              {/* 媒体设置 */}
              <TabsContent value="media" className="space-y-6 mt-0">
                <div className="space-y-4">
                  {/* 特色图片 */}
                  <div className="space-y-2">
                    <Label htmlFor="featured_image" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      特色图片URL
                    </Label>
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

                  {/* 上传提示 */}
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                      暂不支持直接上传，请使用图片URL
                    </p>
                    <p className="text-xs text-muted-foreground">
                      建议尺寸 1200x630px，支持 JPG、PNG、GIF 格式
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* 发布设置 */}
              <TabsContent value="publish" className="space-y-6 mt-0">
                <div className="grid gap-6">
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
                            发布
                          </div>
                        </SelectItem>
                        <SelectItem value="archived">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-500" />
                            归档
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

                  {/* 预览链接 */}
                  {formData.slug && (
                    <div className="p-4 bg-muted rounded-lg">
                      <Label className="text-sm font-medium mb-2 block">预览链接</Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-background px-2 py-1 rounded">
                          /posts/{formData.slug}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/posts/${formData.slug}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              跳过配置
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSaveConfigOnly} 
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              保存配置
            </Button>
            <Button 
              onClick={handleSaveAndFinish} 
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              完成
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center w-full">
            快捷键：Ctrl+Enter 完成，ESC 关闭
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}