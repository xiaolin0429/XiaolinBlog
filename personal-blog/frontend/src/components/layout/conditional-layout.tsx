"use client";

import { usePathname } from 'next/navigation';
import { Header } from './header';
import { Footer } from './footer';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // 检查是否是管理后台页面
  const isAdminPage = pathname.startsWith('/admin');
  
  // 如果是管理后台页面，不显示前台的Header和Footer
  if (isAdminPage) {
    return <>{children}</>;
  }
  
  // 前台页面显示完整布局
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}