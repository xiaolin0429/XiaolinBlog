"""
日志工具类 - 集成数据库日志存储
"""
import logging
import traceback
from typing import Optional, Dict, Any
from datetime import datetime

from app.core.logging.filters import correlation_id_var, user_id_var, request_id_var


class SecurityLogger:
    """安全日志记录器 - 同时记录到文件和数据库"""
    
    def __init__(self):
        self.logger = logging.getLogger("app.security")
    
    def log_login_attempt(
        self,
        username: str,
        ip_address: str,
        user_agent: str,
        success: bool,
        user_id: Optional[int] = None,
        failure_reason: Optional[str] = None
    ):
        """记录登录尝试"""
        status = "成功" if success else "失败"
        message = f"登录尝试: {username} - {status}"
        
        # 记录到文件日志
        extra = {
            "event_type": "login_attempt",
            "username": username,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "success": success,
            "user_id": user_id,
            "failure_reason": failure_reason
        }
        
        if success:
            self.logger.info(message, extra=extra)
        else:
            self.logger.warning(message, extra=extra)
        
        # 记录到数据库
        try:
            from app.services.log_service import log_service
            log_service.log_security(
                event_type="login_attempt",
                username=username,
                success=success,
                ip_address=ip_address,
                user_agent=user_agent,
                user_id=user_id,
                severity="low" if success else "medium",
                description=message
            )
        except Exception as e:
            self.logger.error(f"数据库日志记录失败: {e}")
    
    def log_logout(self, username: str, user_id: int, ip_address: str):
        """记录用户登出"""
        message = f"用户登出: {username}"
        extra = {
            "event_type": "logout",
            "username": username,
            "user_id": user_id,
            "ip_address": ip_address
        }
        self.logger.info(message, extra=extra)
        
        # 记录到数据库
        try:
            from app.services.log_service import log_service
            log_service.log_security(
                event_type="logout",
                username=username,
                success=True,
                ip_address=ip_address,
                user_agent="",
                user_id=user_id,
                severity="low",
                description=message
            )
        except Exception as e:
            self.logger.error(f"数据库日志记录失败: {e}")
    
    def log_permission_denied(
        self,
        username: str,
        resource: str,
        action: str,
        ip_address: str,
        user_id: Optional[int] = None
    ):
        """记录权限拒绝"""
        message = f"权限拒绝: {username} 尝试 {action} {resource}"
        extra = {
            "event_type": "permission_denied",
            "username": username,
            "user_id": user_id,
            "resource": resource,
            "action": action,
            "ip_address": ip_address
        }
        self.logger.warning(message, extra=extra)
        
        # 记录到数据库
        try:
            from app.services.log_service import log_service
            log_service.log_security(
                event_type="permission_denied",
                username=username,
                success=False,
                ip_address=ip_address,
                user_agent="",
                user_id=user_id,
                severity="medium",
                description=message
            )
        except Exception as e:
            self.logger.error(f"数据库日志记录失败: {e}")
    
    def log_suspicious_activity(
        self,
        description: str,
        ip_address: str,
        user_id: Optional[int] = None,
        severity: str = "medium"
    ):
        """记录可疑活动"""
        message = f"可疑活动: {description}"
        extra = {
            "event_type": "suspicious_activity",
            "description": description,
            "ip_address": ip_address,
            "user_id": user_id,
            "severity": severity
        }
        
        if severity in ["high", "critical"]:
            self.logger.error(message, extra=extra)
        else:
            self.logger.warning(message, extra=extra)
        
        # 记录到数据库
        try:
            from app.services.log_service import log_service
            log_service.log_security(
                event_type="suspicious_activity",
                username="",
                success=False,
                ip_address=ip_address,
                user_agent="",
                user_id=user_id,
                severity=severity,
                description=message
            )
        except Exception as e:
            self.logger.error(f"数据库日志记录失败: {e}")


class DatabaseLogger:
    """数据库操作日志记录器"""
    
    def __init__(self):
        self.logger = logging.getLogger("app.database")
    
    def log_query(self, query: str, duration: float, user_id: Optional[int] = None):
        """记录数据库查询"""
        message = f"数据库查询执行 ({duration:.2f}ms)"
        extra = {
            "query": query,
            "duration": duration,
            "user_id": user_id
        }
        
        if duration > 1000:  # 超过1秒的慢查询
            self.logger.warning(message, extra=extra)
        else:
            self.logger.debug(message, extra=extra)
        
        # 记录到数据库（仅慢查询）
        if duration > 1000:
            try:
                from app.services.log_service import log_service
                from app.models.log import LogLevel, LogType
                log_service.log_system(
                    level=LogLevel.WARNING,
                    message=message,
                    log_type=LogType.APPLICATION,
                    user_id=user_id,
                    extra_data={"query": query, "duration": duration}
                )
            except Exception as e:
                self.logger.error(f"数据库日志记录失败: {e}")
    
    def log_transaction(self, operation: str, table: str, user_id: Optional[int] = None):
        """记录数据库事务"""
        message = f"数据库事务: {operation} on {table}"
        extra = {
            "operation": operation,
            "table": table,
            "user_id": user_id
        }
        self.logger.info(message, extra=extra)


class AccessLogger:
    """访问日志记录器 - 同时记录到文件和数据库"""
    
    def __init__(self):
        self.logger = logging.getLogger("app.access")
    
    def log_request(
        self,
        method: str,
        url: str,
        status_code: int,
        response_time: float,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        path: Optional[str] = None,
        query_params: Optional[str] = None,
        request_id: Optional[str] = None,
        request_params: Optional[Dict[str, Any]] = None,
        request_body: Optional[Dict[str, Any]] = None,
        referer: Optional[str] = None
    ):
        """记录HTTP请求"""
        message = f"{method} {url} {status_code} {response_time:.2f}ms"
        extra = {
            "method": method,
            "url": url,
            "status_code": status_code,
            "response_time": response_time,
            "user_id": user_id,
            "ip_address": ip_address,
            "request_params": request_params,
            "request_body": request_body
        }
        
        if status_code >= 500:
            self.logger.error(message, extra=extra)
        elif status_code >= 400:
            self.logger.warning(message, extra=extra)
        else:
            self.logger.info(message, extra=extra)
        
        # 记录到数据库
        try:
            from app.services.log_service import log_service
            log_service.log_access(
                method=method,
                path=url,
                status_code=status_code,
                response_time=response_time,
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                referer=referer,
                request_params=request_params,
                request_body=request_body
            )
        except Exception as e:
            self.logger.error(f"数据库日志记录失败: {e}")


class ErrorLogger:
    """错误日志记录器 - 同时记录到文件和数据库"""
    
    def __init__(self):
        self.logger = logging.getLogger("app.error")
    
    def log_exception(
        self,
        exception: Exception,
        context: Optional[Dict[str, Any]] = None,
        user_id: Optional[int] = None,
        request_id: Optional[str] = None,
        url: Optional[str] = None,
        method: Optional[str] = None
    ):
        """记录异常"""
        message = f"异常发生: {type(exception).__name__}: {str(exception)}"
        extra = {
            "exception_type": type(exception).__name__,
            "exception_message": str(exception),
            "traceback": traceback.format_exc(),
            "context": context or {},
            "user_id": user_id
        }
        self.logger.error(message, extra=extra)
        
        # 记录到数据库
        try:
            from app.services.log_service import log_service
            from app.models.log import LogLevel, LogType
            log_service.log_system(
                level=LogLevel.ERROR,
                message=message,
                log_type=LogType.ERROR,
                user_id=user_id,
                request_id=request_id,
                extra_data=context
            )
        except Exception as e:
            self.logger.error(f"数据库日志记录失败: {e}")
    
    def log_validation_error(
        self,
        field: str,
        value: Any,
        error_message: str,
        user_id: Optional[int] = None
    ):
        """记录验证错误"""
        message = f"验证错误: {field} = {value}, {error_message}"
        extra = {
            "error_type": "validation_error",
            "field": field,
            "value": str(value),
            "error_message": error_message,
            "user_id": user_id
        }
        self.logger.warning(message, extra=extra)
        
        # 记录到数据库
        try:
            from app.services.log_service import log_service
            from app.models.log import LogLevel, LogType
            log_service.log_system(
                level=LogLevel.WARNING,
                message=message,
                log_type=LogType.APPLICATION,
                user_id=user_id,
                extra_data={
                    "field": field,
                    "value": str(value),
                    "error_message": error_message
                }
            )
        except Exception as e:
            self.logger.error(f"数据库日志记录失败: {e}")


# 创建全局日志记录器实例
def get_logger(name: str) -> logging.Logger:
    """获取应用日志记录器"""
    return logging.getLogger(f"app.{name}")


def get_security_logger() -> SecurityLogger:
    """获取安全日志记录器"""
    return SecurityLogger()


def get_database_logger() -> DatabaseLogger:
    """获取数据库日志记录器"""
    return DatabaseLogger()


def get_access_logger() -> AccessLogger:
    """获取访问日志记录器"""
    return AccessLogger()


def get_error_logger() -> ErrorLogger:
    """获取错误日志记录器"""
    return ErrorLogger()


# 全局实例
security_logger = get_security_logger()
database_logger = get_database_logger()
access_logger = get_access_logger()
error_logger = get_error_logger()