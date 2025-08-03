'use client'

import { useState, useEffect, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi<T>(
  apiFunction: () => Promise<T>,
  options: UseApiOptions = {}
) {
  const { immediate = true, onSuccess, onError } = options;
  
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiFunction();
      setState({
        data: result,
        loading: false,
        error: null,
      });
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '请求失败';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      
      if (onError) {
        onError(errorMessage);
      }
      
      throw error;
    }
  }, [apiFunction, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    ...state,
    execute,
    reset,
    refetch: execute,
  };
}

// 用于分页数据的Hook
interface UsePaginatedApiOptions extends UseApiOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export function usePaginatedApi<T>(
  apiFunction: (page: number, pageSize: number) => Promise<{ items: T[]; total: number }>,
  options: UsePaginatedApiOptions = {}
) {
  const { initialPage = 1, initialPageSize = 10, ...apiOptions } = options;
  
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  
  const {
    data,
    loading,
    error,
    execute,
    reset,
  } = useApi(
    () => apiFunction(page, pageSize),
    {
      ...apiOptions,
      immediate: false,
    }
  );

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // 重置到第一页
  }, []);

  useEffect(() => {
    execute();
  }, [page, pageSize, execute]);

  return {
    data: data?.items || [],
    total: data?.total || 0,
    loading,
    error,
    page,
    pageSize,
    refetch,
    reset,
    goToPage,
    changePageSize,
    hasNextPage: data ? page * pageSize < data.total : false,
    hasPrevPage: page > 1,
  };
}

// 用于表单提交的Hook
export function useApiMutation<T, P = any>(
  apiFunction: (params: P) => Promise<T>,
  options: UseApiOptions = {}
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: P) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiFunction(params);
      setState({
        data: result,
        loading: false,
        error: null,
      });
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '操作失败';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      throw error;
    }
  }, [apiFunction, options]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
    isLoading: state.loading,
    isSuccess: !state.loading && !state.error && state.data !== null,
    isError: !state.loading && state.error !== null,
  };
}