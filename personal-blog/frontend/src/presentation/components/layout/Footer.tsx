/**
 * 网站底部组件
 * 迁移并更新到新架构
 */

"use client"

import Link from "next/link"
import { Github, Mail, Phone, MapPin, MessageCircle, Twitter } from "lucide-react"

export function Footer() {
  // 临时使用硬编码的配置信息，避免Zustand缓存问题
  const siteInfo = {
    title: '个人博客',
    subtitle: '分享技术与生活',
    description: '这是一个个人技术博客',
    copyright: null,
    icp: null,
    publicSecurity: null
  }
  
  const socialLinks = {
    github: null,
    twitter: null,
    weibo: null,
    wechat: null,
    linkedin: null
  }
  
  const otherSettings = {
    notice: null
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 网站信息 */}
          <div className="space-y-4">
            {/* 网站Logo */}
            <div className="flex items-center space-x-3">
              {siteInfo.logo && (
                <img 
                  src={siteInfo.logo} 
                  alt="网站Logo" 
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <h3 className="font-semibold text-lg">
                {siteInfo.title || '个人博客'}
              </h3>
            </div>
            <p className="text-muted-foreground text-sm">
              {siteInfo.subtitle || '分享技术与生活'}
            </p>
            <p className="text-muted-foreground text-sm">
              {siteInfo.description || '这是一个个人技术博客'}
            </p>
          </div>

          {/* 快速链接 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">快速链接</h3>
            <div className="space-y-2">
              <Link href="/" className="block text-sm text-muted-foreground hover:text-foreground">
                首页
              </Link>
              <Link href="/posts" className="block text-sm text-muted-foreground hover:text-foreground">
                文章
              </Link>
              <Link href="/categories" className="block text-sm text-muted-foreground hover:text-foreground">
                分类
              </Link>
              <Link href="/tags" className="block text-sm text-muted-foreground hover:text-foreground">
                标签
              </Link>
              <Link href="/about" className="block text-sm text-muted-foreground hover:text-foreground">
                关于
              </Link>
            </div>
          </div>

          {/* 社交媒体 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">关注我们</h3>
            <div className="space-y-2">
              {socialLinks.github && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Github className="w-4 h-4" />
                  <a 
                    href={socialLinks.github} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-foreground"
                  >
                    GitHub
                  </a>
                </div>
              )}
              {socialLinks.twitter && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Twitter className="w-4 h-4" />
                  <a 
                    href={socialLinks.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-foreground"
                  >
                    Twitter
                  </a>
                </div>
              )}
              {socialLinks.weibo && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Twitter className="w-4 h-4" />
                  <a 
                    href={socialLinks.weibo} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-foreground"
                  >
                    微博
                  </a>
                </div>
              )}
              {socialLinks.wechat && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <MessageCircle className="w-4 h-4" />
                  <span>微信: {socialLinks.wechat}</span>
                </div>
              )}
              {socialLinks.linkedin && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <a 
                    href={socialLinks.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-foreground"
                  >
                    LinkedIn
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* 其他信息 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">其他信息</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              {otherSettings.notice && (
                <div>
                  <p className="font-medium">网站公告</p>
                  <p>{otherSettings.notice}</p>
                </div>
              )}
              <div className="space-y-1">
                <p>
                  {siteInfo.copyright 
                    ? siteInfo.copyright 
                    : `© ${currentYear} ${siteInfo.title || '个人博客'}. 保留所有权利。`
                  }
                </p>
                {siteInfo.icp && (
                  <div className="flex items-center space-x-2">
                    <img 
                      src="/images/icp_logo.png" 
                      alt="ICP备案" 
                      className="w-4 h-4 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <a 
                      href="https://beian.miit.gov.cn/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-foreground"
                    >
                      {siteInfo.icp}
                    </a>
                  </div>
                )}
                {siteInfo.publicSecurity && (
                  <div className="flex items-center space-x-2">
                    <img 
                      src="/images/beian_logo.png" 
                      alt="公安备案" 
                      className="w-4 h-4 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <a 
                      href="http://www.beian.gov.cn/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-foreground"
                    >
                      {siteInfo.publicSecurity}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}