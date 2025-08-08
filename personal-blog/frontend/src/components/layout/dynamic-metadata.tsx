"use client"

import { useEffect } from 'react'
import { useSiteConfig } from '@/hooks/use-site-config'

export function DynamicMetadata() {
  const { getSiteInfo, getSeoSettings, loading } = useSiteConfig()

  useEffect(() => {
    if (loading) return

    const siteInfo = getSiteInfo()
    const seoSettings = getSeoSettings()

    // 动态更新页面标题
    if (siteInfo.title) {
      document.title = siteInfo.title
    }

    // 动态更新meta标签
    const updateMetaTag = (name: string, content: string) => {
      if (!content) return
      
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = name
        document.head.appendChild(meta)
      }
      meta.content = content
    }

    const updatePropertyTag = (property: string, content: string) => {
      if (!content) return
      
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('property', property)
        document.head.appendChild(meta)
      }
      meta.content = content
    }

    // 更新基本meta标签
    updateMetaTag('description', siteInfo.description)
    updateMetaTag('keywords', siteInfo.keywords)
    updateMetaTag('author', seoSettings.metaAuthor)

    // 更新Open Graph标签
    updatePropertyTag('og:title', siteInfo.title)
    updatePropertyTag('og:description', siteInfo.description)
    updatePropertyTag('og:type', 'website')

    // 动态更新favicon
    const updateFavicon = async () => {
      // 移除现有的favicon链接
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]')
      existingFavicons.forEach(link => link.remove())

      try {
        // 尝试获取自定义favicon
        const response = await fetch('/api/v1/image/site-favicon')
        
        if (response.ok) {
          // 如果有自定义favicon，使用API端点
          const faviconLink = document.createElement('link')
          faviconLink.rel = 'icon'
          faviconLink.type = 'image/x-icon'
          faviconLink.href = '/api/v1/image/site-favicon'
          document.head.appendChild(faviconLink)

          // 同时添加PNG格式的favicon（现代浏览器支持）
          const pngFaviconLink = document.createElement('link')
          pngFaviconLink.rel = 'icon'
          pngFaviconLink.type = 'image/png'
          pngFaviconLink.href = '/api/v1/image/site-favicon'
          document.head.appendChild(pngFaviconLink)
        } else {
          // 如果没有自定义favicon，使用默认favicon
          const defaultFaviconLink = document.createElement('link')
          defaultFaviconLink.rel = 'icon'
          defaultFaviconLink.type = 'image/x-icon'
          defaultFaviconLink.href = '/favicon.ico'
          document.head.appendChild(defaultFaviconLink)
        }
      } catch (error) {
        // 出错时使用默认favicon
        const defaultFaviconLink = document.createElement('link')
        defaultFaviconLink.rel = 'icon'
        defaultFaviconLink.type = 'image/x-icon'
        defaultFaviconLink.href = '/favicon.ico'
        document.head.appendChild(defaultFaviconLink)
      }
    }

    // 更新favicon
    updateFavicon()

    // 添加Google Analytics
    if (seoSettings.googleAnalytics) {
      // 检查是否已经添加了GA脚本
      if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${seoSettings.googleAnalytics}"]`)) {
        // 添加GA脚本
        const gaScript = document.createElement('script')
        gaScript.async = true
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${seoSettings.googleAnalytics}`
        document.head.appendChild(gaScript)

        // 添加GA配置脚本
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

    // 添加百度统计
    if (seoSettings.baiduAnalytics) {
      // 检查是否已经添加了百度统计脚本
      if (!document.querySelector(`script[src*="hm.baidu.com/hm.js?${seoSettings.baiduAnalytics}"]`)) {
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
        document.head.appendChild(baiduScript)
      }
    }
  }, [loading, getSiteInfo, getSeoSettings])

  return null // 这个组件不渲染任何内容，只是用来更新meta标签
}