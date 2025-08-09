"use client";

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tag } from 'lucide-react';
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
import { categoriesAPI, Category, CategoryCreate, CategoryUpdate } from '@/lib/api/categories';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryCreate>({
    name: '',
    slug: '',
    description: '',
  });

  // 加载分类数据
  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesAPI.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('加载分类失败:', error);
      toast.error("加载分类数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // 筛选分类
  const filteredCategories = (categories || []).filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 创建分类
  const handleCreate = async () => {
    try {
      if (!formData.name.trim() || !formData.slug.trim()) {
        toast.error("分类名称和别名不能为空");
        return;
      }

      await categoriesAPI.createCategory(formData);
      toast.success("分类创建成功");
      
      setIsCreateDialogOpen(false);
      setFormData({ name: '', slug: '', description: '' });
      loadCategories();
    } catch (error) {
      console.error('创建分类失败:', error);
      toast.error("创建分类失败");
    }
  };

  // 编辑分类
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    });
    setIsEditDialogOpen(true);
  };

  // 更新分类
  const handleUpdate = async () => {
    if (!editingCategory) return;

    try {
      if (!formData.name.trim() || !formData.slug.trim()) {
        toast.error("分类名称和别名不能为空");
        return;
      }

      await categoriesAPI.updateCategory(editingCategory.id, formData);
      toast.success("分类更新成功");
      
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '' });
      loadCategories();
    } catch (error) {
      console.error('更新分类失败:', error);
      toast.error("更新分类失败");
    }
  };

  // 删除分类
  const handleDelete = async (category: Category) => {
    if (!confirm(`确定要删除分类"${category.name}"吗？`)) return;

    try {
      await categoriesAPI.deleteCategory(category.id);
      toast.success("分类删除成功");
      loadCategories();
    } catch (error) {
      console.error('删除分类失败:', error);
      toast.error("删除分类失败");
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

  const CategoryForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">分类名称 *</Label>
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
          placeholder="输入分类名称"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="slug">分类别名 *</Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          placeholder="输入分类别名（用于URL）"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">分类描述</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="输入分类描述"
          rows={3}
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false);
              setEditingCategory(null);
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
            <h1 className="text-3xl font-bold">分类管理</h1>
            <p className="text-muted-foreground">管理博客文章分类</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新建分类
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建新分类</DialogTitle>
              </DialogHeader>
              <CategoryForm />
            </DialogContent>
          </Dialog>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总分类数</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(categories || []).length}</div>
              <p className="text-xs text-muted-foreground">
                已创建的分类总数
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">文章总数</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(categories || []).reduce((sum, cat) => sum + cat.post_count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                所有分类下的文章总数
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均文章数</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(categories || []).length > 0 
                  ? Math.round((categories || []).reduce((sum, cat) => sum + cat.post_count, 0) / (categories || []).length)
                  : 0
                }
              </div>
              <p className="text-xs text-muted-foreground">
                每个分类的平均文章数
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <Card>
          <CardHeader>
            <CardTitle>分类列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索分类名称、别名或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 分类表格 */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>分类名称</TableHead>
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
                  ) : filteredCategories.length === 0 ? (
                    <TableRow>
                      <td colSpan={6} className="text-center py-8 p-2 align-middle">
                        {searchQuery ? '没有找到匹配的分类' : '暂无分类数据'}
                      </td>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{category.slug}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {category.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{category.post_count}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(category.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(category)}
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
              <DialogTitle>编辑分类</DialogTitle>
            </DialogHeader>
            <CategoryForm isEdit />
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
