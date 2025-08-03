'use client'

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.retry} />;
      }

      return <DefaultErrorFallback error={this.state.error!} retry={this.retry} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
}

export function DefaultErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Alert className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>出现错误</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">抱歉，页面加载时出现了问题。</p>
          <p className="text-sm text-muted-foreground mb-4">
            错误信息: {error.message}
          </p>
          <Button onClick={retry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// API错误处理组件
interface ApiErrorProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export function ApiError({ error, onRetry, className }: ApiErrorProps) {
  return (
    <Alert className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>加载失败</AlertTitle>
      <AlertDescription>
        <p className="mb-2">{error}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// 空状态组件
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[300px] p-8 text-center ${className}`}>
      <div className="rounded-full bg-muted p-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
}