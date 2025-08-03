import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfigItem } from './config-items'
import { ConfigInputForm } from './config-input-form'
import { ConfigPreview } from './config-preview'

interface ConfigCardProps {
  configItem: ConfigItem
  value: string
  onChange: (value: string) => void
  errors?: string[]
}

export function ConfigCard({ configItem, value, onChange, errors }: ConfigCardProps) {
  const IconComponent = configItem.icon

  return (
    <Card className={`border-l-4 border-l-gradient-to-b ${configItem.gradient} shadow-lg`}>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${configItem.gradient} flex items-center justify-center shadow-md`}>
            <IconComponent className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">{configItem.label}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {configItem.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ConfigInputForm
          configItem={configItem}
          value={value}
          onChange={onChange}
          errors={errors}
        />

        <ConfigPreview
          configItem={configItem}
          value={value}
        />
      </CardContent>
    </Card>
  )
}