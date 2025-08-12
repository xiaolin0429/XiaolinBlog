/**
 * 首页 - 使用新架构
 * 迁移到新架构的首页
 */

import React, { Suspense } from "react";
import { AppProvider } from "../AppProvider";
import { PublicLayout } from "../presentation/layouts/PublicLayout";
import { HeroSection } from "../components/home/hero-section";
import { LatestPosts } from "../components/home/latest-posts";
import { CategoriesTags } from "../components/home/categories-tags";
import { DynamicMetadata } from "../components/layout/DynamicMetadata";

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-96 bg-muted rounded-lg mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}

function HomePageContent() {
  return (
    <main className="min-h-screen">
      {/* Hero 部分 */}
      <Suspense fallback={<LoadingSkeleton />}>
        <HeroSection />
      </Suspense>

      {/* 最新文章部分 */}
      <Suspense fallback={<LoadingSkeleton />}>
        <LatestPosts />
      </Suspense>

      {/* 分类和标签部分 */}
      <Suspense fallback={<LoadingSkeleton />}>
        <CategoriesTags />
      </Suspense>
    </main>
  );
}

export default function HomePage() {
  return (
    <PublicLayout>
      <DynamicMetadata />
      <HomePageContent />
    </PublicLayout>
  );
}
