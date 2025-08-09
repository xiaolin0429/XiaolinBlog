/**
 * 紧急修复的DynamicMetadata组件
 * 专门解决React removeChild错误
 */

"use client"

import { useEffect, useCallback } from 'react'
import { useSiteConfig } from '@/hooks/use-site-config'
import { reactSafeDOMManager, useReactSafeDOM } from '@/services/ReactSafeDOMManager'

export function DynamicMetadata() {
  const { getSiteInfo, getSeoSettings, loading } = useSiteConfig()
  const { updateMetaTag, updateFavicon } = useReactSafeDOM()

  // 安全更新页面标题
  const updatePageTitle = useCallback((title: string) => {
    try {
      if (title && document.title !== title) {
        document.title = title
      }
    } catch (error) {
      console.warn('Failed to update page title:', error)
    }
  }, [])

  // 更新基础meta标签
  const updateBasicMeta = useCallback(() => {
    if (loading) return

    const siteInfo = getSiteInfo()
    const seoSettings = getSeoSettings()

    try {
      // 更新页面标题
      if (siteInfo.title) {
        updatePageTitle(siteInfo.title)
      }

      // 更新description
      if (siteInfo.description) {
        updateMetaTag('meta-description', {
          name: 'description',
          content: siteInfo.description
        })
      }

      // 更新keywords  
      if (siteInfo.keywords) {
        updateMetaTag('meta-keywords', {
          name: 'keywords',
          content: siteInfo.keywords
        })
      }

      // 更新author
      if (seoSettings.metaAuthor) {
        updateMetaTag('meta-author', {
          name: 'author',
          content: seoSettings.metaAuthor
        })
      }

      // Open Graph标签
      if (siteInfo.title) {
        updateMetaTag('og-title', {
          property: 'og:title',
          content: siteInfo.title
        })
      }

      if (siteInfo.description) {
        updateMetaTag('og-description', {
          property: 'og:description', 
          content: siteInfo.description
        })
      }

      updateMetaTag('og-type', {
        property: 'og:type',
        content: 'website'
      })

      // 设置语言
      if (siteInfo.language && document.documentElement.lang !== siteInfo.language) {
        document.documentElement.lang = siteInfo.language
      }

    } catch (error) {
      console.error('Error updating basic meta tags:', error)
    }
  }, [loading, getSiteInfo, getSeoSettings, updateMetaTag, updatePageTitle])

  // 更新favicon
  const updateFaviconSafe = useCallback(async () => {
    if (loading) return

    try {
      const siteInfo = getSiteInfo()
      
      if (siteInfo.logo) {
        // 使用自定义logo
        updateFavicon(siteInfo.logo)
      } else {
        // 尝试从API获取
        try {
          const response = await fetch('/api/v1/image/site-favicon')
          if (response.ok) {
            updateFavicon('/api/v1/image/site-favicon')
          } else {
            updateFavicon('/favicon.ico')
          }
        } catch (apiError) {
          console.warn('Failed to fetch favicon from API:', apiError)
          updateFavicon('/favicon.ico')
        }
      }
    } catch (error) {
      console.error('Error updating favicon:', error)
      // 降级到默认favicon
      try {
        updateFavicon('/favicon.ico')
      } catch (fallbackError) {
        console.error('Even fallback favicon update failed:', fallbackError)
      }
    }
  }, [loading, getSiteInfo, updateFavicon])

  // 安全添加分析脚本
  const addAnalyticsScripts = useCallback(() => {
    if (loading) return

    const seoSettings = getSeoSettings()

    try {
      // Google Analytics
      if (seoSettings.googleAnalytics) {
        const existingGA = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${seoSettings.googleAnalytics}"]`)
        
        if (!existingGA) {
          // 创建GA脚本
          const gaScript = document.createElement('script')
          gaScript.async = true
          gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${seoSettings.googleAnalytics}`
          
          // 安全添加到head
          if (document.head) {
            document.head.appendChild(gaScript)
            
            // GA配置脚本
            const gaConfigScript = document.createElement('script')
            gaConfigScript.innerHTML = `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${seoSettings.googleAnalytics}');
            `
            document.head.appendChild(gaConfigScript)
          }
        }
      }

      // 百度统计
      if (seoSettings.baiduAnalytics) {
        const existingBaidu = document.querySelector(`script[src*="hm.baidu.com/hm.js?${seoSettings.baiduAnalytics}"]`)
        
        if (!existingBaidu) {
          const baiduScript = document.createElement('script')
          baiduScript.innerHTML = `
            var _hmt = _hmt || [];
            (function() {
              var hm = document.createElement("script");
              hm.src = "https://hm.baidu.com/hm.js?${seoSettings.baiduAnalytics}";
              var s = document.getElementsByTagName("script")[0]; 
              s.parentNode.insertBefore(hm, s);
            })();
          `
          
          if (document.head) {
            document.head.appendChild(baiduScript)
          }
        }
      }
    } catch (error) {
      console.error('Error adding analytics scripts:', error)
    }
  }, [loading, getSeoSettings])

  // 主要更新effect
  useEffect(() => {
    updateBasicMeta()
  }, [updateBasicMeta])

  // Favicon更新effect  
  useEffect(() => {
    updateFaviconSafe()
  }, [updateFaviconSafe])

  // 分析脚本effect
  useEffect(() => {
    // 延迟加载分析脚本，避免阻塞页面
    const timer = setTimeout(() => {
      addAnalyticsScripts()
    }, 1000)

    return () => clearTimeout(timer)
  }, [addAnalyticsScripts])

  // 错误边界效果
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('removeChild')) {
        console.warn('DOM removeChild error caught in DynamicMetadata:', event.error)
        event.preventDefault()
      }
    }

    window.addEventListener('error', handleError)
    
    return () => {
      window.removeEventListener('error', handleError)
    }
  }, [])

  return null
}