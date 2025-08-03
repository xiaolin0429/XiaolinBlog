/**
 * 基础信息配置常量定义
 */

import { 
  Globe, 
  Type, 
  FileText, 
  Image, 
  Star, 
  Languages, 
  Clock, 
  Copyright,
  Shield,
  ShieldCheck
} from 'lucide-react';
import { BasicInfoCardItem } from './types';

/** 基础信息配置项 */
export const BASIC_INFO_ITEMS: BasicInfoCardItem[] = [
  {
    id: 'site_title',
    key: 'site_title',
    label: '网站标题',
    field: 'title',
    icon: Type,
    description: '网站的主标题，显示在浏览器标签页和搜索结果中',
    required: true,
    type: 'text',
    placeholder: '请输入网站标题',
    maxLength: 60
  },
  {
    id: 'site_subtitle',
    key: 'site_subtitle',
    label: '网站副标题',
    field: 'subtitle',
    icon: FileText,
    description: '网站的副标题或标语，用于补充说明网站主题',
    required: false,
    type: 'text',
    placeholder: '请输入网站副标题',
    maxLength: 100
  },
  {
    id: 'site_description',
    key: 'site_description',
    label: '网站描述',
    field: 'description',
    icon: FileText,
    description: '网站的详细描述，用于SEO和搜索引擎优化',
    required: true,
    type: 'textarea',
    placeholder: '请输入网站描述',
    maxLength: 200
  },
  {
    id: 'site_logo',
    key: 'site_logo',
    label: '网站Logo',
    field: 'logo',
    icon: Image,
    description: '网站的Logo图片URL，建议使用PNG格式',
    required: false,
    type: 'url',
    placeholder: '请输入Logo图片URL'
  },
  {
    id: 'site_favicon',
    key: 'site_favicon',
    label: '网站图标',
    field: 'favicon',
    icon: Star,
    description: '网站的Favicon图标URL，显示在浏览器标签页',
    required: false,
    type: 'url',
    placeholder: '请输入Favicon图标URL'
  },
  {
    id: 'site_language',
    key: 'site_language',
    label: '网站语言',
    field: 'language',
    icon: Languages,
    description: '网站的主要语言设置',
    required: true,
    type: 'select',
    placeholder: '请选择网站语言',
    options: [
      { label: '简体中文', value: 'zh-CN' },
      { label: '繁体中文', value: 'zh-TW' },
      { label: 'English', value: 'en-US' },
      { label: '日本語', value: 'ja-JP' },
      { label: '한국어', value: 'ko-KR' }
    ]
  },
  {
    id: 'site_timezone',
    key: 'site_timezone',
    label: '时区设置',
    field: 'timezone',
    icon: Clock,
    description: '网站的时区设置，影响时间显示',
    required: true,
    type: 'select',
    placeholder: '请选择时区',
    options: [
      { label: '北京时间 (UTC+8)', value: 'Asia/Shanghai' },
      { label: '东京时间 (UTC+9)', value: 'Asia/Tokyo' },
      { label: '首尔时间 (UTC+9)', value: 'Asia/Seoul' },
      { label: '纽约时间 (UTC-5)', value: 'America/New_York' },
      { label: '洛杉矶时间 (UTC-8)', value: 'America/Los_Angeles' },
      { label: '伦敦时间 (UTC+0)', value: 'Europe/London' }
    ]
  },
  {
    id: 'site_copyright',
    key: 'site_copyright',
    label: '版权信息',
    field: 'copyright',
    icon: Copyright,
    description: '网站的版权声明信息',
    required: false,
    type: 'text',
    placeholder: '请输入版权信息',
    maxLength: 100
  },
  {
    id: 'site_icp',
    key: 'site_icp',
    label: 'ICP备案号',
    field: 'icp',
    icon: Shield,
    description: '网站的ICP备案号（中国大陆网站必填）',
    required: false,
    type: 'text',
    placeholder: '请输入ICP备案号'
  },
  {
    id: 'site_public_security',
    key: 'site_public_security',
    label: '公安备案号',
    field: 'publicSecurity',
    icon: ShieldCheck,
    description: '网站的公安备案号（中国大陆网站必填）',
    required: false,
    type: 'text',
    placeholder: '请输入公安备案号'
  }
];

/** 默认基础信息配置 */
export const DEFAULT_BASIC_INFO_CONFIG = {
  title: '',
  subtitle: '',
  description: '',
  logo: '',
  favicon: '',
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  copyright: '',
  icp: '',
  publicSecurity: ''
};

/** 验证规则基础接口 */
interface BaseValidationRule {
  required: boolean;
  message: string;
}

/** 长度验证规则 */
interface LengthValidationRule extends BaseValidationRule {
  minLength?: number;
  maxLength?: number;
}

/** 正则验证规则 */
interface PatternValidationRule extends BaseValidationRule {
  pattern?: RegExp;
}

/** 表单验证规则 */
export const BASIC_INFO_VALIDATION_RULES: Record<string, LengthValidationRule | PatternValidationRule> = {
  title: {
    required: true,
    minLength: 1,
    maxLength: 60,
    message: '网站标题为必填项，长度不能超过60个字符'
  },
  subtitle: {
    required: false,
    maxLength: 100,
    message: '网站副标题长度不能超过100个字符'
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 200,
    message: '网站描述为必填项，长度应在10-200个字符之间'
  },
  logo: {
    required: false,
    pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg)$/i,
    message: 'Logo必须是有效的图片URL'
  },
  favicon: {
    required: false,
    pattern: /^https?:\/\/.+\.(ico|png)$/i,
    message: 'Favicon必须是有效的图标URL'
  },
  language: {
    required: true,
    message: '请选择网站语言'
  },
  timezone: {
    required: true,
    message: '请选择时区设置'
  },
  copyright: {
    required: false,
    maxLength: 100,
    message: '版权信息长度不能超过100个字符'
  },
  icp: {
    required: false,
    pattern: /^[\u4e00-\u9fa5\d\-]+$/,
    message: 'ICP备案号格式不正确'
  },
  publicSecurity: {
    required: false,
    pattern: /^[\u4e00-\u9fa5\d\-]+$/,
    message: '公安备案号格式不正确'
  }
};
