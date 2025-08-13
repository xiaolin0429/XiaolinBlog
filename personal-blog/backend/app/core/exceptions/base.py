"""
基础异常类
"""
from typing import Any, Dict, Optional


class ApplicationError(Exception):
    """应用程序基础异常"""
    
    def __init__(
        self, 
        message: str = "应用程序错误", 
        code: str = "APP_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(ApplicationError):
    """数据验证异常"""
    
    def __init__(
        self, 
        message: str = "数据验证失败", 
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, "VALIDATION_ERROR", details)
        self.field = field


class AuthenticationError(ApplicationError):
    """认证异常"""
    
    def __init__(
        self, 
        message: str = "认证失败", 
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, "AUTH_ERROR", details)


class AuthorizationError(ApplicationError):
    """授权异常"""
    
    def __init__(
        self, 
        message: str = "权限不足", 
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, "PERMISSION_ERROR", details)


class NotFoundError(ApplicationError):
    """资源不存在异常"""
    
    def __init__(
        self, 
        message: str = "资源不存在", 
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, "NOT_FOUND_ERROR", details)
        self.resource_type = resource_type
        self.resource_id = resource_id


class BusinessError(ApplicationError):
    """业务逻辑异常"""
    
    def __init__(
        self, 
        message: str = "业务逻辑错误", 
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, "BUSINESS_ERROR", details)


class ExternalServiceError(ApplicationError):
    """外部服务异常"""
    
    def __init__(
        self, 
        message: str = "外部服务错误", 
        service_name: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, "EXTERNAL_SERVICE_ERROR", details)
        self.service_name = service_name