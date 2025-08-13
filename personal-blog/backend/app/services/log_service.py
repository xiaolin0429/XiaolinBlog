"""
日志服务 - 支持参数记录和敏感数据掩码
"""
import json
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import and_

from app.core.config.database import SessionLocal
from app.models.log import SystemLog, SecurityLog, AccessLog, LogLevel, LogType
from app.utils.data_masker import DataMasker, mask_request_data, mask_response_data


class LogService:
    """日志服务类"""
    
    def __init__(self):
        self.data_masker = DataMasker()
    
    def _get_session(self):
        """获取数据库会话"""
        return SessionLocal()
    
    def log_system(
        self,
        level: LogLevel,
        message: str,
        log_type: LogType = LogType.APPLICATION,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        correlation_id: Optional[str] = None,
        request_id: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None
    ):
        """记录系统日志"""
        try:
            with self._get_session() as session:
                log = SystemLog(
                    log_id=str(uuid.uuid4()),
                    level=level.value,
                    log_type=log_type.value,
                    logger_name="app.system",
                    message=message,
                    user_id=user_id,
                    ip_address=ip_address,
                    correlation_id=correlation_id,
                    request_id=request_id,
                    extra_data=extra_data,
                    timestamp=datetime.utcnow()
                )
                session.add(log)
                session.commit()
        except Exception as e:
            print(f"记录系统日志失败: {e}")
    
    def log_security(
        self,
        event_type: str,
        username: str,
        success: bool,
        ip_address: str,
        user_agent: str,
        user_id: Optional[int] = None,
        severity: str = "low",
        description: Optional[str] = None
    ):
        """记录安全日志"""
        try:
            with self._get_session() as session:
                log = SecurityLog(
                    log_id=str(uuid.uuid4()),
                    event_type=event_type,
                    username=username,
                    user_id=user_id,
                    success=success,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    severity=severity,
                    description=description or f"{event_type}: {username} - {'成功' if success else '失败'}",
                    timestamp=datetime.utcnow()
                )
                session.add(log)
                session.commit()
        except Exception as e:
            print(f"记录安全日志失败: {e}")
    
    def log_access(
        self,
        method: str,
        path: str,
        status_code: int,
        response_time: float,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        referer: Optional[str] = None,
        request_params: Optional[Dict[str, Any]] = None,
        request_body: Optional[Dict[str, Any]] = None,
        response_data: Optional[Dict[str, Any]] = None
    ):
        """记录访问日志 - 支持参数记录和敏感数据掩码"""
        try:
            # 对请求参数进行敏感数据掩码处理
            masked_params = None
            if request_params:
                masked_params = mask_request_data(method, path, query_params=request_params)
            
            # 对请求体进行敏感数据掩码处理
            masked_body = None
            if request_body:
                masked_body = mask_request_data(method, path, request_body=request_body)
            
            # 对响应数据进行敏感数据掩码处理
            masked_response = None
            if response_data:
                masked_response = mask_response_data(response_data, status_code)
            
            with self._get_session() as session:
                log = AccessLog(
                    log_id=str(uuid.uuid4()),
                    method=method,
                    url=path,  # 使用path作为url
                    path=path,
                    status_code=status_code,
                    response_time=int(response_time),
                    user_id=user_id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    referer=referer,
                    request_params=masked_params,
                    request_body=masked_body,
                    response_data=masked_response,
                    timestamp=datetime.utcnow()
                )
                session.add(log)
                session.commit()
        except Exception as e:
            print(f"记录访问日志失败: {e}")
    
    def get_security_logs(
        self,
        skip: int = 0,
        limit: int = 100,
        event_type: Optional[str] = None,
        username: Optional[str] = None,
        success: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[SecurityLog]:
        """获取安全日志"""
        with self._get_session() as session:
            query = session.query(SecurityLog)
            
            if event_type:
                query = query.filter(SecurityLog.event_type == event_type)
            if username:
                query = query.filter(SecurityLog.username.ilike(f"%{username}%"))
            if success:
                query = query.filter(SecurityLog.success == success)
            if start_time:
                query = query.filter(SecurityLog.timestamp >= start_time)
            if end_time:
                query = query.filter(SecurityLog.timestamp <= end_time)
            
            return query.order_by(SecurityLog.timestamp.desc()).offset(skip).limit(limit).all()
    
    def get_access_logs(
        self,
        skip: int = 0,
        limit: int = 100,
        method: Optional[str] = None,
        path: Optional[str] = None,
        status_code: Optional[int] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[AccessLog]:
        """获取访问日志"""
        with self._get_session() as session:
            query = session.query(AccessLog)
            
            if method:
                query = query.filter(AccessLog.method == method)
            if path:
                query = query.filter(AccessLog.path.ilike(f"%{path}%"))
            if status_code:
                query = query.filter(AccessLog.status_code == status_code)
            if start_time:
                query = query.filter(AccessLog.timestamp >= start_time)
            if end_time:
                query = query.filter(AccessLog.timestamp <= end_time)
            
            return query.order_by(AccessLog.timestamp.desc()).offset(skip).limit(limit).all()
    
    def get_system_logs(
        self,
        skip: int = 0,
        limit: int = 100,
        level: Optional[LogLevel] = None,
        log_type: Optional[LogType] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[SystemLog]:
        """获取系统日志"""
        with self._get_session() as session:
            query = session.query(SystemLog)
            
            if level:
                query = query.filter(SystemLog.level == level.value)
            if log_type:
                query = query.filter(SystemLog.log_type == log_type.value)
            if start_time:
                query = query.filter(SystemLog.timestamp >= start_time)
            if end_time:
                query = query.filter(SystemLog.timestamp <= end_time)
            
            return query.order_by(SystemLog.timestamp.desc()).offset(skip).limit(limit).all()
    
    def get_log_statistics(self, days: int = 7) -> Dict[str, Any]:
        """获取日志统计信息"""
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=days)
        
        with self._get_session() as session:
            # 安全日志统计
            security_total = session.query(SecurityLog).filter(
                SecurityLog.timestamp >= start_time
            ).count()
            
            security_success = session.query(SecurityLog).filter(
                and_(
                    SecurityLog.timestamp >= start_time,
                    SecurityLog.success == True
                )
            ).count()
            
            security_failure = security_total - security_success
            security_success_rate = (security_success / security_total * 100) if security_total > 0 else 0
            
            # 访问日志统计
            access_total = session.query(AccessLog).filter(
                AccessLog.timestamp >= start_time
            ).count()
            
            access_errors = session.query(AccessLog).filter(
                and_(
                    AccessLog.timestamp >= start_time,
                    AccessLog.status_code >= 400
                )
            ).count()
            
            access_success = access_total - access_errors
            access_error_rate = (access_errors / access_total * 100) if access_total > 0 else 0
            
            # 系统日志统计
            system_total = session.query(SystemLog).filter(
                SystemLog.timestamp >= start_time
            ).count()
            
            system_errors = session.query(SystemLog).filter(
                and_(
                    SystemLog.timestamp >= start_time,
                    SystemLog.level.in_([LogLevel.ERROR.value, LogLevel.CRITICAL.value])
                )
            ).count()
            
            system_normal = system_total - system_errors
            system_error_rate = (system_errors / system_total * 100) if system_total > 0 else 0
            
            return {
                "period": {
                    "start_time": start_time.isoformat(),
                    "end_time": end_time.isoformat(),
                    "days": days
                },
                "security_logs": {
                    "total": security_total,
                    "success": security_success,
                    "failure": security_failure,
                    "success_rate": round(security_success_rate, 1)
                },
                "access_logs": {
                    "total": access_total,
                    "errors": access_errors,
                    "success": access_success,
                    "error_rate": round(access_error_rate, 1)
                },
                "system_logs": {
                    "total": system_total,
                    "errors": system_errors,
                    "normal": system_normal,
                    "error_rate": round(system_error_rate, 1)
                }
            }
    
    def cleanup_old_logs(self, days: int = 30) -> Dict[str, int]:
        """清理旧日志"""
        cutoff_time = datetime.utcnow() - timedelta(days=days)
        
        with self._get_session() as session:
            # 清理系统日志
            system_deleted = session.query(SystemLog).filter(
                SystemLog.timestamp < cutoff_time
            ).delete()
            
            # 清理安全日志
            security_deleted = session.query(SecurityLog).filter(
                SecurityLog.timestamp < cutoff_time
            ).delete()
            
            # 清理访问日志
            access_deleted = session.query(AccessLog).filter(
                AccessLog.timestamp < cutoff_time
            ).delete()
            
            session.commit()
            
            return {
                "system_logs_deleted": system_deleted,
                "security_logs_deleted": security_deleted,
                "access_logs_deleted": access_deleted,
                "total_deleted": system_deleted + security_deleted + access_deleted
            }


# 创建全局日志服务实例
log_service = LogService()