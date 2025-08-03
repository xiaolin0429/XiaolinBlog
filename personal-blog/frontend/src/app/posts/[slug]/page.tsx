import { postsAPI } from '@/lib/api/posts';
import PostDetail from '@/components/post-detail';

interface PageProps {
  params: {
    slug: string;
  };
}

export default function PostPage({ params }: PageProps) {
  return <PostDetail slug={params.slug} />;
}

// 生成静态参数（用于静态生成）
export async function generateStaticParams() {
  // 在实际应用中，这里会从 API 获取所有文章的 slug
  return [
    { slug: 'react-18-new-features' },
    { slug: 'typescript-advanced-types' },
    { slug: 'nextjs-14-app-router-guide' },
  ];
}

// 生成元数据
export async function generateMetadata({ params }: PageProps) {
  try {
    const post = await postsAPI.getPostBySlug(params.slug);
    return {
      title: post.title,
      description: post.excerpt || post.content.substring(0, 160),
      openGraph: {
        title: post.title,
        description: post.excerpt || post.content.substring(0, 160),
        images: post.featured_image ? [post.featured_image] : [],
      },
    };
  } catch (error) {
    return {
      title: '文章未找到',
      description: '请求的文章不存在',
    };
  }
}
