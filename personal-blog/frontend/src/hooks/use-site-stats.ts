import { useState, useEffect } from 'react';

interface SiteStats {
  posts_count: number;
  posts_count_formatted: string;
  views_count: number;
  views_count_formatted: string;
  comments_count: number;
  comments_count_formatted: string;
}

export function useSiteStats() {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/v1/public/stats/site-stats');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('获取统计数据失败:', err);
        setError(err instanceof Error ? err.message : '获取统计数据失败');
        // 设置默认值作为后备
        setStats({
          posts_count: 0,
          posts_count_formatted: '0',
          views_count: 0,
          views_count_formatted: '0',
          comments_count: 0,
          comments_count_formatted: '0'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}