"""
日志记录中间件 - 支持参数记录和敏感数据掩码
"""
import time
import uuid
import json
import asyncio
from typing import Callable, Dict, Any, Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.filters import correlation_id_var, user_id_var, request_id_var
from app.core.logger_utils import get_access_logger, get_error_logger
from app.services.log_service import log_service


class LoggingMiddleware(BaseHTTPMiddleware):
    """日志记录中间件"""
    
    def __init__(self, app):
        super().__init__(app)
        self.access_logger = get_access_logger()
        self.error_logger = get_error_logger()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """处理请求并记录日志"""
        print(f"[DEBUG] 日志中间件开始处理请求: {request.method} {request.url}")
        
        # 生成请求ID和关联ID
        request_id = str(uuid.uuid4())
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        
        # 设置请求上下文
        request_id_var.set(request_id)
        correlation_id_var.set(correlation_id)
        
        # 获取用户ID（如果已认证）
        user_id = getattr(request.state, "user_id", None)
        if user_id:
            user_id_var.set(user_id)
        
        # 获取请求信息
        method = request.method
        url = str(request.url)
        ip_address = self._get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "")
        referer = request.headers.get("Referer")
        
        print(f"[DEBUG] 基本信息获取完成: {method} {url}")
        
        # 获取请求参数
        request_params = await self._get_request_params(request)
        print(f"[DEBUG] 请求参数: {request_params}")
        
        request_body = await self._get_request_body(request)
        print(f"[DEBUG] 请求体: {request_body}")
        
        start_time = time.time()
        response = None
        
        try:
            # 处理请求
            response = await call_next(request)
            
            # 计算响应时间
            response_time = (time.time() - start_time) * 1000
            
            # 获取响应数据
            response_data = await self._get_response_data(response)
            
            print(f"[DEBUG] 开始记录访问日志到数据库")
            
            # 记录访问日志（包含文件和数据库）
            self.access_logger.log_request(
                method=method,
                url=url,
                status_code=response.status_code,
                response_time=response_time,
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                path=url,
                request_id=request_id,
                request_params=request_params,
                request_body=request_body,
                referer=referer
            )
            
            print(f"[DEBUG] 访问日志记录完成")
            
            return response
            
        except Exception as e:
            print(f"[DEBUG] 请求处理异常: {e}")
            # 计算响应时间
            response_time = (time.time() - start_time) * 1000
            
            # 记录错误日志
            self.error_logger.log_exception(
                exception=e,
                context={
                    "method": method,
                    "url": url,
                    "ip_address": ip_address,
                    "user_agent": user_agent,
                    "request_params": request_params,
                    "request_body": request_body
                },
                user_id=user_id
            )
            
            # 记录错误访问日志（包含文件和数据库）
            self.access_logger.log_request(
                method=method,
                url=url,
                status_code=500,
                response_time=response_time,
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                path=url,
                request_id=request_id,
                request_params=request_params,
                request_body=request_body,
                referer=referer
            )
            
            raise
    
    def _get_client_ip(self, request: Request) -> str:
        """获取客户端IP地址"""
        # 检查代理头
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # 返回直接连接的IP
        return request.client.host if request.client else "unknown"
    
    async def _get_request_params(self, request: Request) -> Optional[Dict[str, Any]]:
        """获取请求参数"""
        try:
            # 获取查询参数
            query_params = dict(request.query_params)
            
            # 获取路径参数
            path_params = getattr(request, "path_params", {})
            
            if query_params or path_params:
                return {
                    "query": query_params,
                    "path": path_params
                }
            return None
        except Exception as e:
            print(f"获取请求参数失败: {e}")
            return None
    
    async def _get_request_body(self, request: Request) -> Optional[Dict[str, Any]]:
        """获取请求体"""
        try:
            # 只记录特定内容类型的请求体
            content_type = request.headers.get("Content-Type", "")
            
            if not any(ct in content_type.lower() for ct in ["json", "form", "xml"]):
                return None
            
            # 检查请求体大小，避免记录过大的数据
            content_length = request.headers.get("Content-Length")
            if content_length and int(content_length) > 10240:  # 10KB限制
                return {"message": "请求体过大，已省略", "size": content_length}
            
            # 获取原始请求体数据
            body = await request.body()
            if not body:
                return None
            
            # 重新设置请求体，以便后续处理可以再次读取
            async def receive():
                return {"type": "http.request", "body": body}
            request._receive = receive
            
            # 尝试解析JSON
            if "json" in content_type.lower():
                try:
                    return json.loads(body.decode("utf-8"))
                except (json.JSONDecodeError, UnicodeDecodeError) as e:
                    print(f"解析JSON失败: {e}")
                    return None
            
            # 尝试解析表单数据
            elif "form" in content_type.lower():
                try:
                    # 对于表单数据，我们需要特殊处理
                    body_str = body.decode("utf-8")
                    if "application/x-www-form-urlencoded" in content_type:
                        from urllib.parse import parse_qs
                        parsed = parse_qs(body_str)
                        return {k: v[0] if len(v) == 1 else v for k, v in parsed.items()}
                    return {"raw_form_data": body_str[:500]}  # 限制长度
                except Exception as e:
                    print(f"解析表单数据失败: {e}")
                    return None
            
            return None
            
        except Exception as e:
            print(f"获取请求体失败: {e}")
            return None
    
    async def _get_response_data(self, response: Response) -> Optional[Dict[str, Any]]:
        """获取响应数据"""
        try:
            # 只记录特定状态码的响应
            if response.status_code >= 400:
                # 错误响应需要记录
                pass
            elif response.status_code == 200:
                # 成功响应选择性记录
                content_type = response.headers.get("Content-Type", "")
                if not any(ct in content_type.lower() for ct in ["json", "xml"]):
                    return None
            else:
                # 其他状态码不记录响应体
                return None
            
            # 检查响应体大小
            content_length = response.headers.get("Content-Length")
            if content_length and int(content_length) > 10240:  # 10KB限制
                return {
                    "message": "响应体过大，已省略",
                    "size": content_length,
                    "content_type": response.headers.get("Content-Type")
                }
            
            # 尝试获取响应体（这里需要特殊处理，因为响应体可能已经被消费）
            # 注意：在实际应用中，可能需要使用响应体包装器来捕获响应数据
            return {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "message": "响应体记录需要额外配置"
            }
            
        except Exception as e:
            print(f"获取响应数据失败: {e}")
            return None