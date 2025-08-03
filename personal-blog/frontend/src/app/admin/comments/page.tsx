"use client";

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, MoreHorizontal, Search, Filter, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { commentsApi, Comment } from '@/lib/api/comments';
import { toast } from 'sonner';

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 加载评论数据
  const loadComments = async () => {
    try {
      setLoading(true);
      
      // 使用 commentsApi 来获取评论数据，它会自动携带Cookie和Token
      const data = await commentsApi.getAllComments();
      
      // 转换数据格式以匹配前端期望的结构
      const transformedData = data.map((comment: Comment) => ({
        ...comment,
        status: comment.is_spam ? 'spam' as const : (comment.is_approved ? 'approved' as const : 'pending' as const),
        author_name: comment.author?.full_name || comment.author_name || '匿名用户',
        author_email: comment.author?.email || comment.author_email || '',
        post_title: `文章 ID: ${comment.post_id}` // 临时解决方案，后续可以通过关联查询获取真实标题
      }));
      
      setComments(transformedData);
    } catch (error) {
      console.error('加载评论失败:', error);
      toast.error(`加载评论失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">已审核</Badge>;
      case 'pending':
        return <Badge variant="secondary">待审核</Badge>;
      case 'spam':
        return <Badge variant="destructive">垃圾评论</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const handleStatusChange = async (commentId: number, newStatus: 'pending' | 'approved' | 'spam') => {
    try {
      // 使用 commentsApi 来更新评论状态
      await commentsApi.updateCommentStatus(commentId, newStatus);
      
      // 更新本地状态
      setComments(comments.map(comment => 
        comment.id === commentId ? { ...comment, status: newStatus } : comment
      ));
      
      toast.success(`评论状态已更新为${newStatus === 'approved' ? '已审核' : newStatus === 'spam' ? '垃圾评论' : '待审核'}`);
    } catch (error) {
      console.error('更新评论状态失败:', error);
      toast.error("更新评论状态失败");
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('确定要删除这条评论吗？')) return;
    
    try {
      // 使用 commentsApi 来删除评论
      await commentsApi.deleteComment(commentId);
      
      setComments(comments.filter(comment => comment.id !== commentId));
      toast.success("评论删除成功");
    } catch (error) {
      console.error('删除评论失败:', error);
      toast.error("删除评论失败");
    }
  };

  const filteredComments = comments.filter(comment => {
    const matchesSearch = comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.post_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || comment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: comments.length,
    approved: comments.filter(c => c.status === 'approved').length,
    pending: comments.filter(c => c.status === 'pending').length,
    spam: comments.filter(c => c.status === 'spam').length
  };

  const CommentsPageContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">评论管理</h1>
          <p className="mt-2 text-gray-600">管理和审核网站评论</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总评论数</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已审核</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待审核</CardTitle>
              <XCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">垃圾评论</CardTitle>
              <Trash2 className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.spam}</div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <Card>
          <CardHeader>
            <CardTitle>评论列表</CardTitle>
            <CardDescription>管理和审核所有评论</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索评论内容、作者或文章标题..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="筛选状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="approved">已审核</SelectItem>
                  <SelectItem value="pending">待审核</SelectItem>
                  <SelectItem value="spam">垃圾评论</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 评论表格 */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>评论内容</TableHead>
                    <TableHead>作者</TableHead>
                    <TableHead>文章</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={comment.content}>
                          {comment.content}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{comment.author_name}</div>
                          <div className="text-sm text-gray-500">{comment.author_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={comment.post_title}>
                          {comment.post_title}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(comment.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(comment.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {comment.status !== 'approved' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(comment.id, 'approved')}
                                className="text-green-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                审核通过
                              </DropdownMenuItem>
                            )}
                            {comment.status !== 'spam' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(comment.id, 'spam')}
                                className="text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                标记垃圾
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(comment.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除评论
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredComments.length === 0 && (
              <div className="text-center py-8">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">暂无评论</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all' ? '没有找到匹配的评论' : '还没有任何评论'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <AuthGuard requireAdmin>
      <CommentsPageContent />
    </AuthGuard>
  );
}