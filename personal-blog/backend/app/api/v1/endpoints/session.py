"""
会话管理API端点
"""
from datetime import datetime
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.session import session_manager
from app.core.heartbeat_manager import heartbeat_manager
from app.api.v1.endpoints.deps import get_current_user, get_current_active_superuser
from app.schemas.session import (
    SessionInfo, SessionListResponse, SessionValidationRequest, 
    SessionValidationResponse, HeartbeatRequest, HeartbeatResponse,
    SessionExtendRequest, SessionStatsResponse, SessionCleanupResponse,
    SessionActivity
)
from app.schemas.user import User

router = APIRouter()


def _get_client_info(request: Request) -> tuple[str, str]:
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
    
    return ip_address, user_agent


def _extract_session_id_from_request(request: Request) -> str:
    """从请求中提取session_id"""
    # 首先尝试从Cookie获取
    from app.core.config import settings
    session_id = request.cookies.get(settings.COOKIE_NAME)
    
    # 如果Cookie中没有，尝试从JWT token中提取
    if not session_id:
        from app.core import security
        from jose import jwt
        
        # 从Authorization header获取token
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            try:
                payload = jwt.decode(
                    token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
                )
                session_id = payload.get("session_id")
            except:
                pass
    
    return session_id or ""


@router.post("/heartbeat", response_model=HeartbeatResponse)
def auth_heartbeat(
    request: Request,
    heartbeat_data: HeartbeatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    认证态心跳确认接口
    前端定期调用此接口确认登录状态
    """
    session_id = _extract_session_id_from_request(request)
    
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无法获取会话信息"
        )
    
    # 使用心跳管理器验证请求
    validation_result = heartbeat_manager.validate_heartbeat_request(
        session_id, 
        current_user.id,
        heartbeat_data.timestamp.isoformat() if heartbeat_data.timestamp else None
    )
    
    if not validation_result.get("is_valid"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=validation_result.get("message", "心跳验证失败")
        )
    
    # 准备客户端信息
    ip_address, user_agent = _get_client_info(request)
    client_info = {
        "timestamp": heartbeat_data.timestamp.isoformat() if heartbeat_data.timestamp else None,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "page_url": heartbeat_data.activity_data.get("page_url", ""),
        "activity_data": heartbeat_data.activity_data
    }
    
    # 记录心跳
    heartbeat_result = heartbeat_manager.record_heartbeat(
        session_id=session_id,
        user_id=current_user.id,
        client_info=client_info,
        server_timestamp=datetime.utcnow()
    )
    
    # 更新会话活动时间
    session_manager.update_session_activity(session_id)

    # 获取会话详细信息
    session_info = session_manager.get_session(session_id)
    
    # 检查心跳状态
    heartbeat_status = heartbeat_manager.check_session_heartbeat_status(session_id)
    
    return HeartbeatResponse(
        status="active" if heartbeat_status.get("is_alive") else "warning",
        user_id=current_user.id,
        session_id=session_id,
        timestamp=datetime.utcnow(),
        session_info=SessionInfo(**session_info) if session_info else None,
        heartbeat_info={
            "heartbeat_id": heartbeat_result.get("heartbeat_id"),
            "next_heartbeat_in": heartbeat_result.get("next_heartbeat_in"),
            "heartbeat_count": heartbeat_status.get("heartbeat_count", 0),
            "last_heartbeat": heartbeat_status.get("last_heartbeat")
        }
    )


@router.get("/validate", response_model=SessionValidationResponse)
def validate_session(
    request: Request,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    验证当前会话状态
    """
    session_id = _extract_session_id_from_request(request)
    
    if not session_id:
        return SessionValidationResponse(
            is_valid=False,
            error_message="无法获取会话信息"
        )
    
    session_data = session_manager.get_session(session_id)
    is_valid = session_data is not None and session_data.get("user_id") == current_user.id
    session_info = None
    
    if is_valid:
        session_info = SessionInfo(**session_data)
    
    return SessionValidationResponse(
        is_valid=is_valid,
        session_info=session_info,
        error_message=None if is_valid else "会话无效或已过期"
    )


@router.get("/my-sessions", response_model=SessionListResponse)
def get_my_sessions(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    获取当前用户的所有会话
    """
    sessions = session_manager.get_user_sessions(current_user.id)
    active_sessions = []
    for session_id in sessions:
        session_data = session_manager.get_session(session_id)
        if session_data and session_data.get("user_id") == current_user.id:
            active_sessions.append(session_data)
    
    session_infos = []
    for session_data in sessions:
        try:
            session_infos.append(SessionInfo(**session_data))
        except Exception as e:
            # 跳过无效的会话数据
            continue
    
    return SessionListResponse(
        sessions=session_infos,
        total_count=len(session_infos),
        active_count=len(active_sessions)
    )


@router.delete("/invalidate/{session_id}")
def invalidate_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    使指定会话失效
    """
    # 验证会话是否属于当前用户
    session_data = session_manager.get_session(session_id)
    if not session_data or session_data.get("user_id") != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在或不属于当前用户"
        )
    
    success = session_manager.delete_session(session_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="会话失效操作失败"
        )
    
    return {"message": "会话已失效", "session_id": session_id}


@router.delete("/invalidate-all")
def invalidate_all_sessions(
    request: Request,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    使当前用户的所有其他会话失效（保留当前会话）
    """
    current_session_id = _extract_session_id_from_request(request)
    
    invalidated_count = session_manager.invalidate_user_sessions(
        current_user.id,
        exclude_session=current_session_id,
        reason="user_logout_others"
    )
    
    return {
        "message": f"已使 {invalidated_count} 个会话失效",
        "invalidated_count": invalidated_count,
        "current_session_id": current_session_id
    }


@router.post("/extend", response_model=dict)
def extend_session(
    extend_request: SessionExtendRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    延长会话有效期
    """
    # 验证会话是否属于当前用户
    session_data = session_manager.get_session(extend_request.session_id)
    if not session_data or session_data.get("user_id") != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在或不属于当前用户"
        )
    
    success = session_manager.extend_session(
        extend_request.session_id,
        extend_request.extend_minutes * 60
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="会话延期操作失败"
        )
    
    return {
        "message": "会话已延期",
        "session_id": extend_request.session_id,
        "extended_seconds": extend_request.extend_seconds
    }


@router.get("/activities/{session_id}", response_model=List[SessionActivity])
def get_session_activities(
    session_id: str,
    limit: int = 20,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    获取会话活动记录
    """
    # 验证会话是否属于当前用户
    session_data = session_manager.get_session(session_id)
    if not session_data or session_data.get("user_id") != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在或不属于当前用户"
        )
    
    # 获取会话活动记录（如果session_manager支持此功能）
    activities = []
    if hasattr(session_manager, 'get_session_activities'):
        activities = session_manager.get_session_activities(session_id, limit)
    
    activity_list = []
    for activity in activities:
        try:
            activity_list.append(SessionActivity(**activity))
        except Exception as e:
            # 跳过无效的活动记录
            continue
    
    return activity_list


# 管理员专用接口
@router.get("/admin/stats", response_model=SessionStatsResponse)
def get_session_stats(
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    获取会话统计信息（管理员专用）
    """
    # 获取活跃会话总数
    user_sessions = session_manager.get_user_sessions(current_user.id)
    total_sessions = len(user_sessions) if user_sessions else 0
    
    # 这里可以添加更多统计信息
    return SessionStatsResponse(
        total_sessions=total_sessions,
        active_sessions=total_sessions,
        user_sessions={},
        recent_activities=[]
    )


@router.post("/admin/cleanup", response_model=SessionCleanupResponse)
def cleanup_expired_sessions(
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    清理过期会话（管理员专用）
    """
    # 清理过期会话（如果session_manager支持此功能）
    cleaned_count = 0
    if hasattr(session_manager, 'cleanup_expired_sessions'):
        cleaned_count = session_manager.cleanup_expired_sessions()
    
    # 获取剩余活跃会话数
    user_sessions = session_manager.get_user_sessions(current_user.id)
    remaining_count = len(user_sessions) if user_sessions else 0
    
    return SessionCleanupResponse(
        cleaned_count=cleaned_count,
        remaining_count=remaining_count,
        cleanup_timestamp=datetime.utcnow()
    )


@router.delete("/admin/invalidate/{user_id}")
def admin_invalidate_user_sessions(
    user_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    管理员强制使指定用户的所有会话失效
    """
    invalidated_count = session_manager.delete_user_sessions(current_user.id)
    
    return {
        "message": f"已使用户 {user_id} 的 {invalidated_count} 个会话失效",
        "user_id": user_id,
        "invalidated_count": invalidated_count
    }