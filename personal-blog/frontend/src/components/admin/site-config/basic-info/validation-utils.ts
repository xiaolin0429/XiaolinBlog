export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export class ConfigValidator {
  static validateSiteTitle(value: string): ValidationResult {
    const errors: string[] = []
    
    if (!value || value.trim().length === 0) {
      errors.push('网站标题不能为空')
    } else if (value.length > 60) {
      errors.push('网站标题长度不能超过60个字符')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateSiteDescription(value: string): ValidationResult {
    const errors: string[] = []
    
    if (!value || value.trim().length === 0) {
      errors.push('网站描述不能为空')
    } else if (value.length < 10) {
      errors.push('网站描述至少需要10个字符')
    } else if (value.length > 500) {
      errors.push('网站描述长度不能超过500个字符')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateUrl(value: string): ValidationResult {
    const errors: string[] = []
    
    if (value && value.trim().length > 0) {
      try {
        // 如果是API端点URL，直接认为有效
        if (value.startsWith('/api/v1/image/')) {
          return { isValid: true, errors: [] }
        }
        
        new URL(value)
        // 检查是否是有效的图片URL
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico']
        const hasValidExtension = imageExtensions.some(ext => 
          value.toLowerCase().includes(ext)
        )
        
        if (!hasValidExtension) {
          errors.push('请提供有效的图片URL（支持 jpg, png, gif, svg, webp, ico 格式）')
        }
      } catch {
        errors.push('请提供有效的URL地址')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateRequired(value: string, fieldName: string): ValidationResult {
    const errors: string[] = []
    
    if (!value || value.trim().length === 0) {
      errors.push(`${fieldName}不能为空`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateMaxLength(value: string, maxLength: number, fieldName: string): ValidationResult {
    const errors: string[] = []
    
    if (value && value.length > maxLength) {
      errors.push(`${fieldName}长度不能超过${maxLength}个字符`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}