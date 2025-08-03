'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  Type, Globe, FileText, Image, Palette, Languages, 
  Clock, Copyright, Shield, Building, AlertCircle, Save, Loader2, Settings 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SiteConfigValidator, ValidationResult } from '@/lib/validation/site-config'

interface SiteConfig {
  id: number
  key: string
  value: string
  category: string
  description: string
  data_type: string
  is_public: string
  sort_order: number
}

interface ConfigInputPanelsProps {
  activeItem: string | null
  configs: SiteConfig[]
  onUpdate: (key: string, value: string) => void
}

interface ConfigItem {
  key: string
  label: string
  description: string
  icon: React.ComponentType<any>
  type: 'text' | 'textarea' | 'select' | 'url'
  placeholder: string
  options?: { value: string; label: string }[]
  gradient: string
}

const configItems: ConfigItem[] = [
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

export function ConfigInputPanels({ activeItem, configs, onUpdate }: ConfigInputPanelsProps) {
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string[] }>({})
  const [localValues, setLocalValues] = useState<{ [key: string]: string }>({})
  const [isSaving, setIsSaving] = useState<{ [key: string]: boolean }>({})
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({})

  const getConfigValue = (key: string) => {
    if (localValues[key] !== undefined) {
      return localValues[key]
    }
    const config = configs.find(c => c.key === key)
    return config?.value || ''
  }

  // 验证单个配置项
  const validateField = (key: string, value: string): ValidationResult => {
    switch (key) {
      case 'site_title':
        return SiteConfigValidator.validateSiteTitle(value)
      case 'site_description':
        return SiteConfigValidator.validateSiteDescription(value)
      case 'site_logo':
      case 'site_favicon':
        return value ? SiteConfigValidator.validateUrl(value) : { isValid: true, errors: [] }
      default:
        return { isValid: true, errors: [] }
    }
  }

  // 防抖更新函数
  const debouncedUpdate = useCallback((key: string, value: string) => {
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key])
    }

    debounceTimers.current[key] = setTimeout(() => {
      onUpdate(key, value)
      delete debounceTimers.current[key]
    }, 500)
  }, [onUpdate])

  // 处理输入变化
  const handleInputChange = (key: string, value: string) => {
    setLocalValues(prev => ({
      ...prev,
      [key]: value
    }))
    
    const validation = validateField(key, value)
    setValidationErrors(prev => ({
      ...prev,
      [key]: validation.errors
    }))

    debouncedUpdate(key, value)
  }

  // 处理选择框变化
  const handleSelectChange = (key: string, value: string) => {
    setLocalValues(prev => ({
      ...prev,
      [key]: value
    }))
    onUpdate(key, value)
  }

  // 初始化本地值
  useEffect(() => {
    if (configs.length > 0) {
      const initialValues: { [key: string]: string } = {}
      configs.forEach(config => {
        initialValues[config.key] = config.value
      })
      setLocalValues(initialValues)
    }
  }, [configs.length])

  // 清理定时器
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => {
        if (timer) clearTimeout(timer)
      })
    }
  }, [])

  // 获取当前活动的配置项
  const activeConfig = configItems.find(item => item.key === activeItem)

  if (!activeItem || !activeConfig) {
    return (
      <motion.div
        className="flex items-center justify-center h-40 text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <Settings className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>请选择一个配置项进行编辑</p>
        </div>
      </motion.div>
    )
  }

  const IconComponent = activeConfig.icon
  const hasError = validationErrors[activeConfig.key] && validationErrors[activeConfig.key].length > 0
  const isCurrentlySaving = isSaving[activeConfig.key] || false

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeItem}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`border-l-4 border-l-gradient-to-b ${activeConfig.gradient} shadow-lg`}>
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${activeConfig.gradient} flex items-center justify-center shadow-md`}>
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">{activeConfig.label}</CardTitle>
                <CardDescription className="text-sm mt-1">
                  {activeConfig.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={activeConfig.key} className="text-sm font-medium">
                {activeConfig.label}
              </Label>
              
              {activeConfig.type === 'textarea' ? (
                <Textarea
                  id={activeConfig.key}
                  value={getConfigValue(activeConfig.key)}
                  onChange={(e) => handleInputChange(activeConfig.key, e.target.value)}
                  placeholder={activeConfig.placeholder}
                  className={`min-h-[100px] resize-none ${hasError ? 'border-red-300 focus:border-red-500' : ''}`}
                />
              ) : activeConfig.type === 'select' ? (
                <Select
                  value={getConfigValue(activeConfig.key)}
                  onValueChange={(value) => handleSelectChange(activeConfig.key, value)}
                >
                  <SelectTrigger className={hasError ? 'border-red-300 focus:border-red-500' : ''}>
                    <SelectValue placeholder={activeConfig.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeConfig.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={activeConfig.key}
                  type={activeConfig.type === 'url' ? 'url' : 'text'}
                  value={getConfigValue(activeConfig.key)}
                  onChange={(e) => handleInputChange(activeConfig.key, e.target.value)}
                  placeholder={activeConfig.placeholder}
                  className={hasError ? 'border-red-300 focus:border-red-500' : ''}
                />
              )}
            </div>

            {/* 显示验证错误 */}
            {hasError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors[activeConfig.key].map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* 配置项预览 */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">预览效果</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {activeConfig.key === 'site_title' && (
                  <div className="font-bold text-lg">{getConfigValue(activeConfig.key) || activeConfig.placeholder}</div>
                )}
                {activeConfig.key === 'site_subtitle' && (
                  <div className="text-gray-600">{getConfigValue(activeConfig.key) || activeConfig.placeholder}</div>
                )}
                {activeConfig.key === 'site_description' && (
                  <div className="text-sm leading-relaxed">{getConfigValue(activeConfig.key) || activeConfig.placeholder}</div>
                )}
                {(activeConfig.key === 'site_logo' || activeConfig.key === 'site_favicon') && (
                  <div className="flex items-center space-x-2">
                    {getConfigValue(activeConfig.key) ? (
                      <img 
                        src={getConfigValue(activeConfig.key)} 
                        alt="预览" 
                        className="w-8 h-8 object-contain rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                        <Image className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <span>{getConfigValue(activeConfig.key) || '未设置'}</span>
                  </div>
                )}
                {activeConfig.key === 'site_language' && (
                  <div>语言: {activeConfig.options?.find(opt => opt.value === getConfigValue(activeConfig.key))?.label || '未设置'}</div>
                )}
                {activeConfig.key === 'site_timezone' && (
                  <div>时区: {activeConfig.options?.find(opt => opt.value === getConfigValue(activeConfig.key))?.label || '未设置'}</div>
                )}
                {(activeConfig.key === 'site_copyright' || activeConfig.key === 'icp_number' || activeConfig.key === 'police_number') && (
                  <div className="text-xs text-gray-500">{getConfigValue(activeConfig.key) || activeConfig.placeholder}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}