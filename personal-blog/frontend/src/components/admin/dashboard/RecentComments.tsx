import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button, Avatar, AvatarFallback, AvatarImage } from '../../../presentation/components/ui';
import { MessageSquare, Clock } from 'lucide-react';
import Link from 'next/link';

// 定义本地接口类型，避免依赖外部API类型
interface Comment {
  id: number;
  content: string;
  author_name?: string;
  post_id: number;
  is_approved: boolean;
  is_spam: boolean;
  created_at: string;
  author?: {
    full_name?: string;
    username: string;
    avatar?: string | null;
  };
  post?: {
    id: number;
    title: string;
  };
}

interface RecentCommentsProps {
  comments: Comment[];
}

export function RecentComments({ comments }: RecentCommentsProps) {
  const getStatusBadge = (comment: Comment) => {
    if (comment.is_spam) {
      return <Badge variant="destructive" className="text-xs">垃圾评论</Badge>;
    }
    return comment.is_approved 
      ? <Badge variant="default" className="text-xs">已审核</Badge>
      : <Badge variant="secondary" className="text-xs">待审核</Badge>;
  };

  const getAuthorName = (comment: Comment) => {
    if (comment.author) {
      return comment.author.full_name || comment.author.username;
    }
    return comment.author_name || '匿名用户';
  };

  const getAuthorInitial = (comment: Comment) => {
    const name = getAuthorName(comment);
    return name.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          最近评论
        </CardTitle>
        <CardDescription>
          用户最新的评论和反馈
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.length > 0 ? (
          <>
            {comments.map((comment) => (
              <div key={comment.id} className="p-3 border rounded-lg">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    {comment.author?.avatar && (
                      <AvatarImage src={comment.author.avatar} alt={getAuthorName(comment)} />
                    )}
                    <AvatarFallback className="text-xs">
                      {getAuthorInitial(comment)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {getAuthorName(comment)}
                        </span>
                        {getStatusBadge(comment)}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {comment.content}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      评论于: {comment.post?.title || `文章ID ${comment.post_id}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/comments">
                  查看所有评论
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>还没有评论</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}