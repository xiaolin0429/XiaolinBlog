/**
 * 基础信息配置Hook
 */

import { useState, useCallback } from 'react';
import { BasicInfoConfig, BasicInfoValidationResult } from '../types';
import { DEFAULT_BASIC_INFO_CONFIG, BASIC_INFO_VALIDATION_RULES } from '../constants';

export interface UseBasicInfoConfigProps {
  /** 初始配置数据 */
  initialConfig?: Partial<BasicInfoConfig>;
  /** 配置更新回调 */
  onConfigChange?: (config: BasicInfoConfig) => void;
}

export interface UseBasicInfoConfigReturn {
  /** 当前配置 */
  config: BasicInfoConfig;
  /** 更新配置 */
  updateConfig: (updates: Partial<BasicInfoConfig>) => void;
  /** 重置配置 */
  resetConfig: () => void;
  /** 验证配置 */
  validateConfig: () => BasicInfoValidationResult;
  /** 是否有未保存的更改 */
  hasUnsavedChanges: boolean;
  /** 标记为已保存 */
  markAsSaved: () => void;
}

/**
 * 基础信息配置Hook
 */
export function useBasicInfoConfig({
  initialConfig = {},
  onConfigChange
}: UseBasicInfoConfigProps = {}): UseBasicInfoConfigReturn {
  // 合并默认配置和初始配置
  const [config, setConfig] = useState<BasicInfoConfig>({
    ...DEFAULT_BASIC_INFO_CONFIG,
    ...initialConfig
  });

  // 跟踪是否有未保存的更改
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  /**
   * 更新配置
   */
  const updateConfig = useCallback((updates: Partial<BasicInfoConfig>) => {
    setConfig(prevConfig => {
      const newConfig = { ...prevConfig, ...updates };
      
      // 触发配置更改回调
      onConfigChange?.(newConfig);
      
      return newConfig;
    });
    
    setHasUnsavedChanges(true);
  }, [onConfigChange]);

  /**
   * 重置配置
   */
  const resetConfig = useCallback(() => {
    const resetConfig = {
      ...DEFAULT_BASIC_INFO_CONFIG,
      ...initialConfig
    };
    
    setConfig(resetConfig);
    setHasUnsavedChanges(false);
    
    // 触发配置更改回调
    onConfigChange?.(resetConfig);
  }, [initialConfig, onConfigChange]);

  /**
   * 验证单个字段
   */
  const validateField = useCallback((field: keyof BasicInfoConfig, value: string): string => {
    const rule = BASIC_INFO_VALIDATION_RULES[field];
    if (!rule) return '';

    // 必填验证
    if (rule.required && (!value || value.trim() === '')) {
      return rule.message;
    }

    // 长度验证
    if ('minLength' in rule && rule.minLength && value.length < rule.minLength) {
      return rule.message;
    }

    if ('maxLength' in rule && rule.maxLength && value.length > rule.maxLength) {
      return rule.message;
    }

    // 正则验证
    if ('pattern' in rule && rule.pattern && value && !rule.pattern.test(value)) {
      return rule.message;
    }

    return '';
  }, []);

  /**
   * 验证整个配置
   */
  const validateConfig = useCallback((): BasicInfoValidationResult => {
    const errors: Record<string, string> = {};

    // 验证所有字段
    Object.keys(BASIC_INFO_VALIDATION_RULES).forEach(field => {
      const fieldKey = field as keyof BasicInfoConfig;
      const value = config[fieldKey] || '';
      const error = validateField(fieldKey, value);
      
      if (error) {
        errors[field] = error;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, [config, validateField]);

  /**
   * 标记为已保存
   */
  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  return {
    config,
    updateConfig,
    resetConfig,
    validateConfig,
    hasUnsavedChanges,
    markAsSaved
  };
}

/**
 * 获取配置字段的显示值
 */
export function getConfigDisplayValue(
  config: BasicInfoConfig,
  field: keyof BasicInfoConfig
): string {
  const value = config[field];
  
  if (!value) return '';
  
  // 特殊字段的显示处理
  switch (field) {
    case 'language':
      const languageMap: Record<string, string> = {
        'zh-CN': '简体中文',
        'zh-TW': '繁体中文',
        'en-US': 'English',
        'ja-JP': '日本語',
        'ko-KR': '한국어'
      };
      return languageMap[value] || value;
      
    case 'timezone':
      const timezoneMap: Record<string, string> = {
        'Asia/Shanghai': '北京时间 (UTC+8)',
        'Asia/Tokyo': '东京时间 (UTC+9)',
        'Asia/Seoul': '首尔时间 (UTC+9)',
        'America/New_York': '纽约时间 (UTC-5)',
        'America/Los_Angeles': '洛杉矶时间 (UTC-8)',
        'Europe/London': '伦敦时间 (UTC+0)'
      };
      return timezoneMap[value] || value;
      
    default:
      return value;
  }
}