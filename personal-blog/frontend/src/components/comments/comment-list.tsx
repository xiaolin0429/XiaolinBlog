"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  ThumbsUp, 
  Reply, 
  MoreHorizontal,
  User,
  Calendar,
  Globe
} from 'lucide-react';
import { Comment, commentsApi } from '@/lib/api/comments';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface CommentListProps {
  postId: number;
  showTitle?: boolean;
}

interface CommentItemProps {
  comment: Comment;
  onReply: (comment: Comment) => void;
  onLike: (commentId: number) => void;
  level?: number;
}

const CommentItem = ({ comment, onReply, onLike, level = 0 }: CommentItemProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.like_count);

  const handleLike = async () => {
    if (liked) return;
    
    try {
      await onLike(comment.id);
      setLiked(true);
      setLikeCount(prev => prev + 1);
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: zhCN
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`${level > 0 ? 'ml-8 mt-4' : ''}`}>
      <div className="flex gap-3">
        {/* 头像 */}
        <div className="flex-shrink-0">
          {comment.author?.avatar ? (
            <img
              src={`http://localhost:8000${comment.author.avatar}`}
              alt={comment.author_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* 评论内容 */}
        <div className="flex-1 min-w-0">
          <div className="bg-muted rounded-lg p-4">
            {/* 评论头部 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comment.author_name}</span>
                {comment.author_website && (
                  <a
                    href={comment.author_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Globe className="h-3 w-3" />
                  </a>
                )}
                {!comment.is_approved && (
                  <Badge variant="outline" className="text-xs">
                    待审核
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(comment.created_at)}
              </div>
            </div>

            {/* 评论内容 */}
            <div className="text-sm text-foreground mb-3 whitespace-pre-wrap">
              {comment.content}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 ${liked ? 'text-blue-600' : 'text-muted-foreground'}`}
                onClick={handleLike}
                disabled={liked}
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                {likeCount > 0 && likeCount}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground"
                onClick={() => onReply(comment)}
              >
                <Reply className="h-3 w-3 mr-1" />
                回复
              </Button>
            </div>
          </div>

          {/* 回复列表 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onLike={onLike}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CommentList({ postId, showTitle = true }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await commentsApi.getCommentsByPost(postId);
      
      // 构建评论树结构
      const commentMap = new Map<number, Comment>();
      const rootComments: Comment[] = [];

      // 先将所有评论放入map
      data.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      // 构建树结构
      data.forEach(comment => {
        const commentWithReplies = commentMap.get(comment.id)!;
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(commentWithReplies);
          }
        } else {
          rootComments.push(commentWithReplies);
        }
      });

      setComments(rootComments);
    } catch (err) {
      setError('加载评论失败');
      console.error('加载评论失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = (comment: Comment) => {
    // 这里可以触发回复表单的显示
    console.log('回复评论:', comment);
  };

  const handleLike = async (commentId: number) => {
    try {
      await commentsApi.likeComment(commentId);
    } catch (error) {
      console.error('点赞失败:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-16 bg-muted rounded"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted rounded w-12"></div>
                    <div className="h-6 bg-muted rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={loadComments}
            >
              重新加载
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            评论 ({comments.length})
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-6">
        {comments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无评论，来发表第一条评论吧！</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id}>
                <CommentItem
                  comment={comment}
                  onReply={handleReply}
                  onLike={handleLike}
                />
                {comment !== comments[comments.length - 1] && (
                  <Separator className="mt-6" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}