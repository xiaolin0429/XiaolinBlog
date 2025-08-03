/**
 * 基础信息表单组件
 */

'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { BasicInfoFormProps, BasicInfoConfig } from '../types';
import { BASIC_INFO_ITEMS } from '../constants';
import { useBasicInfoConfig } from '../hooks/useBasicInfoConfig';

export function BasicInfoForm({
  initialData,
  onSubmit,
  loading = false,
  disabled = false
}: BasicInfoFormProps) {
  const {
    config,
    updateConfig,
    resetConfig,
    validateConfig,
    hasUnsavedChanges
  } = useBasicInfoConfig({
    initialConfig: initialData,
    onConfigChange: (newConfig) => {
      // 可以在这里添加实时保存逻辑
    }
  });

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateConfig();
    if (!validation.isValid) {
      // 显示验证错误
      return;
    }
    
    await onSubmit(config);
  };

  /**
   * 处理字段值变更
   */
  const handleFieldChange = (field: keyof BasicInfoConfig, value: string) => {
    updateConfig({ [field]: value });
  };

  /**
   * 渲染表单字段
   */
  const renderFormField = (item: typeof BASIC_INFO_ITEMS[0]) => {
    const value = config[item.field] || '';
    const Icon = item.icon;

    switch (item.type) {
      case 'textarea':
        return (
          <div key={item.id} className="space-y-2">
            <Label htmlFor={item.id} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {item.label}
              {item.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={item.id}
              value={value}
              onChange={(e) => handleFieldChange(item.field, e.target.value)}
              placeholder={item.placeholder}
              disabled={disabled || loading}
              maxLength={item.maxLength}
              rows={3}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              {item.description}
              {item.maxLength && (
                <span className="ml-2">
                  ({value.length}/{item.maxLength})
                </span>
              )}
            </p>
          </div>
        );

      case 'select':
        return (
          <div key={item.id} className="space-y-2">
            <Label htmlFor={item.id} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {item.label}
              {item.required && <span className="text-red-500">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(newValue) => handleFieldChange(item.field, newValue)}
              disabled={disabled || loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={item.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {item.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {item.description}
            </p>
          </div>
        );

      default:
        return (
          <div key={item.id} className="space-y-2">
            <Label htmlFor={item.id} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {item.label}
              {item.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={item.id}
              type={item.type === 'url' ? 'url' : 'text'}
              value={value}
              onChange={(e) => handleFieldChange(item.field, e.target.value)}
              placeholder={item.placeholder}
              disabled={disabled || loading}
              maxLength={item.maxLength}
            />
            <p className="text-sm text-muted-foreground">
              {item.description}
              {item.maxLength && (
                <span className="ml-2">
                  ({value.length}/{item.maxLength})
                </span>
              )}
            </p>
          </div>
        );
    }
  };

  const validation = validateConfig();

  return (
    <Card>
      <CardHeader>
        <CardTitle>基础信息配置</CardTitle>
        <CardDescription>
          配置网站的基本信息，包括标题、描述、语言等设置
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 网站基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">网站基本信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BASIC_INFO_ITEMS.slice(0, 3).map(renderFormField)}
            </div>
          </div>

          {/* 网站资源 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">网站资源</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BASIC_INFO_ITEMS.slice(3, 5).map(renderFormField)}
            </div>
          </div>

          {/* 本地化设置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">本地化设置</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BASIC_INFO_ITEMS.slice(5, 7).map(renderFormField)}
            </div>
          </div>

          {/* 法律信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">法律信息</h3>
            <div className="grid grid-cols-1 gap-4">
              {BASIC_INFO_ITEMS.slice(7).map(renderFormField)}
            </div>
          </div>

          {/* 验证错误提示 */}
          {!validation.isValid && (
            <Alert variant="destructive">
              <AlertDescription>
                请修正以下错误：
                <ul className="mt-2 list-disc list-inside">
                  {Object.entries(validation.errors).map(([field, error]) => (
                    <li key={field}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={resetConfig}
              disabled={disabled || loading || !hasUnsavedChanges}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              重置
            </Button>

            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <span className="text-sm text-muted-foreground">
                  有未保存的更改
                </span>
              )}
              <Button
                type="submit"
                disabled={disabled || loading || !validation.isValid}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                保存配置
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}