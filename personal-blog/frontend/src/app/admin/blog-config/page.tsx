'use client';

import React from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { BlogConfigManager } from '@/components/admin/blog-config/BlogConfigManager';
import { Separator } from '@/components/ui/separator';
import { Settings } from 'lucide-react';

export default function BlogConfigPage() {
  return (
    <AuthGuard requireAdmin>
      <div className="container mx-auto py-6 space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">博客配置</h1>
            <p className="text-muted-foreground">管理网站的基本信息、外观、SEO、社交媒体和其他设置</p>
          </div>
        </div>
        
        <Separator />
        
        {/* 配置管理器 */}
        <BlogConfigManager />
      </div>
    </AuthGuard>
  );
}