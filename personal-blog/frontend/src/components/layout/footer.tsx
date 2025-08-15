"use client"

import Link from "next/link";
import { Github, Mail, Phone, MapPin, MessageCircle, Twitter } from "lucide-react";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

export function Footer() {
  const { getSiteInfo, getSocialLinks, getOtherSettings, loading } = useSiteConfig();

  const siteInfo = getSiteInfo();
  const socialLinks = getSocialLinks();
  const otherSettings = getOtherSettings();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 网站信息 */}
          <div className="space-y-4">
            {/* 网站Logo */}
            <div className="flex items-center space-x-3">
              <img 
                src="/api/v1/image/site-logo" 
                alt="网站Logo" 
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            <h3 className="font-semibold text-lg">
              {loading ? '加载中...' : (siteInfo.title || '个人博客')}
            </h3>
            </div>
            <p className="text-muted-foreground text-sm">
              {loading ? '分享技术与生活' : (siteInfo.subtitle || '分享技术与生活')}
            </p>
            <p className="text-muted-foreground text-sm">
              {loading ? '这是一个个人技术博客' : (siteInfo.description || '这是一个个人技术博客')}
            </p>
          </div>


          {/* 社交媒体 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">关注我们</h3>
            <div className="space-y-2">
              {socialLinks.github && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Github className="w-4 h-4" />
                  <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                    GitHub
                  </a>
                </div>
              )}
              {socialLinks.weibo && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Twitter className="w-4 h-4" />
                  <a href={socialLinks.weibo} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
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
                  {otherSettings.copyright 
                    ? otherSettings.copyright 
                    : `© ${currentYear} ${siteInfo.title || '个人博客'}. 保留所有权利。`
                  }
                </p>
                {otherSettings.icp && (
                  <div className="flex items-center space-x-2">
                    <img 
                      src="/images/icp_logo.png" 
                      alt="ICP备案" 
                      className="w-4 h-4 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                      {otherSettings.icp}
                    </a>
                  </div>
                )}
                {otherSettings.publicSecurity && (
                  <div className="flex items-center space-x-2">
                    <img 
                      src="/images/beian_logo.png" 
                      alt="公安备案" 
                      className="w-4 h-4 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <a href="http://www.beian.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                      {otherSettings.publicSecurity}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}