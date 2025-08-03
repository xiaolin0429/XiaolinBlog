/**
 * 优化后的网站配置类型定义
 */

// 基础配置项类型
export interface SiteConfig {
  id: number
  key: string
  value: string
  category: 'basic' | 'contact' | 'social' | 'seo' | 'other'
  description: string
  data_type: 'string' | 'number' | 'boolean' | 'json' | 'url' | 'email'
  is_public: string
  sort_order: number
  created_at: string
  updated_at: string
  version?: string
}

// 配置变更类型
export interface ConfigChange {
  key: string
  value?: string
  operation: 'update' | 'delete'
}

// 配置同步信息
export interface ConfigSyncInfo {
  version: string
  checksum: string
  last_modified: string
}

// 配置验证结果
export interface ConfigValidationResult {
  valid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
}

// 配置状态枚举
export enum ConfigStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SYNCING = 'syncing',
  ERROR = 'error'
}

// 配置管理器选项
export interface ConfigManagerOptions {
  category?: string
  autoSync?: boolean
  syncInterval?: number
  enableCache?: boolean
  enableOptimisticUpdates?: boolean
}

// 配置项元数据
export interface ConfigMetadata {
  key: string
  label: string
  description: string
  placeholder?: string
  validation?: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: string
    customValidator?: (value: string) => string | null
  }
  ui?: {
    type: 'input' | 'textarea' | 'select' | 'switch' | 'upload'
    options?: Array<{ label: string; value: string }>
    rows?: number
    accept?: string
  }
}

// 配置分组定义
export interface ConfigGroup {
  id: string
  label: string
  description: string
  category: string
  icon?: string
  items: ConfigMetadata[]
}

// 配置表单状态
export interface ConfigFormState {
  values: Record<string, string>
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  touched: Record<string, boolean>
  dirty: Record<string, boolean>
}

// 配置操作结果
export interface ConfigOperationResult {
  success: boolean
  changed: string[]
  added: string[]
  deleted: string[]
  errors: Record<string, string>
  warnings?: Record<string, string[]>
}

// 配置历史记录
export interface ConfigHistory {
  id: string
  timestamp: string
  user: string
  action: 'create' | 'update' | 'delete' | 'batch_update'
  changes: ConfigChange[]
  description?: string
}

// 配置导入导出格式
export interface ConfigExport {
  version: string
  timestamp: string
  configs: Array<{
    key: string
    value: string
    category: string
    description: string
  }>
  metadata: {
    total: number
    categories: string[]
    exported_by: string
  }
}

// 配置备份信息
export interface ConfigBackup {
  id: string
  name: string
  description?: string
  created_at: string
  size: number
  config_count: number
  categories: string[]
}

// Hook返回类型
export interface UseOptimizedConfigManagerReturn {
  // 状态
  configs: SiteConfig[]
  loading: boolean
  syncing: boolean
  syncInfo: ConfigSyncInfo | null
  status: ConfigStatus
  
  // 数据获取
  getConfigValue: (key: string) => string
  getConfig: (key: string) => SiteConfig | undefined
  getConfigsByCategory: (category: string) => SiteConfig[]
  
  // 数据操作
  updateConfig: (key: string, value: string, immediate?: boolean) => void
  deleteConfig: (key: string) => void
  batchUpdateConfigs: (changes: ConfigChange[]) => Promise<boolean>
  
  // 同步控制
  syncPendingChanges: () => Promise<boolean>
  forceSave: () => Promise<boolean>
  fetchConfigs: () => Promise<void>
  
  // 验证
  validateConfigs: (configs: any[]) => Promise<ConfigValidationResult>
  
  // 状态检查
  hasUnsavedChanges: () => boolean
  pendingChangesCount: number
  
  // 工具方法
  toast: any
  clearCache: () => void
  exportConfigs: (category?: string) => Promise<ConfigExport>
  importConfigs: (data: ConfigExport) => Promise<ConfigOperationResult>
}

// 组件Props类型
export interface ConfigComponentProps {
  configs: SiteConfig[]
  onUpdate: (key: string, value: string) => void
  loading?: boolean
  errors?: Record<string, string[]>
  warnings?: Record<string, string[]>
}

// 配置面板Props
export interface ConfigPanelProps extends ConfigComponentProps {
  title: string
  description?: string
  icon?: string
  group: ConfigGroup
}

// 配置输入组件Props
export interface ConfigInputProps {
  config: ConfigMetadata
  value: string
  error?: string[]
  warning?: string[]
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
}

// 配置预览Props
export interface ConfigPreviewProps {
  configs: Record<string, string>
  category: string
  className?: string
}

// 配置搜索过滤器
export interface ConfigFilter {
  category?: string
  search?: string
  hasValue?: boolean
  hasError?: boolean
  modified?: boolean
}

// 配置排序选项
export interface ConfigSortOption {
  field: 'key' | 'category' | 'updated_at' | 'sort_order'
  direction: 'asc' | 'desc'
}

// 配置统计信息
export interface ConfigStats {
  total: number
  by_category: Record<string, number>
  configured: number
  empty: number
  with_errors: number
  last_updated: string
}

// 配置权限
export interface ConfigPermission {
  read: boolean
  write: boolean
  delete: boolean
  export: boolean
  import: boolean
}

// 配置主题
export interface ConfigTheme {
  primary: string
  secondary: string
  success: string
  warning: string
  error: string
  background: string
  surface: string
  text: string
}