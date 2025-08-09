/**
 * HTTP客户端实现
 * 基于Fetch API的统一HTTP通信实现
 */

import { 
  IHttpClient, 
  ApiResponse, 
  RequestOptions 
} from '../../core/contracts/IHttpClient'
import { 
  ApplicationError, 
  NetworkError, 
  ErrorCode 
} from '../../core/errors/ApplicationError'

export interface HttpClientConfig {
  baseURL?: string
  timeout?: number
  defaultHeaders?: Record<string, string>
  enableLogging?: boolean
}

type RequestInterceptor = (config: RequestInit & { url: string }) => RequestInit & { url: string }
type ResponseInterceptor = (response: Response) => Response | Promise<Response>

export class HttpClient implements IHttpClient {
  private config: HttpClientConfig
  private requestInterceptors: RequestInterceptor[] = []
  private responseInterceptors: ResponseInterceptor[] = []

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseURL: '',
      timeout: 30000,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      enableLogging: process.env.NODE_ENV === 'development',
      ...config
    }
  }

  setBaseURL(url: string): void {
    this.config.baseURL = url
  }

  setDefaultHeaders(headers: Record<string, string>): void {
    this.config.defaultHeaders = { ...this.config.defaultHeaders, ...headers }
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor)
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor)
  }

  private buildURL(endpoint: string): string {
    const baseURL = this.config.baseURL || ''
    const cleanBase = baseURL.replace(/\/$/, '')
    const cleanEndpoint = endpoint.replace(/^\//, '')
    return cleanBase ? `${cleanBase}/${cleanEndpoint}` : cleanEndpoint
  }

  private buildHeaders(options?: RequestOptions): Record<string, string> {
    return {
      ...this.config.defaultHeaders,
      ...options?.headers
    }
  }

  private createAbortController(options?: RequestOptions): AbortController {
    const controller = new AbortController()
    
    // 处理外部信号
    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort())
    }
    
    // 处理超时
    const timeout = options?.timeout || this.config.timeout
    if (timeout && timeout > 0) {
      setTimeout(() => controller.abort(), timeout)
    }
    
    return controller
  }

  private async processRequest(
    endpoint: string,
    requestInit: RequestInit,
    options?: RequestOptions
  ): Promise<RequestInit & { url: string }> {
    let config = {
      ...requestInit,
      url: this.buildURL(endpoint),
      headers: this.buildHeaders(options),
      signal: this.createAbortController(options).signal
    }

    // 应用请求拦截器
    for (const interceptor of this.requestInterceptors) {
      config = interceptor(config)
    }

    return config
  }

  private async processResponse(response: Response): Promise<Response> {
    let processedResponse = response

    // 应用响应拦截器
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse)
    }

    return processedResponse
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const processedResponse = await this.processResponse(response)
      
      // 检查响应状态
      if (!processedResponse.ok) {
        const errorData = await this.parseResponseData(processedResponse)
        throw new NetworkError(
          errorData?.message || errorData?.detail || `HTTP ${processedResponse.status}`,
          processedResponse.status,
          processedResponse.url
        )
      }

      // 解析响应数据
      const data = await this.parseResponseData<T>(processedResponse)
      
      return {
        data,
        success: true,
        status: processedResponse.status
      }
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }

      // 处理网络错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('网络连接失败', 0, response.url)
      }

      // 处理超时错误
      if (error.name === 'AbortError') {
        throw new NetworkError('请求超时', 0, response.url)
      }

      throw new ApplicationError(
        ErrorCode.UNKNOWN,
        error instanceof Error ? error.message : '未知错误',
        { originalError: error }
      )
    }
  }

  private async parseResponseData<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      return await response.json()
    }
    
    if (contentType?.includes('text/')) {
      return await response.text() as T
    }
    
    // 对于204 No Content等空响应
    if (response.status === 204) {
      return null as T
    }
    
    return await response.blob() as T
  }

  private log(method: string, url: string, data?: any): void {
    if (this.config.enableLogging) {
      console.group(`🌐 HTTP ${method.toUpperCase()} ${url}`)
      if (data) console.log('Data:', data)
      console.groupEnd()
    }
  }

  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    try {
      this.log('GET', endpoint)
      
      const config = await this.processRequest(endpoint, { method: 'GET' }, options)
      const response = await fetch(config.url, config)
      
      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof ApplicationError) {
        return { error: error.getUserMessage(), success: false, status: 0 }
      }
      throw error
    }
  }

  async post<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    try {
      this.log('POST', endpoint, data)
      
      const config = await this.processRequest(
        endpoint, 
        { 
          method: 'POST',
          body: data ? JSON.stringify(data) : undefined
        }, 
        options
      )
      
      const response = await fetch(config.url, config)
      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof ApplicationError) {
        return { error: error.getUserMessage(), success: false, status: 0 }
      }
      throw error
    }
  }

  async put<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    try {
      this.log('PUT', endpoint, data)
      
      const config = await this.processRequest(
        endpoint,
        {
          method: 'PUT',
          body: data ? JSON.stringify(data) : undefined
        },
        options
      )
      
      const response = await fetch(config.url, config)
      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof ApplicationError) {
        return { error: error.getUserMessage(), success: false, status: 0 }
      }
      throw error
    }
  }

  async patch<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    try {
      this.log('PATCH', endpoint, data)
      
      const config = await this.processRequest(
        endpoint,
        {
          method: 'PATCH',
          body: data ? JSON.stringify(data) : undefined
        },
        options
      )
      
      const response = await fetch(config.url, config)
      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof ApplicationError) {
        return { error: error.getUserMessage(), success: false, status: 0 }
      }
      throw error
    }
  }

  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    try {
      this.log('DELETE', endpoint)
      
      const config = await this.processRequest(endpoint, { method: 'DELETE' }, options)
      const response = await fetch(config.url, config)
      
      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof ApplicationError) {
        return { error: error.getUserMessage(), success: false, status: 0 }
      }
      throw error
    }
  }

  async upload<T = any>(endpoint: string, file: File, options?: RequestOptions): Promise<ApiResponse<T>> {
    try {
      this.log('UPLOAD', endpoint, { fileName: file.name, size: file.size })
      
      const formData = new FormData()
      formData.append('file', file)
      
      // 文件上传不设置Content-Type，让浏览器自动设置boundary
      const uploadOptions = { ...options }
      delete uploadOptions.headers?.['Content-Type']
      
      const config = await this.processRequest(
        endpoint,
        {
          method: 'POST',
          body: formData
        },
        uploadOptions
      )
      
      // 移除Content-Type头，让浏览器设置正确的multipart/form-data
      delete (config as any).headers['Content-Type']
      
      const response = await fetch(config.url, config)
      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof ApplicationError) {
        return { error: error.getUserMessage(), success: false, status: 0 }
      }
      throw error
    }
  }
}