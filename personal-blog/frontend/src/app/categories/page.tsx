"use client";

import { useState, useEffect } from 'react';
import { Search, BookOpen, Calendar, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { categoriesAPI, Category } from '@/lib/api/categories';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 加载分类数据
  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesAPI.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('加载分类失败:', error);
      toast.error("加载分类数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // 筛选分类
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">文章分类</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          探索不同主题的文章内容，找到您感兴趣的话题
        </p>
      </div>

      {/* 搜索框 */}
      <div className="max-w-md mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="搜索分类..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {categories.length}
            </div>
            <p className="text-muted-foreground">个分类</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {categories.reduce((sum, cat) => sum + cat.post_count, 0)}
            </div>
            <p className="text-muted-foreground">篇文章</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {categories.length > 0 
                ? Math.round(categories.reduce((sum, cat) => sum + cat.post_count, 0) / categories.length)
                : 0
              }
            </div>
            <p className="text-muted-foreground">平均文章数</p>
          </CardContent>
        </Card>
      </div>

      {/* 分类网格 */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery ? '没有找到匹配的分类' : '暂无分类'}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery ? '尝试使用其他关键词搜索' : '管理员还没有创建任何分类'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {category.name}
                  </CardTitle>
                  <Badge variant="secondary" className="text-sm">
                    {category.post_count} 篇
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.description && (
                    <p className="text-muted-foreground line-clamp-3">
                      {category.description}
                    </p>
                  )}
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      创建于 {format(new Date(category.created_at), 'yyyy年MM月dd日', { locale: zhCN })}
                    </span>
                  </div>
                  
                  <div className="pt-2">
                    <Link href={`/categories/${category.slug}`}>
                      <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <span>查看文章</span>
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 底部提示 */}
      <div className="text-center mt-12 p-6 bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">
          点击任意分类卡片查看该分类下的所有文章
        </p>
      </div>
    </div>
  );
}