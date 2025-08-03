"use client";

import { useState, useEffect } from 'react';
import { Search, Hash, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { tagsAPI, Tag } from '@/lib/api/tags';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 加载标签数据
  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await tagsAPI.getTags();
      setTags(data);
    } catch (error) {
      console.error('加载标签失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  // 筛选标签
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tag.description && tag.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 获取热门标签
  const getPopularTags = () => {
    return tags
      .filter(tag => tag.post_count > 0)
      .sort((a, b) => b.post_count - a.post_count)
      .slice(0, 8);
  };

  // 获取最新标签
  const getLatestTags = () => {
    return [...tags]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  };

  // 获取标签颜色
  const getTagColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'bg-green-100 text-green-800 hover:bg-green-200',
      'bg-purple-100 text-purple-800 hover:bg-purple-200',
      'bg-orange-100 text-orange-800 hover:bg-orange-200',
      'bg-pink-100 text-pink-800 hover:bg-pink-200',
      'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
      'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      'bg-red-100 text-red-800 hover:bg-red-200',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载标签中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">文章标签</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          探索不同主题的文章，通过标签快速找到您感兴趣的内容
        </p>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">标签总数</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tags.length}</div>
            <p className="text-xs text-muted-foreground">
              涵盖各个领域的标签
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">文章总数</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.reduce((sum, tag) => sum + tag.post_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              标签下的文章总数
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃标签</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.filter(tag => tag.post_count > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              包含文章的标签数量
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 热门标签 */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            热门标签
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getPopularTags().map((tag, index) => (
              <Link key={tag.id} href={`/tags/${tag.slug}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getTagColor(index)}>
                        {tag.name}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {tag.description || '暂无描述'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{tag.post_count} 篇文章</span>
                      <span>{format(new Date(tag.created_at), 'MM-dd', { locale: zhCN })}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {getPopularTags().length === 0 && (
            <p className="text-center text-muted-foreground py-8">暂无热门标签</p>
          )}
        </CardContent>
      </Card>

      {/* 搜索 */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="搜索标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 所有标签 */}
      <Card>
        <CardHeader>
          <CardTitle>所有标签</CardTitle>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? `找到 ${filteredTags.length} 个匹配的标签` : `共 ${tags.length} 个标签`}
          </p>
        </CardHeader>
        <CardContent>
          {filteredTags.length === 0 ? (
            <div className="text-center py-12">
              <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? '没有找到匹配的标签' : '暂无标签'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTags.map((tag, index) => (
                <Link key={tag.id} href={`/tags/${tag.slug}`}>
                  <Card className="hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={getTagColor(index)} variant="secondary">
                          {tag.name}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2 min-h-[2.5rem]">
                        {tag.description || '探索这个标签下的精彩内容'}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          <span>{tag.post_count} 篇文章</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(tag.created_at), 'yyyy-MM-dd', { locale: zhCN })}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 最新标签 */}
      {!searchQuery && getLatestTags().length > 0 && (
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              最新标签
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {getLatestTags().map((tag) => (
                <Link key={tag.id} href={`/tags/${tag.slug}`}>
                  <Badge 
                    variant="outline" 
                    className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                  >
                    {tag.name}
                    {tag.post_count > 0 && (
                      <span className="ml-1 text-xs">({tag.post_count})</span>
                    )}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}