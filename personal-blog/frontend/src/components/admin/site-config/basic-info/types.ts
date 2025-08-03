/**
 * 基础信息配置相关类型定义
 */

export interface BasicInfoConfig {
  /** 网站标题 */
  title: string;
  /** 网站副标题/标语 */
  subtitle: string;
  /** 网站描述 */
  description: string;
  /** 网站Logo URL */
  logo: string;
  /** 网站图标 URL */
  favicon: string;
  /** 网站语言 */
  language: string;
  /** 时区 */
  timezone: string;
  /** 版权信息 */
  copyright: string;
  /** ICP备案号 */
  icp: string;
  /** 公安备案号 */
  publicSecurity: string;
}

export interface BasicInfoFormData extends BasicInfoConfig {}

export interface BasicInfoFormProps {
  /** 初始配置数据 */
  initialData?: Partial<BasicInfoConfig>;
  /** 表单提交回调 */
  onSubmit: (data: BasicInfoConfig) => void;
  /** 是否正在加载 */
  loading?: boolean;
  /** 是否禁用表单 */
  disabled?: boolean;
}

export interface BasicInfoPreviewProps {
  /** 配置数据 */
  config: BasicInfoConfig;
  /** 是否显示预览 */
  visible?: boolean;
}

export interface BasicInfoValidationResult {
  /** 是否验证通过 */
  isValid: boolean;
  /** 错误信息 */
  errors: Record<string, string>;
}

export interface BasicInfoCardItem {
  /** 唯一标识 */
  id: string;
  /** 配置键名 */
  key: string;
  /** 显示名称 */
  label: string;
  /** 字段名 */
  field: keyof BasicInfoConfig;
  /** 图标 */
  icon: React.ComponentType<any>;
  /** 描述 */
  description: string;
  /** 是否必填 */
  required: boolean;
  /** 输入类型 */
  type: 'text' | 'textarea' | 'url' | 'select';
  /** 占位符 */
  placeholder: string;
  /** 最大长度 */
  maxLength?: number;
  /** 选项（用于select类型） */
  options?: Array<{ label: string; value: string }>;
}

/** 基础信息数据（别名） */
export interface BasicInfoData extends BasicInfoConfig {}

/** 基础信息字段类型 */
export type BasicInfoField = keyof BasicInfoConfig;

/** 基础信息分组 */
export interface BasicInfoGroup {
  /** 分组ID */
  id: string;
  /** 分组标题 */
  title: string;
  /** 分组描述 */
  description: string;
  /** 分组字段 */
  fields: BasicInfoField[];
}
