"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, Tag, User, ArrowLeft, Share2, Heart, MessageCircle } from "lucide-react";
import { Button, Badge, Separator, Skeleton } from "../presentation/components/ui";
import { postsAPI } from '../lib/api/posts';
import { Post } from '../types/api';
import { toast } from 'sonner';
import CommentSection from './comments/comment-section';

interface PostDetailProps {
  slug: string;
}

export default function PostDetail({ slug }: PostDetailProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取文章详情
  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await postsAPI.getPostBySlug(slug);
      setPost(response);
      
      // 文章加载成功后，异步增加浏览量并乐观更新UI
      if (response && response.id) {
        // 立即乐观更新浏览量显示（用户无感知）
        const optimisticPost = {
          ...response,
          view_count: (response.view_count || 0) + 1
        };
        setPost(optimisticPost);
        
        // 异步调用后端API增加浏览量
        try {
          const viewResult = await postsAPI.incrementViewCount(response.id);
          
          // 如果后端返回浏览量没有增加（重复访问），恢复原始数据
          if (!viewResult.incremented) {
            setPost(response);
          }
        } catch (viewError) {
          // 浏览量增加失败，恢复原始数据
          console.warn('增加浏览量失败:', viewError);
          setPost(response);
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || '获取文章详情失败';
      setError(errorMessage);
      console.error('获取文章详情失败:', err);
      
      // 如果是404错误，显示not found页面
      if (errorMessage.includes('不存在') || errorMessage.includes('404')) {
        notFound();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 防止重复调用
    let isMounted = true;
    
    const loadPost = async () => {
      if (isMounted) {
        await fetchPost();
      }
    };
    
    loadPost();
    
    // 清理函数
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 计算阅读时间
  const calculateReadTime = (content: string | undefined) => {
    if (!content || content.trim() === '') return '1 分钟';
    const wordsPerMinute = 200;
    const wordCount = content.length;
    const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    return `${minutes} 分钟`;
  };

  // 加载状态
  if (loading) {
    return (
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-32" />
        </div>
        
        <header className="mb-8">
          <Skeleton className="h-6 w-20 mb-4" />
          <Skeleton className="h-12 w-full mb-6" />
          
          <div className="flex flex-wrap items-center gap-6 mb-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          
          <Skeleton className="aspect-video w-full mb-8" />
          
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </header>
        
        <div className="space-y-4 mb-12">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </article>
    );
  }

  // 错误状态
  if (error && !post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-8 max-w-md mx-auto">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchPost} variant="outline">
              重新加载
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    notFound();
  }

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 返回按钮 */}
      <div className="mb-8">
        <Button variant="ghost" asChild>
          <Link href="/posts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回文章列表
          </Link>
        </Button>
      </div>

      {/* 文章头部 */}
      <header className="mb-8">
        {/* 分类标签 */}
        {post.category && (
          <div className="mb-4">
            <Badge variant="secondary">
              <Link href={`/categories/${post.category.slug}`}>
                {post.category.name}
              </Link>
            </Badge>
          </div>
        )}

        {/* 文章标题 */}
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
          {post.title}
        </h1>

        {/* 文章元信息 */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>发布于 {formatDate(post.created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{calculateReadTime(post.content)}</span>
          </div>
          {post.view_count && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{post.view_count} 次阅读</span>
            </div>
          )}
        </div>

        {/* 作者信息 */}
        {post.author && (
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {post.author.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-medium text-foreground">{post.author.username}</div>
              <div className="text-sm text-muted-foreground">
                {post.author.full_name || '博客作者'}
              </div>
            </div>
          </div>
        )}

        {/* 文章封面 */}
        {post.featured_image ? (
          <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-8">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center mb-8">
            <span className="text-6xl font-bold text-primary/30">
              {post.title.charAt(0)}
            </span>
          </div>
        )}

        {/* 互动按钮 */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm">
            <Heart className="h-4 w-4 mr-2" />
            {post.like_count || 0}
          </Button>
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            {post.comment_count || 0}
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            分享
          </Button>
        </div>
      </header>

      <Separator className="mb-8" />

      {/* 文章内容 */}
      <div className="prose prose-lg max-w-none mb-12">
        {post.content ? (
          <div
            className="text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br>') }}
          />
        ) : post.excerpt ? (
          <div className="text-foreground leading-relaxed">
            <p>{post.excerpt}</p>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground text-sm">
                完整内容正在加载中，或者该文章只有摘要内容。
              </p>
            </div>
          </div>
        ) : (
          <div className="text-foreground leading-relaxed">
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">
                文章内容暂时无法显示。
              </p>
            </div>
          </div>
        )}
      </div>

      <Separator className="mb-8" />

      {/* 文章标签 */}
      {post.tags && post.tags.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">标签</h3>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag.slug} variant="outline" asChild>
                <Link href={`/tags/${tag.slug}`} className="cursor-pointer">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag.name}
                </Link>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator className="mb-8" />

      {/* 作者卡片 */}
      {post.author && (
        <div className="bg-muted/50 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold text-xl">
                {post.author.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                关于作者 {post.author.username}
              </h3>
              <p className="text-muted-foreground mb-4">
                {post.author.full_name || '这位作者很神秘，还没有留下个人简介。'}
              </p>
              <Button variant="outline" size="sm">
                查看更多文章
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 相关文章推荐 */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-foreground mb-6">相关文章</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 这里可以添加相关文章的组件 */}
          <div className="bg-card border rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-2">
              <Link href="/posts/typescript-advanced-types" className="hover:text-primary">
                TypeScript 高级类型系统实战
              </Link>
            </h4>
            <p className="text-sm text-muted-foreground">
              通过实际案例学习 TypeScript 的高级类型特性...
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-2">
              <Link href="/posts/nextjs-14-app-router-guide" className="hover:text-primary">
                Next.js 14 App Router 完全指南
              </Link>
            </h4>
            <p className="text-sm text-muted-foreground">
              全面介绍 Next.js 14 的 App Router...
            </p>
          </div>
        </div>
      </div>

      {/* 评论区 */}
      <CommentSection postId={post.id} initialCount={post.comment_count || 0} />
    </article>
  );
}