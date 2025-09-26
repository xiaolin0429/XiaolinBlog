/**
 * 文章管理页面 - 移除新UI菜单重叠
 * 使用原始admin layout，移除新架构布局组件
 */

"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Skeleton
} from '../../../presentation/components/ui';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Trash2,
  Star,
  Calendar,
  User,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { postsAPI, type PostList } from '../../../lib/api/posts';

export default function PostsManagePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostList[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<PostList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [featuredFilter, setFeaturedFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // 获取文章列表
  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await postsAPI.getPosts({
        limit: 100, // 管理后台获取更多数据
        status: undefined // 获取所有状态的文章
      });
      
      setPosts(response);
      setFilteredPosts(response);
    } catch (err: any) {
      const errorMessage = err.message || '获取文章列表失败';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('获取文章列表失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchPosts();
  }, []);

  // 搜索和筛选
  useEffect(() => {
    let filtered = posts;

    // 搜索筛选
    if (searchQuery) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // 状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter);
    }

    // 精选筛选
    if (featuredFilter !== 'all') {
      filtered = filtered.filter(post => 
        featuredFilter === 'featured' ? post.is_featured : !post.is_featured
      );
    }

    setFilteredPosts(filtered);
  }, [posts, searchQuery, statusFilter, featuredFilter]);

  // 删除文章
  const handleDeletePost = async (postId: number) => {
    if (!confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
      return;
    }

    try {
      await postsAPI.deletePost(postId);
      setPosts(prev => prev.filter(post => post.id !== postId));
      toast.success('文章删除成功');
    } catch (error: any) {
      toast.error(error.message || '删除失败，请重试');
    }
  };

  // 切换精选状态
  const handleToggleFeatured = async (postId: number) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const updatedPost = await postsAPI.updatePost(postId, {
        is_featured: !post.is_featured
      });
      
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, is_featured: !p.is_featured } : p
      ));
      
      toast.success(post.is_featured ? '已取消精选' : '已设为精选');
    } catch (error: any) {
      toast.error(error.message || '操作失败，请重试');
    }
  };

  // 格式化日期
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default">已发布</Badge>;
      case 'draft':
        return <Badge variant="secondary">草稿</Badge>;
      case 'archived':
        return <Badge variant="outline">已归档</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-16" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 错误状态
  if (error && posts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-8 max-w-md mx-auto">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchPosts} variant="outline">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              重新加载
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">文章管理</h1>
          <p className="text-muted-foreground">管理您的博客文章</p>
        </div>
        
        <Button onClick={() => router.push('/admin/posts/editor')}>
          <Plus className="h-4 w-4 mr-2" />
          创建文章
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总文章数</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
            <p className="text-xs text-muted-foreground">
              全部文章
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已发布</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter(p => p.status === 'published').length}
            </div>
            <p className="text-xs text-muted-foreground">
              公开可见
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">草稿</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter(p => p.status === 'draft').length}
            </div>
            <p className="text-xs text-muted-foreground">
              待发布
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">精选文章</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter(p => p.is_featured).length}
            </div>
            <p className="text-xs text-muted-foreground">
              精选推荐
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索文章标题或内容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态" value={statusFilter === 'all' ? '' : 
                    statusFilter === 'published' ? '已发布' :
                    statusFilter === 'draft' ? '草稿' :
                    statusFilter === 'archived' ? '已归档' : statusFilter
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="published">已发布</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="archived">已归档</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="精选" value={featuredFilter === 'all' ? '' :
                    featuredFilter === 'featured' ? '精选' :
                    featuredFilter === 'normal' ? '普通' : featuredFilter
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="featured">精选</SelectItem>
                  <SelectItem value="normal">普通</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 文章列表 */}
      <Card>
        <CardHeader>
          <CardTitle>文章列表 ({filteredPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>文章</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>统计</TableHead>
                <TableHead>日期</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      {post.featured_image && (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-16 h-12 object-cover rounded border"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground truncate">
                            {post.title}
                          </h3>
                          {post.is_featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        {post.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {post.tags?.map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(post.status)}
                  </TableCell>
                  
                  <TableCell>
                    {post.category && (
                      <Badge variant="secondary">
                        {post.category.name}
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.view_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.comment_count}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.created_at)}
                      </div>
                      {post.published_at && (
                        <div className="text-xs text-muted-foreground">
                          发布: {formatDate(post.published_at)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/posts/${post.slug}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          查看
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/posts/editor?id=${post.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleFeatured(post.id)}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          {post.is_featured ? '取消精选' : '设为精选'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeletePost(post.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || featuredFilter !== 'all' 
                  ? '没有找到匹配的文章' 
                  : '还没有文章，点击上方按钮创建第一篇文章吧！'
                }
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}