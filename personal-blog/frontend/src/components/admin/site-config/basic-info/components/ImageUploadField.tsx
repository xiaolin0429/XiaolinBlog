/**
 * 图片上传组件
 * 用于网站Logo和Favicon的上传
 */

import React, { useState, useRef } from 'react'
import { Upload, X, Image, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConfigItem } from '../config-items'

interface ImageUploadFieldProps {
  config: ConfigItem
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

interface ImageInfo {
  filename: string
  content_type: string
  size: number
  data: string
  upload_time: string
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  config,
  value,
  onChange,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 解析当前值（如果是JSON格式的图片数据）
  React.useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value)
        if (parsed.data && parsed.filename) {
          setImageInfo(parsed)
          // 创建预览URL
          const blob = new Blob([Uint8Array.from(atob(parsed.data), c => c.charCodeAt(0))], {
            type: parsed.content_type
          })
          const url = URL.createObjectURL(blob)
          setPreviewUrl(url)
        }
      } catch (e) {
        // 如果不是JSON格式，可能是旧的URL格式
        if (value.startsWith('http')) {
          setPreviewUrl(value)
        }
      }
    }
  }, [value])

  // 清理预览URL
  React.useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const validateFile = (file: File): string | null => {
    // 检查文件类型
    if (config.accept && !config.accept.split(',').some(type => 
      file.type === type.trim() || file.name.toLowerCase().endsWith(type.trim().replace('image/', '.'))
    )) {
      return `不支持的文件类型。支持的格式: ${config.accept}`
    }

    // 检查文件大小
    if (config.maxSize && file.size > config.maxSize) {
      const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1)
      return `文件大小超过限制。最大允许: ${maxSizeMB}MB`
    }

    return null
  }

  const handleFileSelect = async (file: File) => {
    setError(null)
    setSuccess(null)

    // 验证文件
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)

    try {
      // 创建FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('config_key', config.key)

      // 上传文件
      const response = await fetch('/api/v1/image/upload-site-image', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || '上传失败')
      }

      if (result.success) {
        setSuccess(result.message)
        
        // 获取上传后的图片信息
        const imageResponse = await fetch(`/api/v1/image/site-image/${config.key}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        })
        
        const imageResult = await imageResponse.json()
        if (imageResult.success && imageResult.data) {
          setImageInfo(imageResult.data)
          
          // 获取图片数据用于预览
          const imageDataResponse = await fetch(`/api/v1/image/site-image-data/${config.key}`)
          if (imageDataResponse.ok) {
            const blob = await imageDataResponse.blob()
            const url = URL.createObjectURL(blob)
            setPreviewUrl(url)
          }
          
          // 通知父组件值已更新 - 传递图片的访问URL而不是'updated'字符串
          const imageUrl = `/api/v1/image/site-image-data/${config.key}`
          onChange(imageUrl)
        } else {
          // 如果没有获取到图片信息，传递空字符串
          onChange('')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleRemove = async () => {
    setError(null)
    setSuccess(null)
    setUploading(true)

    try {
      const response = await fetch(`/api/v1/image/site-image/${config.key}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || '删除失败')
      }

      if (result.success) {
        setSuccess(result.message)
        setImageInfo(null)
        if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl)
        }
        setPreviewUrl(null)
        onChange('') // 清空值
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <Card className="p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            disabled 
              ? 'border-gray-200 bg-gray-50' 
              : 'border-gray-300 hover:border-gray-400 cursor-pointer'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={config.accept}
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />

          {uploading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600">上传中...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{config.placeholder}</p>
                <p className="text-xs text-gray-500 mt-1">
                  支持拖拽上传或点击选择文件
                </p>
                {config.maxSize && (
                  <p className="text-xs text-gray-400 mt-1">
                    最大文件大小: {formatFileSize(config.maxSize)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 当前图片预览 */}
      {imageInfo && previewUrl && (
        <Card className="p-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <img
                src={previewUrl}
                alt={imageInfo.filename}
                className="w-16 h-16 object-contain border rounded"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {imageInfo.filename}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(imageInfo.size)} • {imageInfo.content_type}
              </p>
              {imageInfo.upload_time && (
                <p className="text-xs text-gray-400">
                  上传时间: {new Date(imageInfo.upload_time).toLocaleString()}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 成功提示 */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}