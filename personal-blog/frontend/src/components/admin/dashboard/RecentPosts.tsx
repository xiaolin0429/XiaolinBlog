import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Eye, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { PostList } from '@/lib/api/posts';

interface RecentPostsProps {
  posts: PostList[];
}

export function RecentPosts({ posts }: RecentPostsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default">已发布</Badge>;
      case 'draft':
        return <Badge variant="secondary">草稿</Badge>;
      case 'archived':
        return <Badge variant="outline">已归档</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          最近文章
        </CardTitle>
        <CardDescription>
          最新发布和编辑的文章
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {posts.length > 0 ? (
          <>
            {posts.map((post) => (
              <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{post.title}</h4>
                    {getStatusBadge(post.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {post.comment_count}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/posts/${post.id}/edit`}>
                    编辑
                  </Link>
                </Button>
              </div>
            ))}
            <div className="pt-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/posts">
                  查看所有文章
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>还没有文章</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/admin/posts/new">
                创建第一篇文章
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}