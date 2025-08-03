/**
 * 社交媒体配置常量定义
 */

import { 
  Facebook, Twitter, Instagram, Linkedin, Github, Youtube, 
  MessageCircle, Globe
} from 'lucide-react'
import { SocialPlatform } from './types'

/** 社交媒体平台配置 */
export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'github',
    label: 'GitHub',
    icon: Github,
    color: 'text-gray-800',
    gradient: 'from-gray-700 to-gray-800',
    urlKey: 'social_github',
    placeholder: 'https://github.com/your-username',
    description: '您的GitHub个人资料链接',
    urlPattern: /^https?:\/\/(www\.)?github\.com\/.+/
  },
  {
    id: 'twitter',
    label: 'Twitter/X',
    icon: Twitter,
    color: 'text-sky-600',
    gradient: 'from-sky-500 to-sky-600',
    urlKey: 'social_twitter',
    placeholder: 'https://twitter.com/your-username',
    description: '您的Twitter/X账号链接',
    urlPattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: Linkedin,
    color: 'text-blue-700',
    gradient: 'from-blue-600 to-blue-700',
    urlKey: 'social_linkedin',
    placeholder: 'https://linkedin.com/in/your-profile',
    description: '您的LinkedIn个人资料链接',
    urlPattern: /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/.+/
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: Instagram,
    color: 'text-pink-600',
    gradient: 'from-pink-500 to-pink-600',
    urlKey: 'social_instagram',
    placeholder: 'https://instagram.com/your-username',
    description: '您的Instagram账号链接',
    urlPattern: /^https?:\/\/(www\.)?instagram\.com\/.+/
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600',
    urlKey: 'social_facebook',
    placeholder: 'https://facebook.com/your-profile',
    description: '您的Facebook个人资料或页面链接',
    urlPattern: /^https?:\/\/(www\.)?facebook\.com\/.+/
  },
  {
    id: 'youtube',
    label: 'YouTube',
    icon: Youtube,
    color: 'text-red-600',
    gradient: 'from-red-500 to-red-600',
    urlKey: 'social_youtube',
    placeholder: 'https://youtube.com/@your-channel',
    description: '您的YouTube频道链接',
    urlPattern: /^https?:\/\/(www\.)?youtube\.com\/.+/
  },
  {
    id: 'wechat',
    label: '微信',
    icon: MessageCircle,
    color: 'text-green-600',
    gradient: 'from-green-500 to-green-600',
    urlKey: 'social_wechat',
    placeholder: '您的微信号或二维码链接',
    description: '微信号或微信二维码图片链接'
  },
  {
    id: 'weibo',
    label: '微博',
    icon: Globe,
    color: 'text-red-500',
    gradient: 'from-red-400 to-red-500',
    urlKey: 'social_weibo',
    placeholder: 'https://weibo.com/your-username',
    description: '您的微博账号链接',
    urlPattern: /^https?:\/\/(www\.)?weibo\.com\/.+/
  }
]

/** 默认社交媒体配置 */
export const DEFAULT_SOCIAL_CONFIG = {
  github: '',
  twitter: '',
  linkedin: '',
  instagram: '',
  facebook: '',
  youtube: '',
  wechat: '',
  weibo: ''
}

/** URL验证规则 */
export const URL_VALIDATION_RULES = {
  github: {
    pattern: /^https?:\/\/(www\.)?github\.com\/.+/,
    message: '请输入有效的GitHub链接格式'
  },
  twitter: {
    pattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/,
    message: '请输入有效的Twitter/X链接格式'
  },
  linkedin: {
    pattern: /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/.+/,
    message: '请输入有效的LinkedIn链接格式'
  },
  instagram: {
    pattern: /^https?:\/\/(www\.)?instagram\.com\/.+/,
    message: '请输入有效的Instagram链接格式'
  },
  facebook: {
    pattern: /^https?:\/\/(www\.)?facebook\.com\/.+/,
    message: '请输入有效的Facebook链接格式'
  },
  youtube: {
    pattern: /^https?:\/\/(www\.)?youtube\.com\/.+/,
    message: '请输入有效的YouTube链接格式'
  },
  weibo: {
    pattern: /^https?:\/\/(www\.)?weibo\.com\/.+/,
    message: '请输入有效的微博链接格式'
  }
}