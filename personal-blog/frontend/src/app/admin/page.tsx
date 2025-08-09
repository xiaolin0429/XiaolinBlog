/**
 * 管理后台首页 - 使用真实API数据
 * 仪表盘页面，展示系统概览信息
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../presentation/components/ui'
import { DashboardStats } from '../../components/admin/dashboard/DashboardStats'
import { RecentPosts } from '../../components/admin/dashboard/RecentPosts'  
import { RecentComments } from '../../components/admin/dashboard/RecentComments'
import { dashboardApi, type DashboardData } from '../../lib/api/dashboard'
import { toast } from 'sonner'

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('Fetching dashboard data from API...')
        const data = await dashboardApi.getDashboardData()
        
        console.log('Dashboard data loaded successfully:', data)
        setDashboardData(data)
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        const errorMessage = err instanceof Error ? err.message : '加载数据失败'
        setError(errorMessage)
        toast.error('仪表盘数据加载失败：' + errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">管理后台</h1>
          <p className="text-gray-600 mt-1">正在从服务器加载数据...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">管理后台</h1>
          <p className="text-red-600 mt-1">数据加载失败：{error}</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-gray-500 mb-4">无法加载仪表盘数据，请检查网络连接或稍后重试</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                重新加载
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">管理后台</h1>
        <p className="text-gray-600 mt-1">欢迎回来，这是您的博客管理概览。</p>
      </div>

      {/* 统计卡片 */}
      <DashboardStats stats={dashboardData.stats} />

      {/* 内容概览 */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentPosts posts={dashboardData.recentPosts} />
        <RecentComments comments={dashboardData.recentComments} />
      </div>

      {/* API数据状态说明 */}
      <Card>
        <CardHeader>
          <CardTitle>📊 实时数据展示</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              数据来源：后端API
            </h4>
            <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
              仪表盘数据已恢复真实API连接，显示来自服务器的实时统计信息：
            </p>
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <li>✅ 文章统计：总计 {dashboardData.stats.totalPosts} 篇，已发布 {dashboardData.stats.publishedPosts} 篇</li>
              <li>✅ 评论统计：总计 {dashboardData.stats.totalComments} 条，已审核 {dashboardData.stats.approvedComments} 条</li>
              <li>✅ 浏览统计：总浏览量 {dashboardData.stats.totalViews} 次</li>
              <li>✅ 精选文章：{dashboardData.stats.featuredPosts} 篇</li>
              <li>✅ 实时数据更新</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}