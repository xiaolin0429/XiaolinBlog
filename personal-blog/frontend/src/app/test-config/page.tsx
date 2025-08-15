'use client';

import { useSiteConfig } from '@/contexts/SiteConfigContext';

export default function TestConfigPage() {
  const { config, loading, error, getSiteInfo } = useSiteConfig();
  const siteInfo = getSiteInfo();

  if (loading) {
    return <div className="p-8">加载配置中...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">错误: {error}</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">配置测试页面</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">原始配置数据</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">解析后的站点信息</h2>
        <div className="bg-gray-100 p-4 rounded space-y-2">
          <p><strong>标题:</strong> {siteInfo.title}</p>
          <p><strong>副标题:</strong> {siteInfo.subtitle}</p>
          <p><strong>描述:</strong> {siteInfo.description}</p>
          <p><strong>作者:</strong> {config.site_author}</p>
          <p><strong>语言:</strong> {siteInfo.language}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">配置项数量</h2>
        <p>共 {Object.keys(config).length} 个配置项</p>
      </div>
    </div>
  );
}