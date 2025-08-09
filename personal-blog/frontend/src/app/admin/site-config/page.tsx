/**
 * 网站配置管理页面 - 使用新架构
 * 迁移到新架构的网站配置页面
 */

'use client'

import React from 'react'
import { AuthGuard } from '@/components/AuthGuard'
import { ConfigForm } from '../../../presentation/components/config/ConfigForm'

export default function SiteConfigPage() {
  return (
    <AuthGuard requireAdmin>
      <div className="container mx-auto py-6 space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center space-x-2">
          <div>
            <h1 className="text-2xl font-bold">博客配置</h1>
            <p className="text-muted-foreground">管理网站的基本信息、社交媒体和其他设置</p>
          </div>
        </div>

        {/* 配置表单 */}
        <ConfigForm />
      </div>
    </AuthGuard>
  )
}