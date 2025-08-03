/**
 * Cookie完整性验证卡片组件
 */
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Settings
} from 'lucide-react';

// 临时Progress组件，解决导入问题
const Progress: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const percentage = Math.min(Math.max(value, 0), 100);
  return (
    <div className={`relative h-2 w-full overflow-hidden rounded-full bg-secondary ${className || ''}`}>
      <div
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  );
};

interface CookieIntegrity {
  integrity_valid: boolean;
  session_match: boolean;
  user_match: boolean;
  expiry_valid: boolean;
  security_score: number;
  issues: string[];
  recommendations: string[];
}

interface CookieIntegrityCardProps {
  cookieIntegrity: CookieIntegrity | null;
  loading: boolean;
}

export default function CookieIntegrityCard({ cookieIntegrity, loading }: CookieIntegrityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Cookie完整性验证
        </CardTitle>
        <CardDescription>
          验证Cookie与用户身份、会话状态的一致性
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {cookieIntegrity ? (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">安全评分</span>
                <Badge 
                  variant={
                    cookieIntegrity.security_score >= 80 ? "default" :
                    cookieIntegrity.security_score >= 60 ? "secondary" : "destructive"
                  }
                >
                  {cookieIntegrity.security_score}/100
                </Badge>
              </div>
              <Progress value={cookieIntegrity.security_score} className="h-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                {cookieIntegrity.integrity_valid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>整体完整性</span>
                <Badge variant={cookieIntegrity.integrity_valid ? "default" : "destructive"}>
                  {cookieIntegrity.integrity_valid ? "通过" : "失败"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {cookieIntegrity.session_match ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>会话匹配</span>
                <Badge variant={cookieIntegrity.session_match ? "default" : "destructive"}>
                  {cookieIntegrity.session_match ? "匹配" : "不匹配"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {cookieIntegrity.user_match ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>用户匹配</span>
                <Badge variant={cookieIntegrity.user_match ? "default" : "destructive"}>
                  {cookieIntegrity.user_match ? "匹配" : "不匹配"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {cookieIntegrity.expiry_valid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>过期时间</span>
                <Badge variant={cookieIntegrity.expiry_valid ? "default" : "destructive"}>
                  {cookieIntegrity.expiry_valid ? "有效" : "已过期"}
                </Badge>
              </div>
            </div>

            {cookieIntegrity.issues.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">发现问题:</div>
                    {cookieIntegrity.issues.map((issue, index) => (
                      <div key={index} className="text-sm">• {issue}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {cookieIntegrity.recommendations.length > 0 && (
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">建议:</div>
                    {cookieIntegrity.recommendations.map((rec, index) => (
                      <div key={index} className="text-sm">• {rec}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {loading ? "正在验证Cookie完整性..." : "暂无完整性验证信息"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}