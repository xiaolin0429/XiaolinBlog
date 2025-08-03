"""
日志过滤器
"""
import logging
import uuid
import re
from contextvars import ContextVar
from typing import Optional, Set


# 上下文变量用于存储请求相关信息
correlation_id_var: ContextVar[Optional[str]] = ContextVar('correlation_id', default=None)
user_id_var: ContextVar[Optional[int]] = ContextVar('user_id', default=None)
request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)


class CorrelationIdFilter(logging.Filter):
    """
    关联ID过滤器，为每个请求添加唯一标识
    """
    
    def filter(self, record: logging.LogRecord) -> bool:
        """
        为日志记录添加关联ID
        """
        # 获取或生成关联ID
        correlation_id = correlation_id_var.get()
        if not correlation_id:
            correlation_id = str(uuid.uuid4())
            correlation_id_var.set(correlation_id)
        
        record.correlation_id = correlation_id
        
        # 添加用户ID
        user_id = user_id_var.get()
        if user_id:
            record.user_id = user_id
            
        # 添加请求ID
        request_id = request_id_var.get()
        if request_id:
            record.request_id = request_id
        
        return True


class SensitiveDataFilter(logging.Filter):
    """
    敏感数据过滤器，过滤掉敏感信息
    """
    
    SENSITIVE_FIELDS: Set[str] = {
        'password', 'token', 'secret', 'key', 'authorization',
        'cookie', 'session', 'csrf', 'api_key', 'access_token',
        'refresh_token', 'private_key', 'credit_card', 'ssn'
    }
    
    def filter(self, record: logging.LogRecord) -> bool:
        """
        过滤敏感数据
        """
        message = record.getMessage()
        
        # 使用正则表达式匹配并替换敏感信息
        for field in self.SENSITIVE_FIELDS:
            # 匹配 JSON 格式的敏感字段
            pattern = rf'"{field}":\s*"[^"]*"'
            message = re.sub(pattern, f'"{field}": "***"', message, flags=re.IGNORECASE)
            
            # 匹配 form 格式的敏感字段
            pattern = rf'{field}=\S+'
            message = re.sub(pattern, f'{field}=***', message, flags=re.IGNORECASE)
            
            # 匹配 Authorization header
            if field == 'authorization':
                pattern = r'Authorization:\s*\S+'
                message = re.sub(pattern, 'Authorization: ***', message, flags=re.IGNORECASE)
        
        # 更新记录的消息
        record.msg = message
        record.args = ()
        
        return True


class LevelFilter(logging.Filter):
    """
    日志级别过滤器
    """
    
    def __init__(self, min_level: int = logging.INFO, max_level: int = logging.CRITICAL):
        super().__init__()
        self.min_level = min_level
        self.max_level = max_level
    
    def filter(self, record: logging.LogRecord) -> bool:
        """
        根据日志级别过滤
        """
        return self.min_level <= record.levelno <= self.max_level


class RequestFilter(logging.Filter):
    """
    请求过滤器，只记录特定类型的请求
    """
    
    def __init__(self, exclude_paths: Optional[Set[str]] = None):
        super().__init__()
        self.exclude_paths = exclude_paths or {'/health', '/metrics', '/favicon.ico'}
    
    def filter(self, record: logging.LogRecord) -> bool:
        """
        过滤不需要记录的请求路径
        """
        if hasattr(record, 'url'):
            for path in self.exclude_paths:
                if record.url.startswith(path):
                    return False
        return True