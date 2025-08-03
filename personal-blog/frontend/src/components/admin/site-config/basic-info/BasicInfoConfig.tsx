/**
 * 基础信息配置主组件
 */

'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Eye, Palette } from 'lucide-react';
import { BasicInfoForm } from './components/BasicInfoForm';
import { BasicInfoPreview } from './components/BasicInfoPreview';
import { BasicInfoAnimationContainer } from './components/BasicInfoAnimationContainer';
import { useBasicInfoConfig } from './hooks/useBasicInfoConfig';
import { BasicInfoConfig as BasicInfoConfigType } from './types';
import { DEFAULT_BASIC_INFO_CONFIG } from './constants';

interface BasicInfoConfigProps {
  /** 初始配置数据 */
  initialConfig?: Partial<BasicInfoConfigType>;
  /** 配置保存回调 */
  onSave?: (config: BasicInfoConfigType) => Promise<void>;
}

export function BasicInfoConfig({
  initialConfig = {},
  onSave
}: BasicInfoConfigProps) {
  const [activeTab, setActiveTab] = useState('animation');
  const [loading, setLoading] = useState(false);

  const {
    config,
    updateConfig,
    resetConfig,
    validateConfig,
    hasUnsavedChanges,
    markAsSaved
  } = useBasicInfoConfig({
    initialConfig: {
      ...DEFAULT_BASIC_INFO_CONFIG,
      ...initialConfig
    }
  });

  /**
   * 处理配置保存
   */
  const handleSave = async (configData: BasicInfoConfigType) => {
    if (!onSave) return;

    setLoading(true);
    try {
      await onSave(configData);
      markAsSaved();
    } catch (error) {
      console.error('保存基础信息配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理卡片点击
   */
  const handleCardClick = (field: string) => {
    // 切换到表单标签页并聚焦到对应字段
    setActiveTab('form');
    
    // 延迟聚焦，确保标签页切换完成
    setTimeout(() => {
      const element = document.getElementById(field);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };


  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">基础信息配置</h2>
          <p className="text-muted-foreground">
            配置网站的基本信息，包括标题、描述、语言等设置
          </p>
        </div>
        {hasUnsavedChanges && (
          <Button
            onClick={() => handleSave(config)}
            disabled={loading || !validateConfig().isValid}
          >
            保存更改
          </Button>
        )}
      </div>

      {/* 配置标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="animation" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            动画视图
          </TabsTrigger>
          <TabsTrigger value="form" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            表单配置
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            预览效果
          </TabsTrigger>
        </TabsList>

        {/* 动画视图 */}
        <TabsContent value="animation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基础信息动画配置</CardTitle>
              <CardDescription>
                点击卡片可以快速跳转到对应的配置项进行编辑
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BasicInfoAnimationContainer
                isExpanded={false}
                isTransitioning={false}
                animatingCard={null}
                selectedCardPosition={null}
                validationErrors={{}}
                containerRef={{ current: null }}
                cardRefs={{ current: {} }}
                getConfigValue={(key: string) => config[key as keyof typeof config] || ''}
                onCardClick={handleCardClick}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 表单配置 */}
        <TabsContent value="form" className="space-y-6">
          <BasicInfoForm
            initialData={config}
            onSubmit={handleSave}
            loading={loading}
          />
        </TabsContent>

        {/* 预览效果 */}
        <TabsContent value="preview" className="space-y-6">
          <BasicInfoPreview
            config={config}
            visible={true}
          />
        </TabsContent>
      </Tabs>

      {/* 配置统计信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">配置状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(config).filter(Boolean).length}
              </div>
              <div className="text-sm text-muted-foreground">已配置项目</div>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">
                {validateConfig().isValid ? '✓' : '✗'}
              </div>
              <div className="text-sm text-muted-foreground">配置状态</div>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">
                {hasUnsavedChanges ? '●' : '○'}
              </div>
              <div className="text-sm text-muted-foreground">未保存更改</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BasicInfoConfig;