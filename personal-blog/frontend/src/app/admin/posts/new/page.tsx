"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPostRedirect() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到统一编辑器页面
    router.replace('/admin/posts/editor');
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
    </div>
  );
}