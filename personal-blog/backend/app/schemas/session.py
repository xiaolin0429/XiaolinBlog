"""
会话相关的数据模型
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    """创建会话的请求模型"""
    user_agent: Optional[str] = Field(default="", description="用户代理信息")
    ip_address: Optional[str] = Field(default="", description="客户端IP地址")
    expires_in: Optional[int] = Field(default=None, description="过期时间（秒）")


class SessionInfo(BaseModel):
    """会话信息模型"""
    session_id: str = Field(..., description="会话ID")
    user_id: int = Field(..., description="用户ID")
    user_agent: str = Field(default="", description="用户代理信息")
    ip_address: str = Field(default="", description="客户端IP地址")
    created_at: datetime = Field(..., description="创建时间")
    last_activity: datetime = Field(..., description="最后活动时间")
    expires_at: datetime = Field(..., description="过期时间")
    is_active: bool = Field(default=True, description="是否激活")
    login_count: int = Field(default=1, description="登录次数")
    is_valid: Optional[bool] = Field(default=None, description="是否有效")
    duration_seconds: Optional[int] = Field(default=None, description="会话持续时间（秒）")
    inactive_seconds: Optional[int] = Field(default=None, description="距离上次活动时间（秒）")

    class Config:
        from_attributes = True


class SessionActivity(BaseModel):
    """会话活动记录模型"""
    session_id: str = Field(..., description="会话ID")
    activity_type: str = Field(..., description="活动类型")
    timestamp: datetime = Field(..., description="时间戳")
    data: Dict[str, Any] = Field(default_factory=dict, description="活动数据")

    class Config:
        from_attributes = True


class SessionListResponse(BaseModel):
    """会话列表响应模型"""
    sessions: List[SessionInfo] = Field(default_factory=list, description="会话列表")
    total_count: int = Field(default=0, description="总数量")
    active_count: int = Field(default=0, description="活跃数量")


class SessionValidationRequest(BaseModel):
    """会话验证请求模型"""
    session_id: str = Field(..., description="会话ID")
    user_id: Optional[int] = Field(default=None, description="用户ID（可选）")


class SessionValidationResponse(BaseModel):
    """会话验证响应模型"""
    is_valid: bool = Field(..., description="是否有效")
    session_info: Optional[SessionInfo] = Field(default=None, description="会话信息")
    error_message: Optional[str] = Field(default=None, description="错误信息")


class HeartbeatRequest(BaseModel):
    """心跳请求模型"""
    timestamp: Optional[datetime] = Field(default=None, description="客户端时间戳")
    activity_data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="活动数据")


class HeartbeatResponse(BaseModel):
    """心跳响应模型"""
    status: str = Field(..., description="状态")
    user_id: int = Field(..., description="用户ID")
    session_id: str = Field(..., description="会话ID")
    timestamp: datetime = Field(..., description="服务器时间戳")
    session_info: Optional[SessionInfo] = Field(default=None, description="会话信息")


class SessionExtendRequest(BaseModel):
    """会话延期请求模型"""
    session_id: str = Field(..., description="会话ID")
    extend_seconds: int = Field(default=3600, description="延长时间（秒）")


class SessionStatsResponse(BaseModel):
    """会话统计响应模型"""
    total_sessions: int = Field(default=0, description="总会话数")
    active_sessions: int = Field(default=0, description="活跃会话数")
    user_sessions: Dict[str, int] = Field(default_factory=dict, description="用户会话统计")
    recent_activities: List[SessionActivity] = Field(default_factory=list, description="最近活动")


class SessionCleanupResponse(BaseModel):
    """会话清理响应模型"""
    cleaned_count: int = Field(default=0, description="清理的会话数量")
    remaining_count: int = Field(default=0, description="剩余会话数量")
    cleanup_timestamp: datetime = Field(..., description="清理时间戳")