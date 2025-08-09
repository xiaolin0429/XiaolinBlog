/**
 * 新架构示例页面
 * 演示如何使用重构后的架构
 */

'use client'

import React from 'react'
import { AppProvider } from '../../../AppProvider'
import { AdminLayout } from '../../../presentation/layouts/AdminLayout'
import { ConfigForm } from '../../../presentation/components/config/ConfigForm'
import { useConfig } from '../../../application/hooks/useConfig'
import { Card, CardHeader, CardTitle, CardContent, Button, Alert } from '../../../presentation/components/ui'

function ConfigPageContent() {
  const { config, hasUnsavedChanges, error, exportConfig, createBackup } = useConfig()

  const handleExport = () => {
    const configData = exportConfig()
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `site-config-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">站点配置</h1>
          <p className="text-gray-600 mt-1">管理您的网站基本设置和配置信息</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleExport}>
            导出配置
          </Button>
          <Button variant="outline" onClick={createBackup}>
            创建备份
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error">
          <strong>错误：</strong>{error}
        </Alert>
      )}

      {hasUnsavedChanges && (
        <Alert variant="warning">
          <strong>注意：</strong>您有未保存的更改，请记得保存。
        </Alert>
      )}

      <Card>
        <CardContent>
          <ConfigForm />
        </CardContent>
      </Card>

      {/* 架构信息展示 */}
      <Card>
        <CardHeader>
          <CardTitle>🏗️ 新架构信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">核心层</h4>
              <p className="text-sm text-blue-700 mt-1">
                接口契约、实体定义、错误类型
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">基础设施层</h4>
              <p className="text-sm text-green-700 mt-1">
                HTTP客户端、存储服务、API实现
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900">应用层</h4>
              <p className="text-sm text-purple-700 mt-1">
                用例场景、状态管理、业务Hooks
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-900">表现层</h4>
              <p className="text-sm text-orange-700 mt-1">
                UI组件、页面布局、用户交互
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">架构特点：</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✅ 依赖注入容器管理服务生命周期</li>
              <li>✅ 基于接口的松耦合设计</li>
              <li>✅ SOLID原则严格遵循</li>
              <li>✅ 统一的错误处理机制</li>
              <li>✅ 类型安全的依赖注入</li>
              <li>✅ 事件驱动的组件通信</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewArchitectureConfigPage() {
  return (
    <AppProvider>
      <AdminLayout>
        <ConfigPageContent />
      </AdminLayout>
    </AppProvider>
  )
}