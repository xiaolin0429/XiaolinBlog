'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useBlogConfig } from '@/hooks/use-blog-config';
import { 
  Settings, 
  Palette, 
  Search, 
  Share2, 
  MessageSquare, 
  Mail, 
  Database,
  RefreshCw,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  Phone,
  Image,
  History,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  ConfigCategory, 
  BlogConfig, 
  ConfigGroup, 
  GroupedConfigResponse,
  BatchConfigUpdate,
  ConfigValueUpdate,
  ConfigDataType
} from '@/types/blog-config';

// 分类图标映射
const categoryIcons = {
  [ConfigCategory.SITE_BASIC]: <Settings className="h-4 w-4" />,
  [ConfigCategory.SITE_APPEARANCE]: <Palette className="h-4 w-4" />,
  [ConfigCategory.CONTACT]: <Phone className="h-4 w-4" />,
  [ConfigCategory.SOCIAL]: <Share2 className="h-4 w-4" />,
  [ConfigCategory.SEO]: <Search className="h-4 w-4" />,
  [ConfigCategory.COMMENT]: <MessageSquare className="h-4 w-4" />,
  [ConfigCategory.EMAIL]: <Mail className="h-4 w-4" />,
  [ConfigCategory.SYSTEM]: <Database className="h-4 w-4" />
};

// 分类名称映射
const categoryNames = {
  [ConfigCategory.SITE_BASIC]: '站点基础',
  [ConfigCategory.SITE_APPEARANCE]: '外观主题',
  [ConfigCategory.CONTACT]: '联系方式',
  [ConfigCategory.SOCIAL]: '社交媒体',
  [ConfigCategory.SEO]: 'SEO设置',
  [ConfigCategory.COMMENT]: '评论系统',
  [ConfigCategory.EMAIL]: '邮件通知',
  [ConfigCategory.SYSTEM]: '系统设置'
};

export function BlogConfigManager() {
  const { toast } = useToast();
  const { 
    configs, 
    groups, 
    loading, 
    error, 
    stats,
    fetchConfigs,
    fetchGroups,
    fetchGroupedConfigs,
    batchUpdateConfigs,
    clearConfigCache,
    initDefaultConfigs,
    getConfigHistory
  } = useBlogConfig();

  // 状态
  const [activeCategory, setActiveCategory] = useState<ConfigCategory>(ConfigCategory.SITE_BASIC);
  const [groupedConfigs, setGroupedConfigs] = useState<GroupedConfigResponse[]>([]);
  const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(new Map());
  const [saving, setSaving] = useState(false);
  const [loadingGrouped, setLoadingGrouped] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [configHistory, setConfigHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 加载分组配置
  const loadGroupedConfigs = useCallback(async (category: ConfigCategory) => {
    try {
      setLoadingGrouped(true);
      const data = await fetchGroupedConfigs(category);
      setGroupedConfigs(data);
    } catch (error) {
      toast({
        title: '加载配置失败',
        description: error instanceof Error ? error.message : '无法加载分组配置',
        variant: 'destructive'
      });
    } finally {
      setLoadingGrouped(false);
    }
  }, [fetchGroupedConfigs, toast]);

  // 切换分类
  const handleCategoryChange = useCallback((category: ConfigCategory) => {
    setActiveCategory(category);
    loadGroupedConfigs(category);
    setShowHistory(null); // 关闭历史记录
  }, [loadGroupedConfigs]);

  // 初始化默认配置
  const handleInitDefaults = useCallback(async () => {
    try {
      setInitializing(true);
      const result = await initDefaultConfigs();
      toast({
        title: '初始化成功',
        description: result.message,
      });
      // 重新加载配置
      await fetchConfigs();
      await loadGroupedConfigs(activeCategory);
    } catch (error) {
      toast({
        title: '初始化失败',
        description: error instanceof Error ? error.message : '无法初始化默认配置',
        variant: 'destructive'
      });
    } finally {
      setInitializing(false);
    }
  }, [initDefaultConfigs, fetchConfigs, loadGroupedConfigs, activeCategory, toast]);

  // 清除缓存
  const handleClearCache = useCallback(async () => {
    try {
      setClearingCache(true);
      const result = await clearConfigCache();
      toast({
        title: '缓存已清除',
        description: result.message,
      });
    } catch (error) {
      toast({
        title: '清除缓存失败',
        description: error instanceof Error ? error.message : '无法清除配置缓存',
        variant: 'destructive'
      });
    } finally {
      setClearingCache(false);
    }
  }, [clearConfigCache, toast]);

  // 查看配置历史
  const handleViewHistory = useCallback(async (configKey: string) => {
    try {
      setLoadingHistory(true);
      const history = await getConfigHistory(configKey);
      setConfigHistory(history);
      setShowHistory(configKey);
    } catch (error) {
      toast({
        title: '加载历史失败',
        description: error instanceof Error ? error.message : '无法加载配置历史',
        variant: 'destructive'
      });
    } finally {
      setLoadingHistory(false);
    }
  }, [getConfigHistory, toast]);

  // 处理配置值变更
  const handleConfigChange = useCallback((key: string, value: string) => {
    setPendingChanges(prev => {
      const newChanges = new Map(prev);
      newChanges.set(key, value);
      return newChanges;
    });
  }, []);

  // 保存变更
  const handleSaveChanges = useCallback(async () => {
    if (pendingChanges.size === 0) {
      toast({ title: '没有需要保存的变更' });
      return;
    }

    try {
      setSaving(true);
      const configUpdates: ConfigValueUpdate[] = Array.from(pendingChanges.entries()).map(([config_key, config_value]) => ({
        config_key,
        config_value
      }));

      const batchData: BatchConfigUpdate = {
        configs: configUpdates,
        change_reason: '通过管理界面更新'
      };

      await batchUpdateConfigs(batchData);
      setPendingChanges(new Map());
      
      toast({
        title: '保存成功',
        description: `已更新 ${configUpdates.length} 个配置项`,
      });
      
      // 重新加载当前分类的配置
      await loadGroupedConfigs(activeCategory);
    } catch (error) {
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '无法保存配置变更',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  }, [pendingChanges, batchUpdateConfigs, toast, loadGroupedConfigs, activeCategory]);

  // 取消变更
  const handleCancelChanges = useCallback(() => {
    setPendingChanges(new Map());
    toast({ title: '已取消所有变更' });
  }, [toast]);

  // 获取字段当前值（包括待保存的变更）
  const getFieldValue = useCallback((config: BlogConfig): string => {
    return pendingChanges.has(config.config_key) 
      ? pendingChanges.get(config.config_key)! 
      : config.config_value || '';
  }, [pendingChanges]);

  // 验证配置值
  const validateConfigValue = useCallback((config: BlogConfig, value: string): string | null => {
    if (!config.validation_rules) return null;

    const rules = config.validation_rules;

    // 必填验证
    if (rules.required && !value.trim()) {
      return '此字段为必填项';
    }

    // 长度验证
    if (rules.min_length && value.length < rules.min_length) {
      return `最少需要 ${rules.min_length} 个字符`;
    }
    if (rules.max_length && value.length > rules.max_length) {
      return `最多允许 ${rules.max_length} 个字符`;
    }

    // 格式验证
    if (config.data_type === ConfigDataType.EMAIL && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return '请输入有效的邮箱地址';
      }
    }

    if (config.data_type === ConfigDataType.URL && value) {
      try {
        new URL(value);
      } catch {
        return '请输入有效的URL地址';
      }
    }

    if (config.data_type === ConfigDataType.COLOR && value) {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!colorRegex.test(value)) {
        return '请输入有效的颜色值（如 #FF0000）';
      }
    }

    // 正则表达式验证
    if (rules.pattern && value) {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(value)) {
        return '输入格式不正确';
      }
    }

    return null;
  }, []);

  // 渲染输入控件
  const renderInputControl = useCallback((config: BlogConfig) => {
    const value = getFieldValue(config);
    const hasChanges = pendingChanges.has(config.config_key);
    const validationError = validateConfigValue(config, value);

    const commonProps = {
      id: config.config_key,
      className: `${hasChanges ? 'border-blue-300' : ''} ${validationError ? 'border-red-300' : ''}`,
    };

    switch (config.data_type) {
      case ConfigDataType.TEXT:
        return (
          <Textarea
            {...commonProps}
            value={value}
            onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
            placeholder={config.placeholder || ''}
            rows={3}
          />
        );

      case ConfigDataType.BOOLEAN:
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={config.config_key}
              checked={value === 'true'}
              onCheckedChange={(checked) => 
                handleConfigChange(config.config_key, checked ? 'true' : 'false')
              }
            />
            <Label htmlFor={config.config_key}>
              {value === 'true' ? '启用' : '禁用'}
            </Label>
          </div>
        );

      case ConfigDataType.SELECT:
        if (!config.options) return null;
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleConfigChange(config.config_key, newValue)}
          >
            <SelectTrigger className={commonProps.className}>
              <SelectValue placeholder={config.placeholder || '请选择'} />
            </SelectTrigger>
            <SelectContent>
              {config.options.map((option, index) => (
                <SelectItem key={index} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case ConfigDataType.COLOR:
        return (
          <div className="flex space-x-2">
            <Input
              {...commonProps}
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
              className="w-16 h-10 p-1"
            />
            <Input
              {...commonProps}
              type="text"
              value={value}
              onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
              placeholder={config.placeholder || '#000000'}
              className="flex-1"
            />
          </div>
        );

      case ConfigDataType.IMAGE:
        return (
          <div className="space-y-2">
            <Input
              {...commonProps}
              type="text"
              value={value}
              onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
              placeholder={config.placeholder || '图片URL或从图库选择'}
            />
            {value && (
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <Image className="h-4 w-4" />
                <span className="text-sm text-gray-600">当前图片: {value}</span>
              </div>
            )}
          </div>
        );

      case ConfigDataType.NUMBER:
        return (
          <Input
            {...commonProps}
            type="number"
            value={value}
            onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
            placeholder={config.placeholder || ''}
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            type={config.data_type === ConfigDataType.EMAIL ? 'email' : 'text'}
            value={value}
            onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
            placeholder={config.placeholder || ''}
          />
        );
    }
  }, [getFieldValue, pendingChanges, handleConfigChange, validateConfigValue]);

  // 初始加载
  useEffect(() => {
    loadGroupedConfigs(activeCategory);
  }, [activeCategory, loadGroupedConfigs]);

  // 渲染加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">加载配置中...</p>
        </div>
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>加载失败</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计信息卡片 */}
      {stats && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">配置概览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">配置项总数</p>
                <p className="text-2xl font-bold">{stats.total_configs}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">分组数量</p>
                <p className="text-2xl font-bold">{stats.groups_count}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">公开配置</p>
                <p className="text-2xl font-bold">{stats.public_configs}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">最后更新</p>
                <p className="text-sm">
                  {stats.last_updated 
                    ? new Date(stats.last_updated).toLocaleString('zh-CN') 
                    : '暂无更新'}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearCache}
              disabled={clearingCache}
            >
              {clearingCache ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  清除中...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  清除缓存
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleInitDefaults}
              disabled={initializing}
            >
              {initializing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  初始化中...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  初始化默认配置
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* 分类选项卡 */}
      <Tabs 
        value={activeCategory} 
        onValueChange={(value) => handleCategoryChange(value as ConfigCategory)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 md:grid-cols-8 w-full">
          {Object.values(ConfigCategory).map((category) => (
            <TabsTrigger key={category} value={category} className="flex items-center space-x-2">
              {categoryIcons[category]}
              <span className="hidden md:inline">{categoryNames[category]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 分类内容 */}
        {Object.values(ConfigCategory).map((category) => (
          <TabsContent key={category} value={category} className="space-y-6">
            {/* 分组配置 */}
            {loadingGrouped ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : groupedConfigs.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>暂无配置</AlertTitle>
                <AlertDescription>
                  当前分类下没有配置项，您可以点击"初始化默认配置"按钮创建默认配置。
                </AlertDescription>
              </Alert>
            ) : (
              groupedConfigs.map((groupData) => (
                <Card key={groupData.group.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <CardTitle className="text-lg flex items-center">
                      {groupData.group.icon_name && (
                        <span className="mr-2">{groupData.group.icon_name}</span>
                      )}
                      {groupData.group.group_name}
                    </CardTitle>
                    {groupData.group.description && (
                      <CardDescription>{groupData.group.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {groupData.configs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">此分组下暂无配置项</p>
                    ) : (
                      groupData.configs.map((config) => {
                        const hasChanges = pendingChanges.has(config.config_key);
                        const validationError = validateConfigValue(config, getFieldValue(config));
                        
                        return (
                          <div key={config.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label 
                                htmlFor={config.config_key} 
                                className={hasChanges ? 'text-blue-600' : ''}
                              >
                                {config.display_name}
                                {config.is_required && <span className="text-red-500 ml-1">*</span>}
                                {hasChanges && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-blue-50">已修改</Badge>
                                )}
                              </Label>
                              <div className="flex items-center space-x-2">
                                {!config.is_public && (
                                  <Badge variant="outline" className="text-xs">
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    私有
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewHistory(config.config_key)}
                                  disabled={loadingHistory}
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* 渲染输入控件 */}
                            {renderInputControl(config)}
                            
                            {/* 验证错误信息 */}
                            {validationError && (
                              <p className="text-xs text-red-500">{validationError}</p>
                            )}
                            
                            {/* 帮助文本 */}
                            {config.help_text && (
                              <p className="text-xs text-muted-foreground">{config.help_text}</p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* 配置历史弹窗 */}
      {showHistory && (
        <Card className="fixed inset-4 z-50 bg-white shadow-lg overflow-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>配置历史: {showHistory}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : configHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无历史记录</p>
            ) : (
              <div className="space-y-4">
                {configHistory.map((record) => (
                  <div key={record.id} className="border-l-2 border-blue-200 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {new Date(record.changed_at).toLocaleString('zh-CN')}
                      </span>
                      {record.change_reason && (
                        <Badge variant="outline" className="text-xs">
                          {record.change_reason}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-red-600">旧值:</span> {record.old_value || '(空)'}
                      </div>
                      <div>
                        <span className="text-green-600">新值:</span> {record.new_value || '(空)'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 保存操作栏 */}
      {pendingChanges.size > 0 && (
        <Card className="sticky bottom-4 border-blue-200 bg-blue-50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-600">
                有 {pendingChanges.size} 个配置项待保存
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelChanges}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-1" />
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      保存变更
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}