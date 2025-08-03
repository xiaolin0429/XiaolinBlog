"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { categoriesAPI, Category } from '@/lib/api/categories';
import { tagsAPI, Tag } from '@/lib/api/tags';

export interface SearchFilters {
  query: string;
  category?: string;
  tags: string[];
  dateRange?: 'week' | 'month' | 'year' | 'all';
  sortBy?: 'created_at' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
  className?: string;
}

export function AdvancedSearch({ onSearch, initialFilters, className }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    tags: [],
    dateRange: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
    ...initialFilters,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  // 加载分类和标签数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, tagsData] = await Promise.all([
          categoriesAPI.getCategories(),
          tagsAPI.getTags({ limit: 50 }),
        ]);
        setCategories(categoriesData);
        setTags(tagsData);
      } catch (error) {
        console.error('加载搜索数据失败:', error);
      }
    };

    loadData();
  }, []);

  const handleSearch = () => {
    setLoading(true);
    onSearch(filters);
    setTimeout(() => setLoading(false), 500);
  };

  const handleReset = () => {
    const resetFilters: SearchFilters = {
      query: '',
      tags: [],
      dateRange: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc',
    };
    setFilters(resetFilters);
    onSearch(resetFilters);
  };

  const addTag = (tagSlug: string) => {
    if (!filters.tags.includes(tagSlug)) {
      const newFilters = {
        ...filters,
        tags: [...filters.tags, tagSlug],
      };
      setFilters(newFilters);
    }
  };

  const removeTag = (tagSlug: string) => {
    const newFilters = {
      ...filters,
      tags: filters.tags.filter(tag => tag !== tagSlug),
    };
    setFilters(newFilters);
  };

  const getTagName = (slug: string) => {
    const tag = tags.find(t => t.slug === slug);
    return tag?.name || slug;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            搜索文章
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter className="h-4 w-4" />
            高级筛选
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基础搜索 */}
        <div className="flex gap-2">
          <Input
            placeholder="输入关键词搜索..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4" />
            搜索
          </Button>
        </div>

        {/* 高级筛选 */}
        {isExpanded && (
          <>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 分类筛选 */}
              <div className="space-y-2">
                <Label>分类</Label>
                <Select
                  value={filters.category || 'all'}
                  onValueChange={(value) => 
                    setFilters({ ...filters, category: value === 'all' ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.slug}>
                        {category.name} ({category.post_count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 时间范围 */}
              <div className="space-y-2">
                <Label>时间范围</Label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value: any) => setFilters({ ...filters, dateRange: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部时间</SelectItem>
                    <SelectItem value="week">最近一周</SelectItem>
                    <SelectItem value="month">最近一月</SelectItem>
                    <SelectItem value="year">最近一年</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 排序方式 */}
              <div className="space-y-2">
                <Label>排序方式</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value: any) => setFilters({ ...filters, sortBy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">发布时间</SelectItem>
                    <SelectItem value="updated_at">更新时间</SelectItem>
                    <SelectItem value="title">标题</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 排序顺序 */}
              <div className="space-y-2">
                <Label>排序顺序</Label>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value: any) => setFilters({ ...filters, sortOrder: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">降序</SelectItem>
                    <SelectItem value="asc">升序</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 标签选择 */}
            <div className="space-y-2">
              <Label>标签</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {filters.tags.map((tagSlug) => (
                  <Badge key={tagSlug} variant="secondary" className="flex items-center gap-1 pr-1">
                    <span>{getTagName(tagSlug)}</span>
                    <button
                      type="button"
                      className="ml-1 p-0.5 rounded-sm hover:bg-secondary-foreground/20 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeTag(tagSlug);
                      }}
                      aria-label={`移除标签 ${getTagName(tagSlug)}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Select onValueChange={addTag}>
                <SelectTrigger>
                  <SelectValue placeholder="添加标签" />
                </SelectTrigger>
                <SelectContent>
                  {tags
                    .filter(tag => !filters.tags.includes(tag.slug))
                    .map((tag) => (
                      <SelectItem key={tag.id} value={tag.slug}>
                        {tag.name} ({tag.post_count})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSearch} disabled={loading} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                应用筛选
              </Button>
              <Button variant="outline" onClick={handleReset}>
                重置
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}