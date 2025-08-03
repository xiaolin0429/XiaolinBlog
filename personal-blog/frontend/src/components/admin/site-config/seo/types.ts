/**
 * SEO配置类型定义
 */

import { ComponentType } from 'react';

/** SEO配置接口 */
export interface SeoConfig {
  /** SEO关键词 */
  keywords: string;
  /** SEO描述 */
  description: string;
  /** 作者信息 */
  author: string;
  /** 网站类型 */
  siteType: string;
  /** Open Graph 标题 */
  ogTitle: string;
  /** Open Graph 描述 */
  ogDescription: string;
  /** Open Graph 图片 */
  ogImage: string;
  /** Twitter Card 类型 */
  twitterCard: string;
  /** 结构化数据 */
  structuredData: string;
  /** 自定义meta标签 */
  customMeta: string;
}

/** SEO数据（别名） */
export interface SeoData extends SeoConfig {}

/** SEO表单数据 */
export interface SeoFormData extends SeoConfig {}

/** SEO字段类型 */
export type SeoField = keyof SeoConfig;

/** SEO分组 */
export interface SeoGroup {
  /** 分组ID */
  id: string;
  /** 分组标题 */
  title: string;
  /** 分组描述 */
  description: string;
  /** 分组字段 */
  fields: SeoField[];
}

/** 验证错误信息 */
export interface ValidationErrors {
  [key: string]: string;
}

/** SEO分析结果 */
export interface SeoAnalysis {
  /** 分析得分 */
  score: number;
  /** 分析建议 */
  suggestions: string[];
  /** 关键词密度 */
  keywordDensity: number;
  /** 内容长度 */
  contentLength: number;
}

/** SEO卡片项 */
export interface SeoCardItem {
  /** 唯一标识 */
  id: keyof SeoConfig;
  /** 显示标签 */
  label: string;
  /** 字段名 */
  field: keyof SeoConfig;
  /** 图标组件 */
  icon: ComponentType<any>;
  /** 描述信息 */
  description: string;
  /** 是否必填 */
  required: boolean;
  /** 输入类型 */
  type: 'text' | 'textarea' | 'select' | 'url';
  /** 占位符 */
  placeholder: string;
  /** 最大长度 */
  maxLength?: number;
  /** 最小长度 */
  minLength?: number;
  /** 选项列表（用于select类型） */
  options?: Array<{ value: string; label: string }>;
}

/** SEO配置属性 */
export interface SeoConfigProps {
  /** 配置数据 */
  configs: SeoConfig;
  /** 配置更新回调 */
  onConfigChange: (configs: SeoConfig) => void;
  /** 是否只读 */
  readonly?: boolean;
}

/** SEO验证结果 */
export interface SeoValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 错误信息 */
  errors: Record<keyof SeoConfig, string>;
  /** 警告信息 */
  warnings: Array<{
    type: 'warning' | 'error';
    field: keyof SeoConfig;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  /** 优化建议 */
  suggestions: Array<{
    field: keyof SeoConfig;
    message: string;
    action: string;
  }>;
}
