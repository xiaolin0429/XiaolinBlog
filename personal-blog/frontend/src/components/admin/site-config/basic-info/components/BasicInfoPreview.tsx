/**
 * 基础信息预览组件
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Globe, Type, FileText, Image, Star, Languages, Clock, Copyright, Shield, ShieldCheck } from 'lucide-react';
import { BasicInfoPreviewProps } from '../types';
import { getConfigDisplayValue } from '../hooks/useBasicInfoConfig';

export function BasicInfoPreview({ config, visible = true }: BasicInfoPreviewProps) {
  if (!visible) return null;

  const previewItems = [
    {
      icon: Type,
      label: '网站标题',
      value: config.site_title,
      required: true
    },
    {
      icon: FileText,
      label: '网站副标题',
      value: config.site_subtitle,
      required: false
    },
    {
      icon: FileText,
      label: '网站描述',
      value: config.site_description,
      required: true
    },
    {
      icon: Image,
      label: '网站Logo',
      value: config.site_logo,
      required: false,
      isUrl: true
    },
    {
      icon: Star,
      label: '网站图标',
      value: config.site_favicon,
      required: false,
      isUrl: true
    },
    {
      icon: Languages,
      label: '网站语言',
      value: getConfigDisplayValue(config, 'site_language'),
      required: true
    },
    {
      icon: Clock,
      label: '时区设置',
      value: getConfigDisplayValue(config, 'site_timezone'),
      required: true
    },
    {
      icon: Copyright,
      label: '版权信息',
      value: config.site_copyright,
      required: false
    },
    {
      icon: Shield,
      label: 'ICP备案号',
      value: config.site_icp,
      required: false
    },
    {
      icon: ShieldCheck,
      label: '公安备案号',
      value: config.site_public_security,
      required: false
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          基础信息预览
        </CardTitle>
        <CardDescription>
          当前配置的基础信息预览效果
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 网站基本信息预览 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">网站基本信息</h3>
          <div className="space-y-3">
            {previewItems.slice(0, 3).map((item, index) => {
              const Icon = item.icon;
              const hasValue = Boolean(item.value);
              
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{item.label}</span>
                      {item.required && (
                        <Badge variant={hasValue ? "default" : "destructive"} className="text-xs">
                          {hasValue ? "已配置" : "必填"}
                        </Badge>
                      )}
                      {!item.required && hasValue && (
                        <Badge variant="secondary" className="text-xs">
                          已配置
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm ${hasValue ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {hasValue ? item.value : '未配置'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* 网站资源预览 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">网站资源</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {previewItems.slice(3, 5).map((item, index) => {
              const Icon = item.icon;
              const hasValue = Boolean(item.value);
              
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{item.label}</span>
                      {hasValue && (
                        <Badge variant="secondary" className="text-xs">
                          已配置
                        </Badge>
                      )}
                    </div>
                    {hasValue && item.isUrl ? (
                      <a 
                        href={item.value} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className={`text-sm ${hasValue ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {hasValue ? item.value : '未配置'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* 本地化设置预览 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">本地化设置</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {previewItems.slice(5, 7).map((item, index) => {
              const Icon = item.icon;
              const hasValue = Boolean(item.value);
              
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{item.label}</span>
                      <Badge variant={hasValue ? "default" : "destructive"} className="text-xs">
                        {hasValue ? "已配置" : "必填"}
                      </Badge>
                    </div>
                    <p className={`text-sm ${hasValue ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {hasValue ? item.value : '未配置'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* 法律信息预览 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">法律信息</h3>
          <div className="space-y-3">
            {previewItems.slice(7).map((item, index) => {
              const Icon = item.icon;
              const hasValue = Boolean(item.value);
              
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{item.label}</span>
                      {hasValue && (
                        <Badge variant="secondary" className="text-xs">
                          已配置
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm ${hasValue ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {hasValue ? item.value : '未配置'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 配置完整度统计 */}
        <Separator />
        <div className="space-y-2">
          <h4 className="font-medium">配置完整度</h4>
          <div className="flex items-center gap-4">
            {(() => {
              const requiredItems = previewItems.filter(item => item.required);
              const configuredRequired = requiredItems.filter(item => Boolean(item.value));
              const optionalItems = previewItems.filter(item => !item.required);
              const configuredOptional = optionalItems.filter(item => Boolean(item.value));
              
              return (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant={configuredRequired.length === requiredItems.length ? "default" : "destructive"}>
                      必填项: {configuredRequired.length}/{requiredItems.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      可选项: {configuredOptional.length}/{optionalItems.length}
                    </Badge>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}