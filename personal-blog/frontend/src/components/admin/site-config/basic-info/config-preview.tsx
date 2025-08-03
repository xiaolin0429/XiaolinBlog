import { Image } from 'lucide-react'
import { ConfigItem } from './config-items'

interface ConfigPreviewProps {
  configItem: ConfigItem
  value: string
}

export function ConfigPreview({ configItem, value }: ConfigPreviewProps) {
  const displayValue = value || configItem.placeholder

  return (
    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">预览效果</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {configItem.key === 'site_title' && (
          <div className="font-bold text-lg">{displayValue}</div>
        )}
        
        {configItem.key === 'site_subtitle' && (
          <div className="text-gray-600">{displayValue}</div>
        )}
        
        {configItem.key === 'site_description' && (
          <div className="text-sm leading-relaxed">{displayValue}</div>
        )}
        
        {(configItem.key === 'site_logo' || configItem.key === 'site_favicon') && (
          <div className="flex items-center space-x-2">
            {value ? (
              <img 
                src={value} 
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
            <span>{value || '未设置'}</span>
          </div>
        )}
        
        {configItem.key === 'site_language' && (
          <div>语言: {configItem.options?.find(opt => opt.value === value)?.label || '未设置'}</div>
        )}
        
        {configItem.key === 'site_timezone' && (
          <div>时区: {configItem.options?.find(opt => opt.value === value)?.label || '未设置'}</div>
        )}
        
        {(configItem.key === 'site_copyright' || configItem.key === 'icp_number' || configItem.key === 'police_number') && (
          <div className="text-xs text-gray-500">{displayValue}</div>
        )}
      </div>
    </div>
  )
}