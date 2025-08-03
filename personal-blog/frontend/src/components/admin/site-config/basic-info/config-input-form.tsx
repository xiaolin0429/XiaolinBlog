import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { ConfigItem } from './config-items'

interface ConfigInputFormProps {
  configItem: ConfigItem
  value: string
  onChange: (value: string) => void
  errors?: string[]
}

export function ConfigInputForm({ configItem, value, onChange, errors }: ConfigInputFormProps) {
  const hasError = errors && errors.length > 0

  return (
    <div className="space-y-2">
      <Label htmlFor={configItem.key} className="text-sm font-medium">
        {configItem.label}
      </Label>
      
      {configItem.type === 'textarea' ? (
        <Textarea
          id={configItem.key}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={configItem.placeholder}
          className={`min-h-[100px] resize-none ${hasError ? 'border-red-300 focus:border-red-500' : ''}`}
        />
      ) : configItem.type === 'select' ? (
        <Select
          value={value}
          onValueChange={onChange}
        >
          <SelectTrigger className={hasError ? 'border-red-300 focus:border-red-500' : ''}>
            <SelectValue placeholder={configItem.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {configItem.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={configItem.key}
          type={configItem.type === 'url' ? 'url' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={configItem.placeholder}
          className={hasError ? 'border-red-300 focus:border-red-500' : ''}
        />
      )}

      {/* 显示验证错误 */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}