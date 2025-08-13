"""
日志格式化器
"""
import json
import logging
import traceback
from datetime import datetime
from typing import Dict, Any


class JSONFormatter(logging.Formatter):
    """
    JSON格式日志格式化器
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """
        格式化日志记录为JSON格式
        """
        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "message": record.getMessage(),
        }
        
        # 添加额外字段
        if hasattr(record, 'correlation_id'):
            log_entry["correlation_id"] = record.correlation_id
            
        if hasattr(record, 'user_id'):
            log_entry["user_id"] = record.user_id
            
        if hasattr(record, 'request_id'):
            log_entry["request_id"] = record.request_id
            
        if hasattr(record, 'ip_address'):
            log_entry["ip_address"] = record.ip_address
            
        if hasattr(record, 'user_agent'):
            log_entry["user_agent"] = record.user_agent
            
        if hasattr(record, 'method'):
            log_entry["method"] = record.method
            
        if hasattr(record, 'url'):
            log_entry["url"] = record.url
            
        if hasattr(record, 'status_code'):
            log_entry["status_code"] = record.status_code
            
        if hasattr(record, 'response_time'):
            log_entry["response_time"] = record.response_time
            
        if hasattr(record, 'extra_data'):
            log_entry["extra_data"] = record.extra_data
        
        # 添加异常信息
        if record.exc_info:
            log_entry["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "traceback": traceback.format_exception(*record.exc_info)
            }
        
        return json.dumps(log_entry, ensure_ascii=False, default=str)


class AccessLogFormatter(logging.Formatter):
    """
    访问日志格式化器
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """
        格式化访问日志
        """
        # 类似于 Apache Combined Log Format
        format_str = (
            '{ip_address} - {user_id} [{timestamp}] '
            '"{method} {url} HTTP/1.1" {status_code} {response_size} '
            '"{referer}" "{user_agent}" {response_time}ms'
        )
        
        return format_str.format(
            ip_address=getattr(record, 'ip_address', '-'),
            user_id=getattr(record, 'user_id', '-'),
            timestamp=datetime.fromtimestamp(record.created).strftime('%d/%b/%Y:%H:%M:%S %z'),
            method=getattr(record, 'method', '-'),
            url=getattr(record, 'url', '-'),
            status_code=getattr(record, 'status_code', '-'),
            response_size=getattr(record, 'response_size', '-'),
            referer=getattr(record, 'referer', '-'),
            user_agent=getattr(record, 'user_agent', '-'),
            response_time=getattr(record, 'response_time', '-'),
        )