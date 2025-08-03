'use client';

import { useState, useEffect } from 'react';
import { DashboardStats } from '@/components/admin/dashboard/DashboardStats';
import { RecentPosts } from '@/components/admin/dashboard/RecentPosts';
import { RecentComments } from '@/components/admin/dashboard/RecentComments';
import { PostList } from '@/lib/api/posts';
import { Comment } from '@/types/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalViews: 0,
    totalComments: 0,
    approvedComments: 0,
    featuredPosts: 0,
  });
  const [recentPosts, setRecentPosts] = useState<PostList[]>([]);
  const [recentComments, setRecentComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 获取文章数据
        const postsResponse = await fetch('/api/v1/posts');
        const postsData = await postsResponse.json();
        
        console.log('文章API返回数据:', postsData);
        
        // 处理文章数据 - 支持直接返回数组或包装在success字段中
        let posts = [];
        if (Array.isArray(postsData)) {
          posts = postsData;
        } else if (postsData.success && postsData.data) {
          posts = postsData.data;
        } else if (postsData.data) {
          posts = postsData.data;
        }
        
        console.log('处理后的文章数据:', posts);
        
        if (posts.length > 0) {
          setRecentPosts(posts.slice(0, 5));
          
          // 计算统计数据
          const publishedPosts = posts.filter((p: PostList) => p.status === 'published').length;
          const draftPosts = posts.filter((p: PostList) => p.status === 'draft').length;
          const totalViews = posts.reduce((sum: number, p: PostList) => sum + (p.view_count || 0), 0);
          const featuredPosts = posts.filter((p: PostList) => p.is_featured).length;
          
          setStats(prev => ({
            ...prev,
            totalPosts: posts.length,
            publishedPosts,
            draftPosts,
            totalViews,
            featuredPosts,
          }));
        }

        // 获取评论数据
        const commentsResponse = await fetch('/api/v1/comments/');
        const commentsData = await commentsResponse.json();
        
        console.log('评论API返回数据:', commentsData);
        
        // 处理评论数据 - 支持直接返回数组或包装在success字段中
        let comments = [];
        if (Array.isArray(commentsData)) {
          comments = commentsData;
        } else if (commentsData.success && commentsData.data) {
          comments = commentsData.data;
        } else if (commentsData.data) {
          comments = commentsData.data;
        }
        
        console.log('处理后的评论数据:', comments);
        
        if (comments.length > 0) {
          // 按创建时间排序，取最新的5条
          const sortedComments = comments
            .sort((a: Comment, b: Comment) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            .slice(0, 5);
          
          setRecentComments(sortedComments);
          
          // 计算评论统计
          const approvedComments = comments.filter((c: Comment) => c.is_approved).length;
          
          setStats(prev => ({
            ...prev,
            totalComments: comments.length,
            approvedComments,
          }));
        }
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">管理后台</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            欢迎回来，这是您的博客管理概览。
          </span>
        </div>
      </div>
      
      {/* 统计卡片 */}
      <DashboardStats stats={stats} />
      
      {/* 最近内容 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <RecentPosts posts={recentPosts} />
        </div>
        <div className="col-span-3">
          <RecentComments comments={recentComments} />
        </div>
      </div>
    </div>
  );
}