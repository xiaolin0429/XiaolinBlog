"use client"

import { useState } from 'react';
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
import { 
  Save, 
  X,
  Plus,
  Loader2,
  Settings,
  FileText,
  CheckCircle
} from 'lucide-react';
import { PostFormData } from '@/hooks/use-post-editor';
import type { Category } from '@/lib/api/categories';
import type { Tag } from '@/lib/api/tags';

interface PostConfigDialogProps {
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
}

export function PostConfigDialog({
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
  saving = false
}: PostConfigDialogProps) {
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);
  const [step, setStep] = useState<'basic' | 'advanced'>('basic');

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
    const success = await onSaveAll();
    if (success) {
      onOpenChange(false);
    }
  };

  // 处理仅保存配置
  const handleSaveConfigOnly = async () => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            完善文章信息
          </DialogTitle>
          <DialogDescription>
            为了更好的展示效果，建议完善以下文章信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 步骤指示器 */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setStep('basic')}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                step === 'basic' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${step === 'basic' ? 'bg-white' : 'bg-current'}`} />
              基础信息
            </button>
            <div className="w-8 h-px bg-border" />
            <button
              onClick={() => setStep('advanced')}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                step === 'advanced' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${step === 'advanced' ? 'bg-white' : 'bg-current'}`} />
              高级设置
            </button>
          </div>

          {/* 基础信息步骤 */}
          {step === 'basic' && (
            <div className="space-y-4">
              {/* 文章标题 */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  文章标题 *
                </Label>
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
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  建议长度：100-200字符
                </p>
              </div>

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
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* 高级设置步骤 */}
          {step === 'advanced' && (
            <div className="space-y-4">
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

              {/* 特色图片 */}
              <div className="space-y-2">
                <Label htmlFor="featured_image">特色图片URL</Label>
                <Input
                  id="featured_image"
                  value={formData.featured_image}
                  onChange={(e) => onUpdateField('featured_image', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* 精选文章 */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="featured" className="text-sm font-medium">
                    精选文章
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    精选文章将在首页显示
                  </p>
                </div>
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => onUpdateField('is_featured', checked)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* 步骤导航 */}
          {step === 'basic' ? (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={handleSkip} className="flex-1">
                跳过配置
              </Button>
              <Button onClick={() => setStep('advanced')} className="flex-1">
                下一步
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => setStep('basic')}>
                上一步
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}