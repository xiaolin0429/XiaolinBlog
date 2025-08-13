"""
中间件模块统一入口
"""
from app.core.middleware.logging import LoggingMiddleware

__all__ = [
    "LoggingMiddleware"
]