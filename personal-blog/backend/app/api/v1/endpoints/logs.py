"""
日志管理API端点
"""
from datetime import datetime, timedelta
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.v1.endpoints.deps import get_db, get_current_active_superuser
from app.models.log import SystemLog, AccessLog, SecurityLog
from app.schemas.user import User
from app.services import user_service

router = APIRouter()


@router.get("/security", response_model=List[dict])
def get_security_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    event_type: Optional[str] = Query(None, description="事件类型过滤"),
    username: Optional[str] = Query(None, description="用户名过滤"),
    success: Optional[str] = Query(None, description="成功状态过滤 (success/failure)"),
    start_time: Optional[datetime] = Query(None, description="开始时间"),
    end_time: Optional[datetime] = Query(None, description="结束时间")
) -> Any:
    """
    获取安全日志列表（仅超级管理员可访问）
    """
    query = db.query(SecurityLog)
    
    # 应用过滤条件
    if event_type:
        query = query.filter(SecurityLog.event_type == event_type)
    if username:
        query = query.filter(SecurityLog.username.ilike(f"%{username}%"))
    if success is not None:
        query = query.filter(SecurityLog.success == success)
    if start_time:
        query = query.filter(SecurityLog.timestamp >= start_time)
    if end_time:
        query = query.filter(SecurityLog.timestamp <= end_time)
    
    # 排序和分页
    logs = query.order_by(SecurityLog.timestamp.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": log.id,
            "log_id": log.log_id,
            "event_type": log.event_type,
            "username": log.username,
            "user_id": log.user_id,
            "success": log.success,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "severity": log.severity,
            "description": log.description,
            "timestamp": log.timestamp.isoformat()
        }
        for log in logs
    ]


@router.get("/access", response_model=List[dict])
def get_access_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    method: Optional[str] = Query(None, description="HTTP方法过滤"),
    status_code: Optional[int] = Query(None, description="状态码过滤"),
    min_response_time: Optional[float] = Query(None, description="最小响应时间(ms)"),
    start_time: Optional[datetime] = Query(None, description="开始时间"),
    end_time: Optional[datetime] = Query(None, description="结束时间")
) -> Any:
    """
    获取访问日志列表（仅超级管理员可访问）
    """
    query = db.query(AccessLog)
    
    # 应用过滤条件
    if method:
        query = query.filter(AccessLog.method == method.upper())
    if status_code:
        query = query.filter(AccessLog.status_code == status_code)
    if min_response_time:
        query = query.filter(AccessLog.response_time >= min_response_time)
    if start_time:
        query = query.filter(AccessLog.timestamp >= start_time)
    if end_time:
        query = query.filter(AccessLog.timestamp <= end_time)
    
    # 排序和分页
    logs = query.order_by(AccessLog.timestamp.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": log.id,
            "log_id": log.log_id,
            "method": log.method,
            "path": log.path,
            "status_code": log.status_code,
            "response_time": log.response_time,
            "user_id": log.user_id,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "referer": log.referer,
            "timestamp": log.timestamp.isoformat()
        }
        for log in logs
    ]


@router.get("/system", response_model=List[dict])
def get_system_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    level: Optional[str] = Query(None, description="日志级别过滤"),
    log_type: Optional[str] = Query(None, description="日志类型过滤"),
    start_time: Optional[datetime] = Query(None, description="开始时间"),
    end_time: Optional[datetime] = Query(None, description="结束时间")
) -> Any:
    """
    获取系统日志列表（仅超级管理员可访问）
    """
    query = db.query(SystemLog)
    
    # 应用过滤条件
    if level:
        query = query.filter(SystemLog.level == level.upper())
    if log_type:
        query = query.filter(SystemLog.log_type == log_type)
    if start_time:
        query = query.filter(SystemLog.timestamp >= start_time)
    if end_time:
        query = query.filter(SystemLog.timestamp <= end_time)
    
    # 排序和分页
    logs = query.order_by(SystemLog.timestamp.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": log.id,
            "log_id": log.log_id,
            "level": log.level,
            "log_type": log.log_type,
            "message": log.message,
            "module": log.module,
            "function": log.function,
            "line_number": log.line_number,
            "user_id": log.user_id,
            "ip_address": log.ip_address,
            "correlation_id": log.correlation_id,
            "request_id": log.request_id,
            "timestamp": log.timestamp.isoformat()
        }
        for log in logs
    ]


@router.get("/stats", response_model=dict)
def get_log_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
    days: int = Query(7, ge=1, le=30, description="统计天数")
) -> Any:
    """
    获取日志统计信息（仅超级管理员可访问）
    """
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=days)
    
    # 安全日志统计
    security_total = db.query(SecurityLog).filter(
        SecurityLog.timestamp >= start_time
    ).count()
    
    security_success = db.query(SecurityLog).filter(
        SecurityLog.timestamp >= start_time,
        SecurityLog.success == True
    ).count()
    
    security_failure = security_total - security_success
    
    # 访问日志统计
    access_total = db.query(AccessLog).filter(
        AccessLog.timestamp >= start_time
    ).count()
    
    access_errors = db.query(AccessLog).filter(
        AccessLog.timestamp >= start_time,
        AccessLog.status_code >= 400
    ).count()
    
    # 系统日志统计
    system_total = db.query(SystemLog).filter(
        SystemLog.timestamp >= start_time
    ).count()
    
    system_errors = db.query(SystemLog).filter(
        SystemLog.timestamp >= start_time,
        SystemLog.level.in_(['ERROR', 'CRITICAL'])
    ).count()
    
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
            "success_rate": round(security_success / security_total * 100, 2) if security_total > 0 else 0
        },
        "access_logs": {
            "total": access_total,
            "errors": access_errors,
            "success": access_total - access_errors,
            "error_rate": round(access_errors / access_total * 100, 2) if access_total > 0 else 0
        },
        "system_logs": {
            "total": system_total,
            "errors": system_errors,
            "normal": system_total - system_errors,
            "error_rate": round(system_errors / system_total * 100, 2) if system_total > 0 else 0
        }
    }


@router.delete("/cleanup")
def cleanup_old_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
    days: int = Query(30, ge=7, le=365, description="保留天数")
) -> Any:
    """
    清理旧日志记录（仅超级管理员可访问）
    """
    cutoff_time = datetime.utcnow() - timedelta(days=days)
    
    # 删除旧的日志记录
    security_deleted = db.query(SecurityLog).filter(
        SecurityLog.timestamp < cutoff_time
    ).delete()
    
    access_deleted = db.query(AccessLog).filter(
        AccessLog.timestamp < cutoff_time
    ).delete()
    
    system_deleted = db.query(SystemLog).filter(
        SystemLog.timestamp < cutoff_time
    ).delete()
    
    db.commit()
    
    return {
        "message": f"成功清理 {days} 天前的日志记录",
        "deleted": {
            "security_logs": security_deleted,
            "access_logs": access_deleted,
            "system_logs": system_deleted,
            "total": security_deleted + access_deleted + system_deleted
        }
    }