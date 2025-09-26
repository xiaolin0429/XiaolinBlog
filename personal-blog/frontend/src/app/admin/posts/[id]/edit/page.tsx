"use client"

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditPostRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const postId = params.id;
    if (postId && postId !== 'new') {
      // 重定向到统一编辑器页面，带上文章ID
      router.replace(`/admin/posts/editor?id=${postId}`);
    } else {
      // 如果是新建文章，重定向到新建页面
      router.replace('/admin/posts/editor');
    }
  }, [router, params.id]);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
    </div>
  );
}