import { TabConfig } from '@/types/site-config'
import { BasicInfoConfigPage } from '@/components/admin/site-config/basic-info-config'
import { SocialConfig } from '@/components/admin/site-config/social-config'
import { SeoConfig } from '@/components/admin/site-config/seo-config'
import { OtherConfig } from '@/components/admin/site-config/other-config'

export const tabConfigs: TabConfig[] = [
  {
    value: 'basic',
    label: '基础信息',
    category: 'basic',
    component: BasicInfoConfigPage
  },
  {
    value: 'social',
    label: '社交媒体',
    category: 'social',
    component: SocialConfig
  },
  {
    value: 'seo',
    label: 'SEO设置',
    category: 'seo',
    component: SeoConfig
  },
  {
    value: 'other',
    label: '其他配置',
    category: 'features',
    component: OtherConfig
  }
]