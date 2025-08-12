/**
 * 博客配置类型定义
 */

// 配置分类枚举
export enum ConfigCategory {
  SITE_BASIC = 'site_basic',
  SITE_APPEARANCE = 'site_appearance',
  SEO = 'seo',
  SOCIAL = 'social',
  COMMENT = 'comment',
  EMAIL = 'email',
  SYSTEM = 'system'
}

// 配置数据类型枚举
export enum ConfigDataType {
  STRING = 'string',
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  URL = 'url',
  EMAIL = 'email',
  COLOR = 'color',
  IMAGE = 'image',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select'
}

// 配置分组基础接口
export interface ConfigGroup {
  id: number;
  group_key: string;
  group_name: string;
  category: ConfigCategory;
  icon_name?: string;
  color_scheme?: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 博客配置基础接口
export interface BlogConfig {
  id: number;
  config_key: string;
  config_value?: string;
  default_value?: string;
  category: ConfigCategory;
  group_key?: string;
  data_type: ConfigDataType;
  display_name: string;
  description?: string;
  placeholder?: string;
  help_text?: string;
  validation_rules?: Record<string, any>;
  options?: Array<Record<string, any>>;
  is_required: boolean;
  is_public: boolean;
  is_enabled: boolean;
  sort_order: number;
  version: number;
  created_at: string;
  updated_at: string;
}

// 公开的博客配置接口
export interface BlogConfigPublic {
  config_key: string;
  config_value?: string;
  data_type: ConfigDataType;
  display_name: string;
  description?: string;
}

// 创建配置分组请求
export interface ConfigGroupCreate {
  group_key: string;
  group_name: string;
  category: ConfigCategory;
  icon_name?: string;
  color_scheme?: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

// 更新配置分组请求
export interface ConfigGroupUpdate {
  group_name?: string;
  category?: ConfigCategory;
  icon_name?: string;
  color_scheme?: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

// 创建博客配置请求
export interface BlogConfigCreate {
  config_key: string;
  config_value?: string;
  default_value?: string;
  category: ConfigCategory;
  group_key?: string;
  data_type?: ConfigDataType;
  display_name: string;
  description?: string;
  placeholder?: string;
  help_text?: string;
  validation_rules?: Record<string, any>;
  options?: Array<Record<string, any>>;
  is_required?: boolean;
  is_public?: boolean;
  is_enabled?: boolean;
  sort_order?: number;
}

// 更新博客配置请求
export interface BlogConfigUpdate {
  config_value?: string;
  default_value?: string;
  category?: ConfigCategory;
  group_key?: string;
  data_type?: ConfigDataType;
  display_name?: string;
  description?: string;
  placeholder?: string;
  help_text?: string;
  validation_rules?: Record<string, any>;
  options?: Array<Record<string, any>>;
  is_required?: boolean;
  is_public?: boolean;
  is_enabled?: boolean;
  sort_order?: number;
}

// 配置值更新
export interface ConfigValueUpdate {
  config_key: string;
  config_value?: string;
}

// 批量配置更新请求
export interface BatchConfigUpdate {
  configs: ConfigValueUpdate[];
  change_reason?: string;
}

// 分组配置响应
export interface GroupedConfigResponse {
  group: ConfigGroup;
  configs: BlogConfig[];
}

// 配置统计信息
export interface ConfigStats {
  total_configs: number;
  enabled_configs: number;
  public_configs: number;
  categories_count: number;
  groups_count: number;
  last_updated?: string;
}

// API响应包装
export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}