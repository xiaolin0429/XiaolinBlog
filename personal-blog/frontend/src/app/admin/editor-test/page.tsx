"use client"

import { useState } from 'react';
import { NewRichTextEditor } from '@/components/editor/NewRichTextEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EditorTestPage() {
  const [content, setContent] = useState(`# 新工具栏系统测试

这是一个测试新工具栏系统的页面。

## 功能特性

- **粗体文本**
- *斜体文本*
- <u>下划线文本</u>
- ~~删除线文本~~
- \`行内代码\`

### 列表功能

- 无序列表项1
- 无序列表项2
- 无序列表项3

1. 有序列表项1
2. 有序列表项2
3. 有序列表项3

### 引用块

> 这是一个引用块示例
> 可以包含多行内容

### 链接和图片

[这是一个链接](https://example.com)

![图片描述](https://via.placeholder.com/300x200)

### 代码块

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### 表格

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容 | 内容 | 内容 |
| 内容 | 内容 | 内容 |
`);

  // 配置选项
  const [showWordCount, setShowWordCount] = useState(true);
  const [compact, setCompact] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<'top' | 'bottom' | 'floating'>('top');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">编辑器工具栏测试</h1>
          <p className="text-muted-foreground mt-2">
            测试新的模块化工具栏系统
          </p>
        </div>
      </div>

      {/* 配置面板 */}
      <Card>
        <CardHeader>
          <CardTitle>编辑器配置</CardTitle>
          <CardDescription>
            调整编辑器的显示和行为设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="word-count"
                checked={showWordCount}
                onCheckedChange={setShowWordCount}
              />
              <Label htmlFor="word-count">显示字数</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="compact"
                checked={compact}
                onCheckedChange={setCompact}
              />
              <Label htmlFor="compact">紧凑模式</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="show-labels"
                checked={showLabels}
                onCheckedChange={setShowLabels}
              />
              <Label htmlFor="show-labels">显示标签</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="toolbar-position">工具栏位置</Label>
              <Select
                value={toolbarPosition}
                onValueChange={(value: 'top' | 'bottom' | 'floating') => setToolbarPosition(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">顶部</SelectItem>
                  <SelectItem value="bottom">底部</SelectItem>
                  <SelectItem value="floating">浮动</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 编辑器 */}
      <Card>
        <CardHeader>
          <CardTitle>富文本编辑器</CardTitle>
          <CardDescription>
            使用新的工具栏系统进行文本编辑
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewRichTextEditor
            value={content}
            onChange={setContent}
            showWordCount={showWordCount}
            compact={compact}
            showLabels={showLabels}
            toolbarPosition={toolbarPosition}
            placeholder="开始编写你的内容..."
          />
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <Button onClick={() => setContent('')} variant="outline">
          清空内容
        </Button>
        <Button onClick={() => console.log('Content:', content)}>
          输出内容到控制台
        </Button>
      </div>

      {/* 内容预览 */}
      <Card>
        <CardHeader>
          <CardTitle>原始内容</CardTitle>
          <CardDescription>
            查看编辑器的原始Markdown内容
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
            {content}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}