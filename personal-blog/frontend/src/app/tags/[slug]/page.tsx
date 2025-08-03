"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, User, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { tagsAPI, Tag } from '@/lib/api/tags';
import { postsAPI, PostList } from '@/lib/api/posts';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';

export default function TagDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [tag, setTag] = useState<Tag | null>(null);
  const [posts, setPosts] = useState<PostList[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);

  // 加载标签信息
  const loadTag = async () => {
    try {
      setLoading(true);
      const tags = await tagsAPI.getTags();
      const foundTag = tags.find(t => t.slug === slug);
      
      if (!foundTag) {
        toast.error("标签不存在");
        router.push('/tags');
        return;
      }
      
      setTag(foundTag);
      // 加载该标签下的文章
      loadPosts(foundTag.id);
    } catch (error) {
      console.error('加载标签失败:', error);
      toast.error("加载标签信息失败");
      router.push('/tags');
    } finally {
      setLoading(false);
    }
  };

  // 加载标签下的文章
  const loadPosts = async (tagId: number) => {
    try {
      setPostsLoading(true);
      const response = await postsAPI.getPosts({
        skip: 0,
        limit: 50,
        tag_id: tagId,
        status: 'published'
      });
      setPosts(response || []);
    } catch (error) {
      console.error('加载文章失败:', error);
      toast.error("加载文章列表失败");
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadTag();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">标签不存在</h1>
          <Button onClick={() => router.push('/tags')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回标签列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
      </div>

      {/* 标签信息 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Hash className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{tag.name}</h1>
            <p className="text-muted-foreground">标签别名: {tag.slug}</p>
          </div>
        </div>
        
        {tag.description && (
          <p className="text-lg text-muted-foreground mb-4">{tag.description}</p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>创建时间: {format(new Date(tag.created_at), 'yyyy年MM月dd日', { locale: zhCN })}</span>
          <Separator orientation="vertical" className="h-4" />
          <span>文章数量: {tag.post_count}</span>
        </div>
      </div>

      {/* 文章列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            标签下的文章 ({tag.post_count})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {postsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">加载文章中...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">该标签下暂无文章</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <article key={post.id} className="border-b border-border pb-6 last:border-b-0">
                  <div className="flex items-start gap-4">
                    {post.featured_image && (
                      <div className="flex-shrink-0">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-semibold mb-2 hover:text-primary">
                        <Link href={`/posts/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h2>
                      
                      {post.excerpt && (
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{post.author?.username || '未知作者'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(post.created_at), 'yyyy-MM-dd', { locale: zhCN })}</span>
                        </div>
                        <Badge variant="secondary">
                          {post.status === 'published' ? '已发布' : '草稿'}
                        </Badge>
                      </div>
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {post.tags.map((postTag) => (
                            <Badge 
                              key={postTag.id} 
                              variant={postTag.slug === slug ? "default" : "outline"}
                              className="text-xs"
                            >
                              {postTag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}