"""
Core模块统一入口
重新组织后的核心功能模块
"""
# 配置模块
from app.core.config import settings, SessionLocal, engine, get_db, Base

# 认证模块
from app.core.auth import (
    jwt_auth_manager, 
    session_manager,
    permission_manager,
    create_access_token,
    create_refresh_token,
    authenticate_user
)

# 日志模块
from app.core.logging import setup_logging, get_logger

# 异常模块
from app.core.exceptions import (
    ApplicationError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    BusinessError,
    setup_exception_handlers
)

# 中间件模块
from app.core.middleware import LoggingMiddleware

# 安全模块
from app.core.security import verify_password, get_password_hash, get_current_timestamp

__all__ = [
    # 配置
    "settings",
    "SessionLocal",
    "engine", 
    "get_db",
    "Base",
    
    # 认证
    "jwt_auth_manager",
    "session_manager",
    "permission_manager",
    "create_access_token",
    "create_refresh_token",
    "authenticate_user",
    
    # 日志
    "setup_logging",
    "get_logger",
    
    # 异常
    "ApplicationError",
    "ValidationError",
    "AuthenticationError",
    "AuthorizationError", 
    "NotFoundError",
    "BusinessError",
    "setup_exception_handlers",
    
    # 中间件
    "LoggingMiddleware",
    
    # 安全
    "verify_password",
    "get_password_hash",
    "get_current_timestamp"
]