"use client"

import Link from "next/link";
import { ArrowRight, BookOpen, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteConfig } from "@/hooks/use-site-config";

export function HeroSection() {
  const { getSiteInfo, loading } = useSiteConfig();
  const siteInfo = getSiteInfo();
  const stats = [
    {
      icon: BookOpen,
      label: "文章数量",
      value: "128",
    },
    {
      icon: Users,
      label: "访问用户",
      value: "2.5K",
    },
    {
      icon: MessageCircle,
      label: "评论数量",
      value: "456",
    },
  ];

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* 主标题 */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
            分享
            <span className="text-primary"> 技术</span>
            <br />
            记录
            <span className="text-primary"> 成长</span>
          </h1>
          
          {/* 副标题 */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            {loading ? 
              '在这里，我分享编程心得、技术见解和学习历程，与你一起探索代码世界的无限可能' : 
              (siteInfo.description || '在这里，我分享编程心得、技术见解和学习历程，与你一起探索代码世界的无限可能')
            }
          </p>
          
          {/* 行动按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/posts">
                开始阅读
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link href="/about">
                了解更多
              </Link>
            </Button>
          </div>
          
          {/* 统计数据 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}