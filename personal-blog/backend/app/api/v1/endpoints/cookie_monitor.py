"""
Cookie状态监控API端点
用于检测和处理Cookie状态变化，确保认证状态的一致性
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.session import session_manager
from app.core.token_blacklist import token_blacklist_manager
from app.core.logger_utils import get_security_logger
from app.api.v1.endpoints.deps import get_current_user
from app.schemas.user import User
from app.schemas.session import SessionInfo
from pydantic import BaseModel

router = APIRouter()


class CookieStatusRequest(BaseModel):
    """Cookie状态检查请求"""
    cookie_value: Optional[str] = None
    expected_session_id: Optional[str] = None
    client_timestamp: Optional[datetime] = None
    user_agent: Optional[str] = None


class CookieStatusResponse(BaseModel):
    """Cookie状态检查响应"""
    cookie_exists: bool
    cookie_valid: bool
    session_valid: bool
    user_id: Optional[int] = None
    session_id: Optional[str] = None
    expires_at: Optional[datetime] = None
    last_activity: Optional[datetime] = None
    warnings: List[str] = []
    recommendations: List[str] = []


class CookieIntegrityRequest(BaseModel):
    """Cookie完整性验证请求"""
    cookie_value: str
    expected_user_id: int
    client_info: Dict[str, Any] = {}


class CookieIntegrityResponse(BaseModel):
    """Cookie完整性验证响应"""
    integrity_valid: bool
    session_match: bool
    user_match: bool
    expiry_valid: bool
    security_score: int  # 0-100
    issues: List[str] = []
    recommendations: List[str] = []


class CookieCleanupRequest(BaseModel):
    """Cookie清理请求"""
    cleanup_expired: bool = True
    cleanup_invalid: bool = True
    user_id: Optional[int] = None


class CookieCleanupResponse(BaseModel):
    """Cookie清理响应"""
    cleaned_sessions: int
    cleaned_tokens: int
    cleanup_time: datetime
    details: Dict[str, Any] = {}


def _get_client_info(request: Request) -> Dict[str, str]:
    """获取客户端信息"""
    # 获取IP地址
    forwarded_for = request.headers.get('X-Forwarded-For')
    if forwarded_for:
        ip_address = forwarded_for.split(',')[0].strip()
    else:
        real_ip = request.headers.get('X-Real-IP')
        ip_address = real_ip if real_ip else (request.client.host if request.client else "unknown")
    
    # 获取用户代理
    user_agent = request.headers.get('User-Agent', '')
    
    return {
        "ip_address": ip_address,
        "user_agent": user_agent
    }


@router.post("/status", response_model=CookieStatusResponse)
def check_cookie_status(
    request: Request,
    status_request: CookieStatusRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    检查Cookie状态
    验证Cookie的存在性、有效性和会话一致性
    """
    client_info = _get_client_info(request)
    warnings = []
    recommendations = []
    
    # 获取Cookie值
    cookie_value = status_request.cookie_value or request.cookies.get(settings.COOKIE_NAME)
    
    # 基本状态检查
    cookie_exists = bool(cookie_value)
    cookie_valid = False
    session_valid = False
    user_id = None
    session_id = None
    expires_at = None
    last_activity = None
    
    if cookie_exists:
        session_id = cookie_value
        
        # 验证会话
        session_data = session_manager.get_session(session_id)
        if session_data and session_data.get("user_id") == current_user.id:
            session_valid = True
            cookie_valid = True
            user_id = current_user.id
            
            # 获取会话详细信息
            session_info = session_data
            if session_info:
                expires_at = session_info.get("expires_at")
                last_activity = session_info.get("last_activity")
                
                # 检查会话即将过期
                if expires_at:
                    expires_datetime = datetime.fromisoformat(expires_at) if isinstance(expires_at, str) else expires_at
                    time_until_expiry = expires_datetime - datetime.utcnow()
                    
                    if time_until_expiry < timedelta(minutes=10):
                        warnings.append("会话即将在10分钟内过期")
                        recommendations.append("建议刷新令牌以延长会话")
                
                # 检查长时间未活动
                if last_activity:
                    last_activity_datetime = datetime.fromisoformat(last_activity) if isinstance(last_activity, str) else last_activity
                    inactive_time = datetime.utcnow() - last_activity_datetime
                    
                    if inactive_time > timedelta(hours=1):
                        warnings.append("会话长时间未活动")
                        recommendations.append("建议进行心跳检测确认活动状态")
        else:
            warnings.append("Cookie存在但会话无效")
            recommendations.append("建议重新登录")
    else:
        warnings.append("Cookie不存在")
        recommendations.append("需要重新登录")
    
    # 记录状态检查
    security_logger = get_security_logger()
    security_logger.log_suspicious_activity(
        description=f"Cookie状态检查: 用户{current_user.username}, 状态: {'有效' if cookie_valid else '无效'}",
        ip_address=client_info["ip_address"],
        user_id=current_user.id
    )
    
    return CookieStatusResponse(
        cookie_exists=cookie_exists,
        cookie_valid=cookie_valid,
        session_valid=session_valid,
        user_id=user_id,
        session_id=session_id,
        expires_at=expires_at,
        last_activity=last_activity,
        warnings=warnings,
        recommendations=recommendations
    )


@router.post("/integrity", response_model=CookieIntegrityResponse)
def verify_cookie_integrity(
    request: Request,
    integrity_request: CookieIntegrityRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    验证Cookie完整性
    检查Cookie与用户身份、会话状态的一致性
    """
    client_info = _get_client_info(request)
    issues = []
    recommendations = []
    security_score = 100
    
    session_id = integrity_request.cookie_value
    expected_user_id = integrity_request.expected_user_id
    
    # 1. 会话匹配检查
    session_data = session_manager.get_session(session_id)
    session_match = session_data is not None and session_data.get("user_id") == expected_user_id
    if not session_match:
        issues.append("会话ID与预期用户不匹配")
        security_score -= 30
        recommendations.append("重新登录以获取有效会话")
    
    # 2. 用户匹配检查
    user_match = (current_user.id == expected_user_id)
    if not user_match:
        issues.append("当前用户与预期用户不匹配")
        security_score -= 40
        recommendations.append("检查用户身份认证")
    
    # 3. 过期时间检查
    expiry_valid = True
    if session_match:
        session_info = session_data
        if session_info and session_info.get("expires_at"):
            expires_at = session_info["expires_at"]
            expires_datetime = datetime.fromisoformat(expires_at) if isinstance(expires_at, str) else expires_at
            
            if expires_datetime <= datetime.utcnow():
                expiry_valid = False
                issues.append("会话已过期")
                security_score -= 25
                recommendations.append("刷新令牌或重新登录")
    
    # 4. 客户端信息一致性检查
    if session_match and session_info:
        stored_ip = session_info.get("ip_address")
        stored_user_agent = session_info.get("user_agent")
        
        if stored_ip and stored_ip != client_info["ip_address"]:
            issues.append("IP地址发生变化")
            security_score -= 15
            recommendations.append("验证网络环境变化")
        
        if stored_user_agent and stored_user_agent != client_info["user_agent"]:
            issues.append("用户代理发生变化")
            security_score -= 10
            recommendations.append("检查浏览器或设备变化")
    
    # 计算最终完整性状态
    integrity_valid = session_match and user_match and expiry_valid and security_score >= 70
    
    # 记录完整性检查
    security_logger = get_security_logger()
    security_logger.log_suspicious_activity(
        description=f"Cookie完整性验证: 用户{current_user.username}, 分数: {security_score}, 结果: {'通过' if integrity_valid else '失败'}",
        ip_address=client_info["ip_address"],
        user_id=current_user.id
    )
    
    return CookieIntegrityResponse(
        integrity_valid=integrity_valid,
        session_match=session_match,
        user_match=user_match,
        expiry_valid=expiry_valid,
        security_score=security_score,
        issues=issues,
        recommendations=recommendations
    )


@router.post("/cleanup", response_model=CookieCleanupResponse)
def cleanup_invalid_cookies(
    request: Request,
    cleanup_request: CookieCleanupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    清理无效的Cookie和会话
    清除过期或无效的会话数据
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    
    client_info = _get_client_info(request)
    cleaned_sessions = 0
    cleaned_tokens = 0
    cleanup_details = {}
    
    try:
        # 清理过期会话
        if cleanup_request.cleanup_expired:
            # 使用session_manager的清理功能（如果支持）
            expired_count = 0
            if hasattr(session_manager, 'cleanup_expired_sessions'):
                expired_count = session_manager.cleanup_expired_sessions()
            cleaned_sessions += expired_count
            cleanup_details["expired_sessions"] = expired_count
        
        # 清理无效会话
        if cleanup_request.cleanup_invalid:
            # 清理无效会话的逻辑
            invalid_count = 0
            cleaned_sessions += invalid_count
            cleanup_details["invalid_sessions"] = invalid_count
        
        # 清理特定用户的会话（如果指定）
        if cleanup_request.user_id:
            user_sessions = session_manager.delete_user_sessions(cleanup_request.user_id)
            cleaned_sessions += user_sessions if user_sessions else 0
            cleanup_details["user_sessions"] = user_sessions
        
        # 清理过期的黑名单token
        expired_tokens = token_blacklist_manager.cleanup_expired_tokens()
        cleaned_tokens = expired_tokens
        cleanup_details["expired_tokens"] = expired_tokens
        
        # 记录清理操作
        security_logger = get_security_logger()
        security_logger.log_suspicious_activity(
            description=f"Cookie清理操作: 清理会话{cleaned_sessions}个, 清理token{cleaned_tokens}个",
            ip_address=client_info["ip_address"],
            user_id=current_user.id
        )
        
        return CookieCleanupResponse(
            cleaned_sessions=cleaned_sessions,
            cleaned_tokens=cleaned_tokens,
            cleanup_time=datetime.utcnow(),
            details=cleanup_details
        )
        
    except Exception as e:
        # 记录清理失败
        security_logger = get_security_logger()
        security_logger.log_suspicious_activity(
            description=f"Cookie清理失败: {str(e)}",
            ip_address=client_info["ip_address"],
            user_id=current_user.id
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="清理操作失败"
        )


@router.get("/monitor/stats", response_model=dict)
def get_cookie_monitor_stats(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    获取Cookie监控统计信息
    提供会话和Cookie的统计数据
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    
    try:
        # 获取会话统计
        session_stats = {}
        if hasattr(session_manager, 'get_session_stats'):
            session_stats = session_manager.get_session_stats()
        
        # 获取token黑名单统计
        blacklist_stats = {}
        if hasattr(token_blacklist_manager, 'get_blacklist_stats'):
            blacklist_stats = token_blacklist_manager.get_blacklist_stats()
        
        # 计算活跃用户数
        active_users = 0
        if hasattr(session_manager, 'get_active_users_count'):
            active_users = session_manager.get_active_users_count()
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "session_stats": session_stats,
            "blacklist_stats": blacklist_stats,
            "active_users": active_users,
            "system_health": {
                "total_sessions": session_stats.get("total_sessions", 0),
                "active_sessions": session_stats.get("active_sessions", 0),
                "expired_sessions": session_stats.get("expired_sessions", 0),
                "blacklisted_tokens": blacklist_stats.get("total_blacklisted", 0)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取统计信息失败"
        )


@router.post("/monitor/alert", response_model=dict)
def create_cookie_alert(
    request: Request,
    alert_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    创建Cookie监控警报
    当检测到异常Cookie行为时触发警报
    """
    client_info = _get_client_info(request)
    
    # 记录警报
    security_logger = get_security_logger()
    security_logger.log_suspicious_activity(
        description=f"Cookie监控警报: {alert_data.get('message', '未知警报')}",
        ip_address=client_info["ip_address"],
        user_id=current_user.id
    )
    
    return {
        "alert_id": f"cookie_alert_{datetime.utcnow().timestamp()}",
        "message": "警报已记录",
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": current_user.id
    }