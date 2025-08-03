"use client"

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Calendar, Clock, ArrowRight, Tag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { postsAPI } from '@/lib/api/posts';
import { PostList } from '@/types/api';
import { toast } from 'sonner';

export function LatestPosts() {
  const [posts, setPosts] = useState<PostList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 获取最新的6篇文章
        const response = await postsAPI.getPosts({
          skip: 0,
          limit: 6,
          status: 'published'
        });
        
        setPosts(response || []);
      } catch (err: any) {
        const errorMessage = err.message || '获取文章列表失败';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('获取最新文章失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPosts();
  }, []);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 计算阅读时间（基于内容长度的简单估算）
  const calculateReadTime = (content: string | undefined) => {
    if (!content) return '1 分钟';
    const wordsPerMinute = 200; // 假设每分钟阅读200字
    const wordCount = content.length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} 分钟`;
  };

  // 加载骨架屏
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-card border rounded-lg overflow-hidden">
          <Skeleton className="aspect-video w-full" />
          <div className="p-6 space-y-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // 错误状态
  if (error && !loading) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              最新文章
            </h2>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-8 max-w-md mx-auto">
              <p className="text-destructive mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                重新加载
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* 标题部分 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            最新文章
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            探索最新的技术趋势和编程实践，与我一起学习成长
          </p>
        </div>

        {/* 加载状态 */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* 文章列表 */}
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="group bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    {/* 文章封面 */}
                    <div className="aspect-video bg-muted overflow-hidden">
                      {post.featured_image ? (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-4xl font-bold text-primary/30">
                            {post.title.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 文章内容 */}
                    <div className="p-6">
                      {/* 分类标签 */}
                      {post.category && (
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary" className="text-xs">
                            {post.category.name}
                          </Badge>
                        </div>
                      )}

                      {/* 文章标题 */}
                      <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        <Link href={`/posts/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h3>

                      {/* 文章摘要 */}
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {post.excerpt || post.content.substring(0, 150) + '...'}
                      </p>

                      {/* 标签 */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                            >
                              <Tag className="h-3 w-3" />
                              {tag.name}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{post.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 文章元信息 */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(post.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {calculateReadTime(post.content)}
                          </span>
                        </div>
                        {post.author && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {post.author.username}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              /* 空状态 */
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  暂无文章
                </h3>
                <p className="text-muted-foreground mb-4">
                  还没有发布任何文章，请稍后再来查看
                </p>
              </div>
            )}

            {/* 查看更多按钮 */}
            {posts.length > 0 && (
              <div className="text-center">
                <Button asChild variant="outline" size="lg">
                  <Link href="/posts">
                    查看所有文章
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}