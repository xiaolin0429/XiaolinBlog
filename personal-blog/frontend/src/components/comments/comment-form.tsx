"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, User, Mail, Globe } from 'lucide-react';
import { CommentCreate, commentsApi } from '@/lib/api/comments';

interface CommentFormProps {
  postId: number;
  parentId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  showTitle?: boolean;
}

export default function CommentForm({ 
  postId, 
  parentId, 
  onSuccess, 
  onCancel,
  placeholder = "写下您的评论...",
  showTitle = true 
}: CommentFormProps) {
  const [formData, setFormData] = useState({
    content: '',
    author_name: '',
    author_email: '',
    author_website: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      setError('请输入评论内容');
      return;
    }

    if (!formData.author_name.trim()) {
      setError('请输入您的姓名');
      return;
    }

    if (!formData.author_email.trim()) {
      setError('请输入您的邮箱');
      return;
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.author_email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const commentData: CommentCreate = {
        content: formData.content.trim(),
        author_name: formData.author_name.trim(),
        author_email: formData.author_email.trim(),
        author_website: formData.author_website.trim() || undefined,
        post_id: postId,
        parent_id: parentId
      };

      await commentsApi.createComment(commentData);
      
      setSuccess(true);
      setFormData({
        content: '',
        author_name: '',
        author_email: '',
        author_website: ''
      });

      // 延迟调用成功回调，让用户看到成功提示
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);

    } catch (err: any) {
      console.error('发布评论失败:', err);
      setError(err.response?.data?.detail || '发布评论失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      content: '',
      author_name: '',
      author_email: '',
      author_website: ''
    });
    setError(null);
    setSuccess(false);
    onCancel?.();
  };

  if (success) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <Send className="h-4 w-4" />
            <AlertDescription>
              {parentId ? '回复发布成功！' : '评论发布成功！'}
              {!parentId && '您的评论正在审核中，审核通过后将显示。'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {parentId ? '发表回复' : '发表评论'}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 评论内容 */}
          <div className="space-y-2">
            <Label htmlFor="content">
              {parentId ? '回复内容' : '评论内容'} *
            </Label>
            <Textarea
              id="content"
              name="content"
              placeholder={placeholder}
              value={formData.content}
              onChange={handleInputChange}
              rows={4}
              required
              disabled={loading}
              className="resize-none"
            />
          </div>

          {/* 个人信息 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="author_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                姓名 *
              </Label>
              <Input
                id="author_name"
                name="author_name"
                type="text"
                placeholder="请输入您的姓名"
                value={formData.author_name}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author_email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                邮箱 *
              </Label>
              <Input
                id="author_email"
                name="author_email"
                type="email"
                placeholder="请输入您的邮箱"
                value={formData.author_email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="author_website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              网站 (可选)
            </Label>
            <Input
              id="author_website"
              name="author_website"
              type="url"
              placeholder="请输入您的网站地址"
              value={formData.author_website}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex items-center gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  {parentId ? '发布回复中...' : '发布评论中...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {parentId ? '发布回复' : '发布评论'}
                </>
              )}
            </Button>

            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={loading}
              >
                取消
              </Button>
            )}
          </div>

          {/* 提示信息 */}
          <div className="text-xs text-muted-foreground">
            <p>* 必填项目</p>
            <p>您的邮箱地址不会被公开显示。评论可能需要审核后才能显示。</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}