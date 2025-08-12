'use client';

import React from 'react';
import Link from 'next/link';
import { useSiteConfig } from '@/contexts/SiteConfigContext';

export function DynamicFooter() {
  const { config, loading } = useSiteConfig();

  const footerLinks = [
    {
      title: '快速链接',
      links: [
        { name: '首页', href: '/' },
        { name: '文章', href: '/posts' },
        { name: '分类', href: '/categories' },
        { name: '标签', href: '/tags' },
        { name: '关于', href: '/about' },
      ],
    },
  ];

  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 站点信息 */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  {loading ? 'B' : (config.site_title?.charAt(0) || 'B')}
                </span>
              </div>
              <span className="font-bold text-lg">
                {loading ? '加载中...' : (config.site_title || '个人博客')}
              </span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              {loading ? '加载中...' : (config.site_subtitle || '分享技术与生活')}
            </p>
            <p className="text-sm text-muted-foreground">
              {loading ? '加载中...' : (config.site_description || '这是一个技术博客')}
            </p>
          </div>

          {/* 快速链接 */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* 关注我 */}
          <div>
            <h3 className="font-semibold mb-4">关注我</h3>
            <p className="text-sm text-muted-foreground">
              在这里，我分享技术见解和学习历程
            </p>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {loading ? '个人博客' : (config.site_title || '个人博客')}. 
            {config.site_author && ` 由 ${config.site_author} 创建`}
          </p>
        </div>
      </div>
    </footer>
  );
}