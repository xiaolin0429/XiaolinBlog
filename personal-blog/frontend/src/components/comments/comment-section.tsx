"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send, Reply, Heart, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { commentsApi, Comment } from '@/lib/api/comments';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CommentSectionProps {
  postId: number;
  initialCount?: number;
}

interface CommentFormData {
  content: string;
  author_name: string;
  author_email: string;
  author_website?: string;
  parent_id?: number;
}

export default function CommentSection({ postId, initialCount = 0 }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [formData, setFormData] = useState<CommentFormData>({
    content: '',
    author_name: '',
    author_email: '',
    author_website: ''
  });
  
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // 加载评论
  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await commentsApi.getCommentsByPost(postId);
      setComments(response);
    } catch (error) {
      console.error('加载评论失败:', error);
      toast.error('加载评论失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  // 提交评论
  const handleSubmit = async (e: React.FormEvent, parentId?: number) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      toast.error('请输入评论内容');
      return;
    }

    if (!isAuthenticated && (!formData.author_name.trim() || !formData.author_email.trim())) {
      toast.error('请填写姓名和邮箱');
      return;
    }

    try {
      setSubmitting(true);
      
      const commentData = {
        content: formData.content.trim(),
        post_id: postId,
        parent_id: parentId || undefined,
        author_name: isAuthenticated ? user?.username || '' : formData.author_name,
        author_email: isAuthenticated ? user?.email || '' : formData.author_email,
        author_website: formData.author_website || undefined
      };

      await commentsApi.createComment(commentData);
      
      // 重新加载评论
      await loadComments();
      
      // 重置表单
      setFormData({
        content: '',
        author_name: isAuthenticated ? user?.username || '' : '',
        author_email: isAuthenticated ? user?.email || '' : '',
        author_website: ''
      });
      
      setReplyingTo(null);
      toast.success('评论提交成功，等待审核');
    } catch (error) {
      console.error('提交评论失败:', error);
      toast.error('提交评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染评论表单
  const renderCommentForm = (parentId?: number) => (
    <form onSubmit={(e) => handleSubmit(e, parentId)} className="space-y-4">
      <div>
        <Label htmlFor="content">评论内容 *</Label>
        <Textarea
          id="content"
          placeholder="写下你的想法..."
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="min-h-[100px] resize-none"
          required
        />
      </div>
      
      {!isAuthenticated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="author_name">姓名 *</Label>
            <Input
              id="author_name"
              type="text"
              placeholder="请输入您的姓名"
              value={formData.author_name}
              onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="author_email">邮箱 *</Label>
            <Input
              id="author_email"
              type="email"
              placeholder="请输入您的邮箱"
              value={formData.author_email}
              onChange={(e) => setFormData({ ...formData, author_email: e.target.value })}
              required
            />
          </div>
        </div>
      )}
      
      {!isAuthenticated && (
        <div>
          <Label htmlFor="author_website">网站 (可选)</Label>
          <Input
            id="author_website"
            type="url"
            placeholder="https://your-website.com"
            value={formData.author_website}
            onChange={(e) => setFormData({ ...formData, author_website: e.target.value })}
          />
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting}>
          <Send className="h-4 w-4 mr-2" />
          {submitting ? '提交中...' : '发表评论'}
        </Button>
        {parentId && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setReplyingTo(null)}
          >
            取消回复
          </Button>
        )}
      </div>
    </form>
  );

  // 渲染单个评论（只渲染已审核的评论）
  const renderComment = (comment: Comment, level = 0) => {
    // 前台只显示已审核的评论
    if (!comment.is_approved) {
      return null;
    }

    return (
      <div key={comment.id} className={`${level > 0 ? 'ml-8 mt-4' : 'mb-6'}`}>
        <Card className="border-l-4 border-l-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {(comment.author_name || '匿名').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {comment.author_name || '匿名用户'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(comment.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                  </span>
                </div>
                
                <div className="text-foreground leading-relaxed">
                  {comment.content}
                </div>
                
                <div className="flex items-center gap-4 pt-2">
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Heart className="h-3 w-3 mr-1" />
                    <span className="text-xs">赞</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => setReplyingTo(comment.id)}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    <span className="text-xs">回复</span>
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Flag className="h-3 w-3 mr-1" />
                    <span className="text-xs">举报</span>
                  </Button>
                </div>
                
                {/* 回复表单 */}
                {replyingTo === comment.id && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-3">
                      回复 @{comment.author_name}
                    </h4>
                    {renderCommentForm(comment.id)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 渲染子评论（只渲染已审核的回复） */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4">
            {comment.replies
              .filter(reply => reply.is_approved) // 只显示已审核的回复
              .map(reply => renderComment(reply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-xl font-semibold">
          评论 ({comments.length})
        </h3>
      </div>

      {/* 评论表单 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">发表评论</CardTitle>
        </CardHeader>
        <CardContent>
          {renderCommentForm()}
        </CardContent>
      </Card>

      {/* 评论列表 */}
      <div>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments
              .filter(comment => !comment.parent_id && comment.is_approved) // 只显示顶级且已审核的评论
              .map(comment => renderComment(comment))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                还没有评论，来发表第一个评论吧！
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}