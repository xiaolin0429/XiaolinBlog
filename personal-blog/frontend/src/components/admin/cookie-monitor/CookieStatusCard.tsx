/**
 * Cookie状态检查卡片组件
 */
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Settings
} from 'lucide-react';

interface CookieStatus {
  cookie_exists: boolean;
  cookie_valid: boolean;
  session_valid: boolean;
  user_id?: number;
  session_id?: string;
  expires_at?: string;
  last_activity?: string;
  warnings: string[];
  recommendations: string[];
}

interface CookieStatusCardProps {
  cookieStatus: CookieStatus | null;
  loading: boolean;
}

export default function CookieStatusCard({ cookieStatus, loading }: CookieStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Cookie状态检查
        </CardTitle>
        <CardDescription>
          检查当前Cookie的存在性、有效性和会话状态
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {cookieStatus ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                {cookieStatus.cookie_exists ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>Cookie存在</span>
                <Badge variant={cookieStatus.cookie_exists ? "default" : "destructive"}>
                  {cookieStatus.cookie_exists ? "是" : "否"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {cookieStatus.cookie_valid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>Cookie有效</span>
                <Badge variant={cookieStatus.cookie_valid ? "default" : "destructive"}>
                  {cookieStatus.cookie_valid ? "是" : "否"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {cookieStatus.session_valid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>会话有效</span>
                <Badge variant={cookieStatus.session_valid ? "default" : "destructive"}>
                  {cookieStatus.session_valid ? "是" : "否"}
                </Badge>
              </div>
            </div>

            {cookieStatus.session_id && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">会话信息</div>
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div>会话ID: {cookieStatus.session_id}</div>
                  {cookieStatus.expires_at && (
                    <div>过期时间: {new Date(cookieStatus.expires_at).toLocaleString()}</div>
                  )}
                  {cookieStatus.last_activity && (
                    <div>最后活动: {new Date(cookieStatus.last_activity).toLocaleString()}</div>
                  )}
                </div>
              </div>
            )}

            {cookieStatus.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">警告:</div>
                    {cookieStatus.warnings.map((warning, index) => (
                      <div key={index} className="text-sm">• {warning}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {cookieStatus.recommendations.length > 0 && (
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">建议:</div>
                    {cookieStatus.recommendations.map((rec, index) => (
                      <div key={index} className="text-sm">• {rec}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {loading ? "正在检查Cookie状态..." : "暂无Cookie状态信息"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}