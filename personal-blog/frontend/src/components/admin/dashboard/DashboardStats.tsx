import { Card, CardContent, CardHeader, CardTitle } from '../../../presentation/components/ui';
import { FileText, Eye, MessageSquare, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalViews: number;
    totalComments: number;
    approvedComments: number;
    featuredPosts: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: '总文章数',
      value: stats.totalPosts,
      description: `${stats.publishedPosts} 已发布 · ${stats.draftPosts} 草稿`,
      icon: FileText,
    },
    {
      title: '总浏览量',
      value: stats.totalViews,
      description: '所有文章累计浏览',
      icon: Eye,
    },
    {
      title: '总评论数',
      value: stats.totalComments,
      description: `${stats.approvedComments} 用户互动反馈`,
      icon: MessageSquare,
    },
    {
      title: '精选文章',
      value: stats.featuredPosts,
      description: '推荐优质文章',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}