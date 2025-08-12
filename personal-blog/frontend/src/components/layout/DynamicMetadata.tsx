'use client';

import { useEffect } from 'react';
import { useSiteConfig } from '@/contexts/SiteConfigContext';

interface DynamicMetadataProps {
  title?: string;
  description?: string;
  keywords?: string;
}

export function DynamicMetadata({ title, description, keywords }: DynamicMetadataProps) {
  const { config, loading } = useSiteConfig();

  useEffect(() => {
    if (loading) return;

    // 动态更新页面标题
    const pageTitle = title 
      ? `${title} - ${config.site_title || '个人博客'}` 
      : config.site_title || '个人博客';
    
    document.title = pageTitle;

    // 动态更新 meta 描述
    const metaDescription = description || config.site_description || '现代化的个人博客平台';
    let descriptionMeta = document.querySelector('meta[name="description"]');
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta');
      descriptionMeta.setAttribute('name', 'description');
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.setAttribute('content', metaDescription);

    // 动态更新 meta 关键词
    const metaKeywords = keywords || config.site_keywords || '博客,文章,技术分享';
    let keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (!keywordsMeta) {
      keywordsMeta = document.createElement('meta');
      keywordsMeta.setAttribute('name', 'keywords');
      document.head.appendChild(keywordsMeta);
    }
    keywordsMeta.setAttribute('content', metaKeywords);

    // 动态更新 Open Graph 标签
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', pageTitle);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', metaDescription);
    }

  }, [config, loading, title, description, keywords]);

  return null; // 这个组件不渲染任何内容
}