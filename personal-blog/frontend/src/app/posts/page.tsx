"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdvancedSearch, SearchFilters } from "@/components/search/advanced-search";
import { postsAPI } from '@/lib/api/posts';
import { PostList } from '@/types/api';
import { toast } from 'sonner';

export default function PostsPage() {
  const [posts, setPosts] = useState<PostList[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<PostList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({
    query: '',
    tags: [],
    dateRange: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // 获取文章列表
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await postsAPI.getPosts({
        status: 'published'
      });
      
      setPosts(response || []);
      setFilteredPosts(response || []);
    } catch (err: any) {
      const errorMessage = err.message || '获取文章列表失败';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('获取文章列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // 处理搜索筛选
  const handleSearch = (filters: SearchFilters) => {
    setCurrentFilters(filters);
    
    let filtered = [...posts];

    // 关键词搜索
    if (filters.query?.trim()) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(post => {
        // 安全检查所有可能为undefined的字段
        const titleMatch = post.title?.toLowerCase().includes(query) || false;
        const excerptMatch = post.excerpt?.toLowerCase().includes(query) || false;
        const contentMatch = post.content?.toLowerCase().includes(query) || false;
        const tagMatch = post.tags?.some(tag => tag.name?.toLowerCase().includes(query)) || false;
        
        return titleMatch || excerptMatch || contentMatch || tagMatch;
      });
    }

    // 分类筛选
    if (filters.category) {
      filtered = filtered.filter(post => post.category?.slug === filters.category);
    }

    // 标签筛选
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(post =>
        post.tags?.some(tag => tag.slug && filters.tags.includes(tag.slug))
      );
    }

    // 时间范围筛选
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(post => 
        post.created_at && new Date(post.created_at) >= filterDate
      );
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'updated_at':
          aValue = a.updated_at ? new Date(a.updated_at) : new Date(0);
          bValue = b.updated_at ? new Date(b.updated_at) : new Date(0);
          break;
        default: // created_at
          aValue = a.created_at ? new Date(a.created_at) : new Date(0);
          bValue = b.created_at ? new Date(b.created_at) : new Date(0);
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPosts(filtered);
  };

  // 格式化日期
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '未知日期';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 计算阅读时间
  const calculateReadTime = (content: string | undefined) => {
    if (!content) return '1 分钟';
    const wordsPerMinute = 200;
    const wordCount = content.length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} 分钟`;
  };

  // 获取活跃筛选条件的数量
  const getActiveFiltersCount = () => {
    let count = 0;
    if (currentFilters.query?.trim()) count++;
    if (currentFilters.category) count++;
    if (currentFilters.tags?.length > 0) count++;
    if (currentFilters.dateRange !== 'all') count++;
    return count;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          所有文章
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          探索技术世界，分享编程心得，记录学习历程
        </p>
      </div>

      {/* 高级搜索组件 */}
      <div className="mb-8">
        <AdvancedSearch
          onSearch={handleSearch}
          initialFilters={currentFilters}
        />
      </div>

      {/* 搜索结果统计 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          找到 <span className="font-medium text-foreground">{filteredPosts.length}</span> 篇文章
          {getActiveFiltersCount() > 0 && (
            <span> · 已应用 {getActiveFiltersCount()} 个筛选条件</span>
          )}
        </div>
        
        {getActiveFiltersCount() > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSearch({
              query: '',
              tags: [],
              dateRange: 'all',
              sortBy: 'created_at',
              sortOrder: 'desc',
            })}
          >
            清除筛选
          </Button>
        )}
      </div>

      {/* 加载状态 */}
      {loading ? (
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
      ) : error ? (
        /* 错误状态 */
        <div className="text-center py-12">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-8 max-w-md mx-auto">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchPosts} variant="outline">
              重新加载
            </Button>
          </div>
        </div>
      ) : filteredPosts.length === 0 ? (
        /* 空状态 */
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <svg
              className="mx-auto h-12 w-12 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.007-5.691-2.709M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {posts.length === 0 ? '暂无文章' : '没有找到匹配的文章'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {posts.length === 0 ? '还没有发布任何文章，请稍后再来查看' : '尝试调整搜索条件或清除筛选器'}
          </p>
          {posts.length > 0 && (
            <Button
              variant="outline"
              onClick={() => handleSearch({
                query: '',
                tags: [],
                dateRange: 'all',
                sortBy: 'created_at',
                sortOrder: 'desc',
              })}
            >
              查看所有文章
            </Button>
          )}
        </div>
      ) : (
        /* 文章列表 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="group bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              {/* 文章封面 */}
              <div className="aspect-video bg-muted overflow-hidden">
                {post.featured_image ? (
                  <img
                    src={post.featured_image}
                    alt={post.title || '文章封面'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary/30">
                      {(post.title || '文章').charAt(0)}
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
                <h2 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  <Link href={`/posts/${post.slug || post.id}`}>
                    {post.title || '无标题'}
                  </Link>
                </h2>

                {/* 文章摘要 */}
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {post.excerpt || (post.content ? post.content.substring(0, 150) + '...' : '暂无摘要')}
                </p>

                {/* 标签 */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags.slice(0, 3).map((tag) => (
                      tag.name ? (
                        <span
                          key={tag.id || tag.name}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                        >
                          <Tag className="h-3 w-3" />
                          {tag.name}
                        </span>
                      ) : null
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
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 分页 */}
      {filteredPosts.length > 0 && (
        <div className="mt-12 flex justify-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              上一页
            </Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <Button variant="outline" size="sm">
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}