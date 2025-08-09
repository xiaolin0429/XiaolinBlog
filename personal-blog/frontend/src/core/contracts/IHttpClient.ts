/**
 * HTTP客户端接口契约
 * 定义所有HTTP通信的标准接口
 */

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  success?: boolean
  status?: number
}

export interface RequestOptions {
  headers?: Record<string, string>
  params?: Record<string, string | number>
  timeout?: number
  signal?: AbortSignal
}

export interface IHttpClient {
  /**
   * GET请求
   */
  get<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>>
  
  /**
   * POST请求
   */
  post<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>
  
  /**
   * PUT请求
   */
  put<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>
  
  /**
   * PATCH请求
   */
  patch<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>
  
  /**
   * DELETE请求
   */
  delete<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>>
  
  /**
   * 文件上传
   */
  upload<T = any>(url: string, file: File, options?: RequestOptions): Promise<ApiResponse<T>>
  
  /**
   * 设置基础URL
   */
  setBaseURL(url: string): void
  
  /**
   * 设置默认请求头
   */
  setDefaultHeaders(headers: Record<string, string>): void
  
  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor: (config: any) => any): void
  
  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor: (response: any) => any): void
}