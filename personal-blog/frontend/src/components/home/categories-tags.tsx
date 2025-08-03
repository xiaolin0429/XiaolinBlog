"use client"

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Folder, Tag, TrendingUp, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoriesAPI } from '@/lib/api/categories';
import { tagsAPI } from '@/lib/api/tags';
import { Category, Tag as TagType } from '@/types/api';
import { toast } from 'sonner';

export function CategoriesTags() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);
  const [errorTags, setErrorTags] = useState<string | null>(null);

  // 获取分类数据
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      setErrorCategories(null);
      const data = await categoriesAPI.getCategories();
      setCategories(data.slice(0, 6)); // 只显示前6个分类
    } catch (err: any) {
      const errorMessage = err.message || '获取分类失败';
      setErrorCategories(errorMessage);
      console.error('获取分类失败:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // 获取标签数据
  const fetchTags = async () => {
    try {
      setLoadingTags(true);
      setErrorTags(null);
      const data = await tagsAPI.getTags();
      // 按文章数量排序
      const sortedTags = data.sort((a, b) => (b.post_count || 0) - (a.post_count || 0));
      setTags(sortedTags.slice(0, 12)); // 只显示前12个标签
    } catch (err: any) {
      const errorMessage = err.message || '获取标签失败';
      setErrorTags(errorMessage);
      console.error('获取标签失败:', err);
    } finally {
      setLoadingTags(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  // 生成分类颜色
  const getCategoryColor = (index: number) => {
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
      "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
      "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
      "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
    ];
    return colors[index % colors.length];
  };

  // 分类加载骨架屏
  const CategoriesLoading = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-4 bg-card border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-5 w-8" />
          </div>
        </div>
      ))}
    </div>
  );

  // 标签加载骨架屏
  const TagsLoading = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-6 w-16" />
        ))}
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-2">
            <div className="flex items-center gap-3">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-5 w-8" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 分类部分 */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Folder className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">文章分类</h2>
                <p className="text-muted-foreground">按主题浏览文章</p>
              </div>
            </div>

            {loadingCategories ? (
              <CategoriesLoading />
            ) : errorCategories ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
                <p className="text-destructive mb-4">{errorCategories}</p>
                <Button 
                  onClick={fetchCategories} 
                  variant="outline" 
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重试
                </Button>
              </div>
            ) : categories.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.map((category, index) => (
                    <Link
                      key={category.id}
                      href={`/categories/${category.slug}`}
                      className="group p-4 bg-card border rounded-lg hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getCategoryColor(index).split(' ')[0]}`} />
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {category.name}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {category.post_count || 0}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="mt-6">
                  <Link
                    href="/categories"
                    className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    查看所有分类 →
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Folder className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">暂无分类</p>
              </div>
            )}
          </div>

          {/* 标签部分 */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Tag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">热门标签</h2>
                <p className="text-muted-foreground">探索技术话题</p>
              </div>
            </div>

            {loadingTags ? (
              <TagsLoading />
            ) : errorTags ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
                <p className="text-destructive mb-4">{errorTags}</p>
                <Button 
                  onClick={fetchTags} 
                  variant="outline" 
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重试
                </Button>
              </div>
            ) : tags.length > 0 ? (
              <div className="space-y-6">
                {/* 热门标签云 */}
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 8).map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tags/${tag.slug}`}
                      className="group"
                    >
                      <Badge
                        variant="outline"
                        className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                      >
                        {tag.name}
                        <span className="ml-1 text-xs opacity-70">
                          {tag.post_count || 0}
                        </span>
                      </Badge>
                    </Link>
                  ))}
                </div>

                {/* 趋势标签 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">趋势标签</span>
                  </div>
                  <div className="space-y-2">
                    {tags
                      .slice(0, 5)
                      .map((tag, index) => (
                        <Link
                          key={tag.id}
                          href={`/tags/${tag.slug}`}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-muted-foreground w-4">
                              #{index + 1}
                            </span>
                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {tag.name}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {tag.post_count || 0}
                          </Badge>
                        </Link>
                      ))}
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    href="/tags"
                    className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    查看所有标签 →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">暂无标签</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}