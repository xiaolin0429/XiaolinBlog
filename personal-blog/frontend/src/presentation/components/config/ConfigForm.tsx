/**
 * 配置表单组件
 * 使用完整的依赖注入架构
 */

'use client'

import React, { useEffect, useRef, useMemo } from 'react'
import { Button, LoadingSpinner } from '../ui'
import { toast } from 'sonner'
import { useConfig } from '../../../application/hooks/useConfig'
import { SiteConfig } from '../../../core/entities/SiteConfig'

export function ConfigForm() {
  const {
    config,
    loading,
    saving,
    error,
    hasUnsavedChanges,
    isValid,
    loadConfig,
    saveConfig,
    updateField,
    resetConfig,
    discardChanges,
    validateField,
    getFieldErrors
  } = useConfig()

  // 使用 ref 防止重复初始化
  const initializedRef = useRef(false)

  // 初始化加载配置 - 防止无限循环
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      let mounted = true
      
      const initLoad = async () => {
        if (mounted) {
          await loadConfig()
        }
      }
      
      initLoad()
      
      return () => { 
        mounted = false 
      }
    }
  }, [loadConfig]) // 添加 loadConfig 依赖，但通过 ref 防止重复调用

  // 缓存事件处理函数，避免不必要的重渲染
  const handleSave = useMemo(() => async () => {
    const result = await saveConfig()
    if (!result.success) {
      console.error('保存失败:', result.error)
    }
  }, [saveConfig])

  const handleDiscard = useMemo(() => () => {
    discardChanges()
    toast.info('已恢复到上次保存的状态')
  }, [discardChanges])

  // 处理字段更改 - 使用 useMemo 缓存
  const handleFieldChange = useMemo(() => (key: keyof SiteConfig, value: string) => {
    updateField(key, value)
  }, [updateField])

  // 获取字段错误信息 - 使用 useMemo 缓存
  const getFieldError = useMemo(() => (key: keyof SiteConfig): string => {
    const errors = getFieldErrors(key)
    return errors.length > 0 ? errors[0] : ''
  }, [getFieldErrors])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <span className="ml-2">加载配置中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-800">
              <h3 className="text-sm font-medium">加载配置失败</h3>
              <div className="mt-2 text-sm">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Button onClick={loadConfig} variant="outline" size="sm">
                  重新加载
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">站点配置</h1>
        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600">有未保存的更改</span>
          )}
          <Button
            variant="outline"
            onClick={handleDiscard}
            disabled={!hasUnsavedChanges || saving}
          >
            撤销更改
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saving || !isValid}
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                保存中...
              </>
            ) : (
              '保存配置'
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                网站标题 *
              </label>
              <input
                type="text"
                value={config.site_title}
                onChange={(e) => handleFieldChange('site_title', e.target.value)}
                placeholder="请输入网站标题"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError('site_title') ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {getFieldError('site_title') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('site_title')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                网站副标题
              </label>
              <input
                type="text"
                value={config.site_subtitle}
                onChange={(e) => handleFieldChange('site_subtitle', e.target.value)}
                placeholder="请输入网站副标题"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                网站描述
              </label>
              <textarea
                value={config.site_description}
                onChange={(e) => handleFieldChange('site_description', e.target.value)}
                placeholder="请输入网站描述"
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError('site_description') ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {getFieldError('site_description') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('site_description')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关键词
              </label>
              <input
                type="text"
                value={config.site_keywords}
                onChange={(e) => handleFieldChange('site_keywords', e.target.value)}
                placeholder="用逗号分隔多个关键词"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError('site_keywords') ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {getFieldError('site_keywords') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('site_keywords')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                网站Logo URL
              </label>
              <input
                type="text"
                value={config.site_logo}
                onChange={(e) => handleFieldChange('site_logo', e.target.value)}
                placeholder="https://example.com/logo.png"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError('site_logo') ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {getFieldError('site_logo') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('site_logo')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                网站图标 URL
              </label>
              <input
                type="text"
                value={config.site_favicon}
                onChange={(e) => handleFieldChange('site_favicon', e.target.value)}
                placeholder="https://example.com/favicon.ico"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError('site_favicon') ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {getFieldError('site_favicon') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('site_favicon')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                语言
              </label>
              <input
                type="text"
                value={config.site_language}
                onChange={(e) => handleFieldChange('site_language', e.target.value)}
                placeholder="zh-CN"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError('site_language') ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {getFieldError('site_language') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('site_language')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                时区
              </label>
              <input
                type="text"
                value={config.site_timezone}
                onChange={(e) => handleFieldChange('site_timezone', e.target.value)}
                placeholder="Asia/Shanghai"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError('site_timezone') ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {getFieldError('site_timezone') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('site_timezone')}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                版权信息
              </label>
              <input
                type="text"
                value={config.site_copyright}
                onChange={(e) => handleFieldChange('site_copyright', e.target.value)}
                placeholder="Copyright © 2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ICP备案号
              </label>
              <input
                type="text"
                value={config.site_icp}
                onChange={(e) => handleFieldChange('site_icp', e.target.value)}
                placeholder="京ICP备xxxxxxxx号"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                公安备案号
              </label>
              <input
                type="text"
                value={config.site_public_security}
                onChange={(e) => handleFieldChange('site_public_security', e.target.value)}
                placeholder="京公网安备xxxxxxxx号"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}