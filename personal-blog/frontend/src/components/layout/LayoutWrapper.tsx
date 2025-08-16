'use client';

import { usePathname } from "next/navigation";
import { PublicLayout } from "../../presentation/layouts/PublicLayout";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  // 管理后台页面不使用 PublicLayout
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // 其他页面使用 PublicLayout
  return (
    <PublicLayout>
      {children}
    </PublicLayout>
  );
}