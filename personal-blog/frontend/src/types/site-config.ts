export interface SiteConfig {
  id: number
  key: string
  value: string
  category: 'basic' | 'contact' | 'social' | 'seo' | 'features'
  description: string
  data_type: string
  is_public: string
  sort_order: number
}

export interface TabConfig {
  value: string
  label: string
  category: string
  component: React.ComponentType<any>
}

export interface ConfigUpdateRequest {
  key: string
  value: string
}