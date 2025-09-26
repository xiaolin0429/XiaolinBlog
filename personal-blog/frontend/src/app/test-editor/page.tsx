"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  Plus, 
  Edit, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Settings
} from 'lucide-react';
import Link from 'next/link';

export default function TestEditorPage() {
  const [testResults, setTestResults] = useState<{
    [key: string]: 'pending' | 'success' | 'error'
  }>({});

  const testCases = [
    {
      id: 'new-post',
      title: '新建文章',
      description: '测试创建新文章的功能',
      url: '/admin/posts/editor',
      icon: <Plus className="h-4 w-4" />
    },
    {
      id: 'edit-post',
      title: '编辑文章',
      description: '测试编辑现有文章的功能（需要先有文章）',
      url: '/admin/posts/editor?id=1',
      icon: <Edit className="h-4 w-4" />
    },
    {
      id: 'post-list',
      title: '文章列表',
      description: '测试文章管理页面的链接是否正确',
      url: '/admin/posts',
      icon: <FileText className="h-4 w-4" />
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">通过</Badge>;
      case 'error':
        return <Badge variant="destructive">失败</Badge>;
      default:
        return <Badge variant="secondary">待测试</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">统一编辑器测试页面</h1>
        <p className="text-muted-foreground">
          测试新的统一文章编辑器功能是否正常工作
        </p>
      </div>

      {/* 功能概览 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            功能特性
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">编辑功能</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 统一的新建/编辑界面</li>
                <li>• 富文本编辑器</li>
                <li>• 实时保存状态</li>
                <li>• 自动保存（编辑模式）</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">配置功能</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 分步式配置弹窗</li>
                <li>• 表单验证</li>
                <li>• 分类和标签管理</li>
                <li>• 发布状态控制</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">快捷键</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ctrl+S: 快速保存</li>
                <li>• Ctrl+Shift+S: 打开配置</li>
                <li>• Ctrl+Enter: 保存并完成</li>
                <li>• ESC: 关闭弹窗</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">用户体验</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 加载状态指示</li>
                <li>• 错误处理和提示</li>
                <li>• 未保存更改提醒</li>
                <li>• 响应式设计</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 测试用例 */}
      <Card>
        <CardHeader>
          <CardTitle>测试用例</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testCases.map((testCase) => (
              <div
                key={testCase.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {testCase.icon}
                  <div>
                    <h4 className="font-medium">{testCase.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {testCase.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {getStatusBadge(testResults[testCase.id] || 'pending')}
                  <Link href={testCase.url} target="_blank">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      测试
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 测试说明 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>测试说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">新建文章测试</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>点击"测试"按钮打开新建文章页面</li>
                <li>输入文章标题和内容</li>
                <li>按 Ctrl+S 保存内容</li>
                <li>按 Ctrl+Shift+S 打开配置弹窗</li>
                <li>完善文章信息并保存</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">编辑文章测试</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>确保数据库中有ID为1的文章</li>
                <li>点击"测试"按钮打开编辑页面</li>
                <li>验证文章内容是否正确加载</li>
                <li>修改内容并观察自动保存</li>
                <li>测试配置弹窗功能</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">文章列表测试</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>点击"测试"按钮打开文章管理页面</li>
                <li>验证"创建文章"按钮链接是否正确</li>
                <li>验证文章列表中的"编辑"链接是否正确</li>
                <li>测试搜索和筛选功能</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 注意事项 */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">注意事项</h4>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• 测试前请确保后端服务正在运行</li>
              <li>• 编辑文章测试需要数据库中有对应的文章记录</li>
              <li>• 如果遇到CORS错误，请检查后端CORS配置</li>
              <li>• 建议在开发者工具中查看网络请求和控制台日志</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}