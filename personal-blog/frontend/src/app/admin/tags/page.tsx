"use client";

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Hash, TrendingUp } from 'lucide-react';
import { AuthGuard } from '@/components/AuthGuard';
import { 
  Button, 
  Input, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  Badge,
  Label,
  Textarea
} from '../../../presentation/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { tagsAPI, Tag, TagCreate, TagUpdate } from '@/lib/api/tags';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState<TagCreate>({
    name: '',
    slug: '',
    description: '',
  });

  // 加载标签数据
  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await tagsAPI.getTags();
      setTags(data);
    } catch (error) {
      console.error('加载标签失败:', error);
      toast.error("加载标签数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  // 筛选标签
  const filteredTags = (tags || []).filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tag.description && tag.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 创建标签
  const handleCreate = async () => {
    try {
      if (!formData.name.trim() || !formData.slug.trim()) {
        toast.error("标签名称和别名不能为空");
        return;
      }

      await tagsAPI.createTag(formData);
      toast.success("标签创建成功");
      
      setIsCreateDialogOpen(false);
      setFormData({ name: '', slug: '', description: '' });
      loadTags();
    } catch (error) {
      console.error('创建标签失败:', error);
      toast.error("创建标签失败");
    }
  };

  // 编辑标签
  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      slug: tag.slug,
      description: tag.description || '',
    });
    setIsEditDialogOpen(true);
  };

  // 更新标签
  const handleUpdate = async () => {
    if (!editingTag) return;

    try {
      if (!formData.name.trim() || !formData.slug.trim()) {
        toast.error("标签名称和别名不能为空");
        return;
      }

      await tagsAPI.updateTag(editingTag.id, formData);
      toast.success("标签更新成功");
      
      setIsEditDialogOpen(false);
      setEditingTag(null);
      setFormData({ name: '', slug: '', description: '' });
      loadTags();
    } catch (error) {
      console.error('更新标签失败:', error);
      toast.error("更新标签失败");
    }
  };

  // 删除标签
  const handleDelete = async (tag: Tag) => {
    if (!confirm(`确定要删除标签"${tag.name}"吗？`)) return;

    try {
      await tagsAPI.deleteTag(tag.id);
      toast.success("标签删除成功");
      loadTags();
    } catch (error) {
      console.error('删除标签失败:', error);
      toast.error("删除标签失败");
    }
  };

  // 自动生成slug
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // 获取热门标签
  const getPopularTags = () => {
    return (tags || [])
      .filter(tag => tag.post_count > 0)
      .sort((a, b) => b.post_count - a.post_count)
      .slice(0, 5);
  };

  const TagForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">标签名称 *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => {
            const name = e.target.value;
            setFormData({
              ...formData,
              name,
              slug: isEdit ? formData.slug : generateSlug(name),
            });
          }}
          placeholder="输入标签名称"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="slug">标签别名 *</Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          placeholder="输入标签别名（用于URL）"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">标签描述</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="输入标签描述"
          rows={3}
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false);
              setEditingTag(null);
            } else {
              setIsCreateDialogOpen(false);
            }
            setFormData({ name: '', slug: '', description: '' });
          }}
        >
          取消
        </Button>
        <Button onClick={isEdit ? handleUpdate : handleCreate}>
          {isEdit ? '更新' : '创建'}
        </Button>
      </div>
    </div>
  );

  return (
    <AuthGuard requireAdmin>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">标签管理</h1>
            <p className="text-muted-foreground">管理博客文章标签</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新建标签
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建新标签</DialogTitle>
              </DialogHeader>
              <TagForm />
            </DialogContent>
          </Dialog>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总标签数</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(tags || []).length}</div>
              <p className="text-xs text-muted-foreground">
                已创建的标签总数
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">文章总数</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(tags || []).reduce((sum, tag) => sum + tag.post_count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                所有标签下的文章总数
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃标签</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(tags || []).filter(tag => tag.post_count > 0).length}
              </div>
              <p className="text-xs text-muted-foreground">
                有文章关联的标签数
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均文章数</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(tags || []).length > 0 
                  ? Math.round((tags || []).reduce((sum, tag) => sum + tag.post_count, 0) / (tags || []).length)
                  : 0
                }
              </div>
              <p className="text-xs text-muted-foreground">
                每个标签的平均文章数
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 热门标签 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              热门标签
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {getPopularTags().map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-sm">
                  {tag.name} ({tag.post_count})
                </Badge>
              ))}
              {getPopularTags().length === 0 && (
                <p className="text-muted-foreground">暂无热门标签</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 搜索和筛选 */}
        <Card>
          <CardHeader>
            <CardTitle>标签列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索标签名称、别名或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 标签表格 */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>标签名称</TableHead>
                    <TableHead>别名</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>文章数</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <td colSpan={6} className="text-center py-8 p-2 align-middle">
                        加载中...
                      </td>
                    </TableRow>
                  ) : filteredTags.length === 0 ? (
                    <TableRow>
                      <td colSpan={6} className="text-center py-8 p-2 align-middle">
                        {searchQuery ? '没有找到匹配的标签' : '暂无标签数据'}
                      </td>
                    </TableRow>
                  ) : (
                    filteredTags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell className="font-medium">{tag.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{tag.slug}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {tag.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={tag.post_count > 0 ? "default" : "outline"}
                          >
                            {tag.post_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(tag.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(tag)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(tag)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 编辑对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑标签</DialogTitle>
            </DialogHeader>
            <TagForm isEdit />
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
