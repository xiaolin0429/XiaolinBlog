"""
日志相关数据库模型
"""
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Index, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.config.database import Base


class LogLevel(str, Enum):
    """日志级别枚举"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class LogType(str, Enum):
    """日志类型枚举"""
    APPLICATION = "application"  # 应用日志
    ACCESS = "access"           # 访问日志
    SECURITY = "security"       # 安全日志
    ERROR = "error"            # 错误日志
    AUDIT = "audit"            # 审计日志


class SystemLog(Base):
    """系统日志表"""
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    
    # 基本信息
    level = Column(String(20), nullable=False, index=True)
    log_type = Column(String(20), nullable=False, index=True)
    logger_name = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    
    # 时间信息
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # 请求相关信息
    request_id = Column(String(100), index=True)
    correlation_id = Column(String(100), index=True)
    user_id = Column(Integer, index=True)
    session_id = Column(String(100))
    
    # 网络信息
    ip_address = Column(String(45))  # 支持IPv6
    user_agent = Column(Text)
    method = Column(String(10))
    url = Column(Text)
    status_code = Column(Integer)
    response_time = Column(Integer)  # 毫秒
    
    # 模块信息
    module = Column(String(100))
    function = Column(String(100))
    line_number = Column(Integer)
    
    # 扩展信息
    extra_data = Column(JSON)  # 存储额外的结构化数据
    
    # 异常信息
    exception_type = Column(String(100))
    exception_message = Column(Text)
    traceback = Column(Text)
    
    # 创建时间
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 创建索引
    __table_args__ = (
        Index('idx_logs_timestamp_level', 'timestamp', 'level'),
        Index('idx_logs_type_timestamp', 'log_type', 'timestamp'),
        Index('idx_logs_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_logs_ip_timestamp', 'ip_address', 'timestamp'),
    )


class SecurityLog(Base):
    """安全日志表"""
    __tablename__ = "security_logs"

    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    
    # 基本信息
    event_type = Column(String(50), nullable=False, index=True)  # login, logout, permission_denied, etc.
    description = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False, index=True)  # low, medium, high, critical
    
    # 用户信息
    user_id = Column(Integer, index=True)
    username = Column(String(100), index=True)
    
    # 网络信息
    ip_address = Column(String(45), index=True)
    user_agent = Column(Text)
    location = Column(String(100))  # 地理位置
    
    # 请求信息
    request_id = Column(String(100))
    method = Column(String(10))
    url = Column(Text)
    
    # 结果信息
    success = Column(Boolean, nullable=True)  # True for success, False for failure
    failure_reason = Column(String(200))
    
    # 扩展信息
    extra_metadata = Column(JSON)
    
    # 时间信息
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 创建索引
    __table_args__ = (
        Index('idx_security_event_timestamp', 'event_type', 'timestamp'),
        Index('idx_security_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_security_ip_timestamp', 'ip_address', 'timestamp'),
        Index('idx_security_severity_timestamp', 'severity', 'timestamp'),
    )


class AccessLog(Base):
    """访问日志表"""
    __tablename__ = "access_logs"

    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    
    # 请求信息
    # 请求信息
    method = Column(String(10), nullable=False, index=True)
    url = Column(Text, nullable=False)
    path = Column(String(500), index=True)
    query_params = Column(Text)
    
    # 参数信息
    request_params = Column(JSON, comment="请求参数（已脱敏）")
    request_body = Column(JSON, comment="请求体（已脱敏）")
    response_data = Column(JSON, comment="响应数据（已脱敏）")
    
    # 响应信息
    status_code = Column(Integer, nullable=False, index=True)
    response_size = Column(Integer)
    response_time = Column(Integer)  # 毫秒
    
    # 用户信息
    user_id = Column(Integer, index=True)
    session_id = Column(String(100))
    
    # 网络信息
    ip_address = Column(String(45), index=True)
    user_agent = Column(Text)
    referer = Column(Text)
    
    # 请求标识
    request_id = Column(String(100), index=True)
    correlation_id = Column(String(100))
    
    # 扩展信息
    headers = Column(JSON)
    extra_data = Column(JSON)
    
    # 时间信息
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 创建索引
    __table_args__ = (
        Index('idx_access_method_timestamp', 'method', 'timestamp'),
        Index('idx_access_status_timestamp', 'status_code', 'timestamp'),
        Index('idx_access_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_access_path_timestamp', 'path', 'timestamp'),
    )