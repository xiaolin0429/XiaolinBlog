'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { blogConfigImageAPI } from '@/lib/api/blog-config-image';
import { 
  Image, 
  Upload, 
  X, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Eye,
  Trash2
} from 'lucide-react';
import { BlogConfig, ImageConfigInfo } from '@/types/blog-config';

interface ImageConfigManagerProps {
  configs: BlogConfig[];
  onConfigUpdate?: () => void;
}

export function ImageConfigManager({ configs, onConfigUpdate }: ImageConfigManagerProps) {
  const { toast } = useToast();
  const [imageConfigs, setImageConfigs] = useState<BlogConfig[]>([]);
  const [logoInfo, setLogoInfo] = useState<ImageConfigInfo | null>(null);
  const [faviconInfo, setFaviconInfo] = useState<ImageConfigInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // 加载图片配置
  const loadImageConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const [imageConfigsData, logoData, faviconData] = await Promise.all([
        blogConfigImageAPI.getImageConfigs(),
        blogConfigImageAPI.getCurrentLogo().catch(() => null),
        blogConfigImageAPI.getCurrentFavicon().catch(() => null)
      ]);
      
      setImageConfigs(imageConfigsData);
      setLogoInfo(logoData);
      setFaviconInfo(faviconData);
    } catch (error) {
      toast({
        title: '加载图片配置失败',
        description: error instanceof Error ? error.message : '无法加载图片配置',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 设置Logo
  const handleSetLogo = useCallback(async (imageId: number) => {
    try {
      setUpdating('logo');
      await blogConfigImageAPI.setLogoFromGallery(imageId);
      await loadImageConfigs();
      onConfigUpdate?.();
      toast({
        title: '设置成功',
        description: 'Logo已更新',
      });
    } catch (error) {
      toast({
        title: '设置失败',
        description: error instanceof Error ? error.message : '无法设置Logo',
        variant: 'destructive'
      });
    } finally {
      setUpdating(null);
    }
  }, [toast, loadImageConfigs, onConfigUpdate]);

  // 移除Logo
  const handleRemoveLogo = useCallback(async () => {
    try {
      setUpdating('logo');
      await blogConfigImageAPI.removeLogo();
      await loadImageConfigs();
      onConfigUpdate?.();
      toast({
        title: '移除成功',
        description: 'Logo已移除',
      });
    } catch (error) {
      toast({
        title: '移除失败',
        description: error instanceof Error ? error.message : '无法移除Logo',
        variant: 'destructive'
      });
    } finally {
      setUpdating(null);
    }
  }, [toast, loadImageConfigs, onConfigUpdate]);

  // 设置Favicon
  const handleSetFavicon = useCallback(async (imageId: number) => {
    try {
      setUpdating('favicon');
      await blogConfigImageAPI.setFaviconFromGallery(imageId);
      await loadImageConfigs();
      onConfigUpdate?.();
      toast({
        title: '设置成功',
        description: 'Favicon已更新',
      });
    } catch (error) {
      toast({
        title: '设置失败',
        description: error instanceof Error ? error.message : '无法设置Favicon',
        variant: 'destructive'
      });
    } finally {
      setUpdating(null);
    }
  }, [toast, loadImageConfigs, onConfigUpdate]);

  // 移除Favicon
  const handleRemoveFavicon = useCallback(async () => {
    try {
      setUpdating('favicon');
      await blogConfigImageAPI.removeFavicon();
      await loadImageConfigs();
      onConfigUpdate?.();
      toast({
        title: '移除成功',
        description: 'Favicon已移除',
      });
    } catch (error) {
      toast({
        title: '移除失败',
        description: error instanceof Error ? error.message : '无法移除Favicon',
        variant: 'destructive'
      });
    } finally {
      setUpdating(null);
    }
  }, [toast, loadImageConfigs, onConfigUpdate]);

  // 设置配置图片
  const handleSetConfigImage = useCallback(async (configKey: string, imageId: number) => {
    try {
      setUpdating(configKey);
      await blogConfigImageAPI.setConfigImage(configKey, imageId);
      await loadImageConfigs();
      onConfigUpdate?.();
      toast({
        title: '设置成功',
        description: `${configKey} 图片已更新`,
      });
    } catch (error) {
      toast({
        title: '设置失败',
        description: error instanceof Error ? error.message : '无法设置图片',
        variant: 'destructive'
      });
    } finally {
      setUpdating(null);
    }
  }, [toast, loadImageConfigs, onConfigUpdate]);

  // 渲染图片预览
  const renderImagePreview = useCallback((imageInfo: ImageConfigInfo | null, type: string) => {
    if (!imageInfo || !imageInfo.has_image) {
      return (
        <div className="w-16 h-16 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
          <Image className="h-6 w-6 text-gray-400" />
        </div>
      );
    }

    return (
      <div className="relative w-16 h-16">
        <img
          src={imageInfo.image?.thumbnail_url || imageInfo.image?.file_url}
          alt={imageInfo.image?.display_name || type}
          className="w-full h-full object-cover rounded border"
        />
        <Badge className="absolute -top-2 -right-2 text-xs bg-green-500">
          <CheckCircle2 className="h-3 w-3" />
        </Badge>
      </div>
    );
  }, []);

  // 初始化加载
  useEffect(() => {
    loadImageConfigs();
  }, [loadImageConfigs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">加载图片配置中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Image className="h-5 w-5 mr-2" />
            网站Logo
          </CardTitle>
          <CardDescription>
            设置网站的主Logo，建议尺寸：200x60px，支持PNG、JPG、SVG格式
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            {renderImagePreview(logoInfo, 'Logo')}
            <div className="flex-1">
              {logoInfo?.has_image ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">当前Logo</p>
                  <p className="text-xs text-gray-600">
                    {logoInfo.image?.display_name || logoInfo.image?.filename}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(logoInfo.image?.file_url, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      预览
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveLogo}
                      disabled={updating === 'logo'}
                    >
                      {updating === 'logo' ? (
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-1" />
                      )}
                      移除
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">未设置Logo</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: 打开图库选择器
                      toast({ title: '图库选择器功能开发中' });
                    }}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    从图库选择
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favicon配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Image className="h-5 w-5 mr-2" />
            网站图标 (Favicon)
          </CardTitle>
          <CardDescription>
            设置网站的Favicon图标，建议尺寸：32x32px，支持ICO、PNG格式
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            {renderImagePreview(faviconInfo, 'Favicon')}
            <div className="flex-1">
              {faviconInfo?.has_image ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">当前Favicon</p>
                  <p className="text-xs text-gray-600">
                    {faviconInfo.image?.display_name || faviconInfo.image?.filename}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(faviconInfo.image?.file_url, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      预览
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveFavicon}
                      disabled={updating === 'favicon'}
                    >
                      {updating === 'favicon' ? (
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-1" />
                      )}
                      移除
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">未设置Favicon</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: 打开图库选择器
                      toast({ title: '图库选择器功能开发中' });
                    }}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    从图库选择
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 其他图片配置 */}
      {imageConfigs.filter(config => !['site_logo', 'site_favicon'].includes(config.config_key)).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>其他图片配置</CardTitle>
            <CardDescription>
              管理其他需要图片的配置项
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {imageConfigs
              .filter(config => !['site_logo', 'site_favicon'].includes(config.config_key))
              .map((config) => (
                <div key={config.id} className="flex items-center justify-between p-4 border rounded">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                      <Image className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium">{config.display_name}</p>
                      <p className="text-sm text-gray-600">{config.description}</p>
                      {config.config_value && (
                        <p className="text-xs text-blue-600">已设置图片</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {config.config_value && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(config.config_value, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: 打开图库选择器
                        toast({ title: '图库选择器功能开发中' });
                      }}
                      disabled={updating === config.config_key}
                    >
                      {updating === config.config_key ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>使用说明</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Logo建议使用透明背景的PNG格式，尺寸比例约为3:1</li>
            <li>Favicon建议使用32x32px的ICO或PNG格式</li>
            <li>所有图片都会自动生成缩略图以提高加载速度</li>
            <li>图片文件大小建议不超过2MB</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}