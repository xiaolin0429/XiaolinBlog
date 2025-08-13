"""
异常处理器
"""
from typing import Any, Dict
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
import logging

from app.core.exceptions.base import (
    ApplicationError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    BusinessError,
    ExternalServiceError
)

logger = logging.getLogger(__name__)


def create_error_response(
    status_code: int,
    message: str,
    code: str = "ERROR",
    details: Dict[str, Any] = None
) -> JSONResponse:
    """创建错误响应"""
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details or {}
            }
        }
    )


async def application_error_handler(request: Request, exc: ApplicationError) -> JSONResponse:
    """应用程序异常处理器"""
    logger.error(f"应用程序异常: {exc.message}, 详情: {exc.details}")
    
    if isinstance(exc, ValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(exc, AuthenticationError):
        status_code = status.HTTP_401_UNAUTHORIZED
    elif isinstance(exc, AuthorizationError):
        status_code = status.HTTP_403_FORBIDDEN
    elif isinstance(exc, NotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(exc, BusinessError):
        status_code = status.HTTP_400_BAD_REQUEST
    elif isinstance(exc, ExternalServiceError):
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    else:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    
    return create_error_response(
        status_code=status_code,
        message=exc.message,
        code=exc.code,
        details=exc.details
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """HTTP异常处理器"""
    logger.warning(f"HTTP异常: {exc.status_code} - {exc.detail}")
    
    return create_error_response(
        status_code=exc.status_code,
        message=str(exc.detail),
        code=f"HTTP_{exc.status_code}"
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """通用异常处理器"""
    logger.error(f"未处理的异常: {type(exc).__name__} - {str(exc)}", exc_info=True)
    
    return create_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        message="服务器内部错误",
        code="INTERNAL_SERVER_ERROR"
    )


def setup_exception_handlers(app):
    """设置异常处理器"""
    app.add_exception_handler(ApplicationError, application_error_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)