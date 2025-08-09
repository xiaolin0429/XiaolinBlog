/**
 * 快速修复方案：替换现有DynamicMetadata组件的导入
 * 在 src/app/layout.tsx 中替换导入即可立即解决DOM错误
 */

// 将这行：
// import { DynamicMetadata } from "@/components/layout/dynamic-metadata";

// 替换为：
import { DynamicMetadata } from "@/components/layout/dynamic-metadata-refactored";

// 或者创建一个过渡方案，在当前组件中使用DOMManager
import { useEffect } from 'react'
import { useSiteConfig } from '@/hooks/use-site-config'
import { domManager } from '@/services/DOMManager'

export function DynamicMetadataFixed() {
  const { getSiteInfo, getSeoSettings, loading } = useSiteConfig()

  useEffect(() => {
    if (loading) return

    const siteInfo = getSiteInfo()
    const seoSettings = getSeoSettings()

    // 使用DOMManager安全更新meta标签
    const metaUpdates = []
    
    if (siteInfo.description) {
      metaUpdates.push({
        key: 'meta-description',
        type: 'meta' as const,
        name: 'description',
        content: siteInfo.description
      })
    }

    if (metaUpdates.length > 0) {
      domManager.updateMetaTags(metaUpdates)
    }

    // 安全更新favicon
    if (siteInfo.logo) {
      domManager.updateFavicon(siteInfo.logo)
    } else {
      // 尝试API获取
      fetch('/api/v1/image/site-favicon')
        .then(response => {
          if (response.ok) {
            domManager.updateFavicon('/api/v1/image/site-favicon')
          } else {
            domManager.updateFavicon('/favicon.ico')
          }
        })
        .catch(() => {
          domManager.updateFavicon('/favicon.ico')
        })
    }

    // 更新页面标题
    if (siteInfo.title) {
      document.title = siteInfo.title
    }

  }, [loading, getSiteInfo, getSeoSettings])

  return null
}