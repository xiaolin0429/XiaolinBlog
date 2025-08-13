"""
异常模块统一入口
"""
from app.core.exceptions.base import (
    ApplicationError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    BusinessError,
    ExternalServiceError
)

from app.core.exceptions.handlers import (
    create_error_response,
    application_error_handler,
    http_exception_handler,
    general_exception_handler,
    setup_exception_handlers
)

__all__ = [
    # 异常类
    "ApplicationError",
    "ValidationError",
    "AuthenticationError", 
    "AuthorizationError",
    "NotFoundError",
    "BusinessError",
    "ExternalServiceError",
    
    # 处理器
    "create_error_response",
    "application_error_handler",
    "http_exception_handler",
    "general_exception_handler",
    "setup_exception_handlers"
]