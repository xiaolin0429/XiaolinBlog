import { 
  Type, Globe, FileText, Image, Palette, Languages, 
  Clock, Copyright, Shield, Building 
} from 'lucide-react'

export interface ConfigItem {
  key: string
  label: string
  description: string
  icon: React.ComponentType<any>
  type: 'text' | 'textarea' | 'select' | 'url' | 'file'
  placeholder: string
  options?: { value: string; label: string }[]
  gradient: string
  accept?: string // 用于文件上传的文件类型限制
  maxSize?: number // 用于文件上传的大小限制（字节）
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
    key: 'site_keywords',
    label: '网站关键词',
    description: '网站的关键词，用于SEO优化，多个关键词用逗号分隔',
    icon: FileText,
    type: 'text',
    placeholder: '博客,技术,编程,分享',
    gradient: 'from-emerald-500 to-emerald-600'
  },
  {
    key: 'site_logo',
    label: '网站Logo',
    description: '上传网站Logo图片，支持PNG、JPG、GIF格式，建议尺寸200x60像素',
    icon: Image,
    type: 'file',
    placeholder: '点击上传Logo图片',
    accept: 'image/png,image/jpeg,image/jpg,image/gif',
    maxSize: 2 * 1024 * 1024, // 2MB
    gradient: 'from-pink-500 to-pink-600'
  },
  {
    key: 'site_favicon',
    label: '网站图标',
    description: '上传网站Favicon图标，支持ICO、PNG格式，建议尺寸32x32像素',
    icon: Palette,
    type: 'file',
    placeholder: '点击上传Favicon图标',
    accept: 'image/x-icon,image/vnd.microsoft.icon,image/png',
    maxSize: 1 * 1024 * 1024, // 1MB
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
    key: 'site_icp',
    label: 'ICP备案号',
    description: '网站的ICP备案号（中国大陆网站必填）',
    icon: Shield,
    type: 'text',
    placeholder: '京ICP备12345678号',
    gradient: 'from-teal-500 to-teal-600'
  },
  {
    key: 'site_public_security',
    label: '公安备案号',
    description: '网站的公安备案号（中国大陆网站必填）',
    icon: Building,
    type: 'text',
    placeholder: '京公网安备11010802012345号',
    gradient: 'from-amber-500 to-amber-600'
  }
]