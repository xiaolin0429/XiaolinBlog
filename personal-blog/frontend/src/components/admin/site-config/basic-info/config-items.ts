import { 
  Type, Globe, FileText, Image, Palette, Languages, 
  Clock, Copyright, Shield, Building 
} from 'lucide-react'

export interface ConfigItem {
  key: string
  label: string
  description: string
  icon: React.ComponentType<any>
  type: 'text' | 'textarea' | 'select' | 'url'
  placeholder: string
  options?: { value: string; label: string }[]
  gradient: string
}

export const configItems: ConfigItem[] = [
  {
    key: 'site_title',
    label: '网站标题',
    description: '网站的主标题，显示在浏览器标签页和搜索结果中',
    icon: Type,
    type: 'text',
    placeholder: '我的个人博客',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    key: 'site_subtitle',
    label: '网站副标题',
    description: '网站的副标题或标语，通常显示在主标题下方',
    icon: Globe,
    type: 'text',
    placeholder: '分享技术与生活',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    key: 'site_description',
    label: '网站描述',
    description: '网站的详细描述，用于SEO和搜索引擎优化',
    icon: FileText,
    type: 'textarea',
    placeholder: '这是一个专注于技术分享的个人博客...',
    gradient: 'from-green-500 to-green-600'
  },
  {
    key: 'site_logo',
    label: '网站Logo',
    description: '网站的Logo图片URL，建议使用PNG格式',
    icon: Image,
    type: 'url',
    placeholder: 'https://example.com/logo.png',
    gradient: 'from-pink-500 to-pink-600'
  },
  {
    key: 'site_favicon',
    label: '网站图标',
    description: '网站的Favicon图标URL，显示在浏览器标签页',
    icon: Palette,
    type: 'url',
    placeholder: 'https://example.com/favicon.ico',
    gradient: 'from-orange-500 to-orange-600'
  },
  {
    key: 'site_language',
    label: '网站语言',
    description: '网站的主要语言设置',
    icon: Languages,
    type: 'select',
    placeholder: '选择语言',
    options: [
      { value: 'zh-CN', label: '简体中文' },
      { value: 'zh-TW', label: '繁体中文' },
      { value: 'en-US', label: 'English' },
      { value: 'ja-JP', label: '日本語' },
      { value: 'ko-KR', label: '한국어' }
    ],
    gradient: 'from-cyan-500 to-cyan-600'
  },
  {
    key: 'site_timezone',
    label: '时区设置',
    description: '网站的时区设置，影响时间显示',
    icon: Clock,
    type: 'select',
    placeholder: '选择时区',
    options: [
      { value: 'Asia/Shanghai', label: '北京时间 (UTC+8)' },
      { value: 'Asia/Tokyo', label: '东京时间 (UTC+9)' },
      { value: 'America/New_York', label: '纽约时间 (UTC-5)' },
      { value: 'Europe/London', label: '伦敦时间 (UTC+0)' },
      { value: 'UTC', label: '协调世界时 (UTC)' }
    ],
    gradient: 'from-indigo-500 to-indigo-600'
  },
  {
    key: 'site_copyright',
    label: '版权信息',
    description: '网站的版权声明，通常显示在页脚',
    icon: Copyright,
    type: 'text',
    placeholder: '© 2024 我的博客. All rights reserved.',
    gradient: 'from-red-500 to-red-600'
  },
  {
    key: 'icp_number',
    label: 'ICP备案号',
    description: '网站的ICP备案号（中国大陆网站必填）',
    icon: Shield,
    type: 'text',
    placeholder: '京ICP备12345678号',
    gradient: 'from-teal-500 to-teal-600'
  },
  {
    key: 'police_number',
    label: '公安备案号',
    description: '网站的公安备案号（中国大陆网站必填）',
    icon: Building,
    type: 'text',
    placeholder: '京公网安备11010802012345号',
    gradient: 'from-amber-500 to-amber-600'
  }
]