"""
简化的会话认证模块
只保留基本的会话创建、验证、删除功能
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import uuid
import logging

from sqlalchemy.orm import Session
from app.core.config import settings

logger = logging.getLogger(__name__)


class SimpleSessionManager:
    """简化的会话管理器"""
    
    def __init__(self):
        # 简化版本：使用内存存储会话
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self.session_expire_hours = getattr(settings, 'SESSION_EXPIRE_HOURS', 24 * 7)  # 默认7天

    def create_session(
        self, 
        user_id: int, 
        user_agent: str = "", 
        ip_address: str = "",
        expires_in: Optional[int] = None
    ) -> Optional[str]:
        """
        创建会话
        
        Args:
            user_id: 用户ID
            user_agent: 用户代理
            ip_address: IP地址
            expires_in: 过期时间(秒)，可选
            
        Returns:
            str: 会话ID
        """
        try:
            session_id = str(uuid.uuid4())
            
            # 使用传入的expires_in或默认配置
            if expires_in:
                expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            else:
                expires_at = datetime.utcnow() + timedelta(hours=self.session_expire_hours)
            
            self._sessions[session_id] = {
                "user_id": user_id,
                "user_agent": user_agent,
                "ip_address": ip_address,
                "created_at": datetime.utcnow(),
                "last_activity": datetime.utcnow(),
                "expires_at": expires_at,
                "is_active": True
            }
            
            logger.info(f"会话创建成功: user_id={user_id}, session_id={session_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"创建会话失败: {e}")
            return None

    def validate_session(self, session_id: str, user_id: Optional[int] = None) -> bool:
        """
        验证会话
        
        Args:
            session_id: 会话ID
            user_id: 用户ID（可选）
            
        Returns:
            bool: 是否有效
        """
        if not session_id or session_id not in self._sessions:
            return False
        
        session = self._sessions[session_id]
        
        # 检查会话是否过期
        if datetime.utcnow() > session["expires_at"]:
            self.deactivate_session(session_id)
            return False
        
        # 检查会话是否激活
        if not session.get("is_active", False):
            return False
        
        # 检查用户ID是否匹配（如果提供）
        if user_id is not None and session["user_id"] != user_id:
            return False
        
        return True

    def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        获取会话信息
        
        Args:
            session_id: 会话ID
            
        Returns:
            dict: 会话信息
        """
        if not self.validate_session(session_id):
            return None
        
        return self._sessions.get(session_id)

    def update_session_activity(self, session_id: str) -> bool:
        """
        更新会话活动时间
        
        Args:
            session_id: 会话ID
            
        Returns:
            bool: 是否成功
        """
        if session_id in self._sessions:
            self._sessions[session_id]["last_activity"] = datetime.utcnow()
            return True
        return False

    def deactivate_session(self, session_id: str) -> bool:
        """
        使会话失效
        
        Args:
            session_id: 会话ID
            
        Returns:
            bool: 是否成功
        """
        if session_id in self._sessions:
            self._sessions[session_id]["is_active"] = False
            logger.info(f"会话已失效: session_id={session_id}")
            return True
        return False

    def delete_session(self, session_id: str) -> bool:
        """
        删除会话
        
        Args:
            session_id: 会话ID
            
        Returns:
            bool: 是否成功
        """
        if session_id in self._sessions:
            del self._sessions[session_id]
            logger.info(f"会话已删除: session_id={session_id}")
            return True
        return False

    def cleanup_expired_sessions(self) -> int:
        """
        清理过期会话
        
        Returns:
            int: 清理的会话数量
        """
        current_time = datetime.utcnow()
        expired_sessions = []
        
        for session_id, session in self._sessions.items():
            if current_time > session["expires_at"]:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            del self._sessions[session_id]
        
        if expired_sessions:
            logger.info(f"清理了 {len(expired_sessions)} 个过期会话")
        
        return len(expired_sessions)

    def get_user_sessions(self, user_id: int) -> Dict[str, Dict[str, Any]]:
        """
        获取用户的所有会话
        
        Args:
            user_id: 用户ID
            
        Returns:
            dict: 用户会话信息
        """
        user_sessions = {}
        for session_id, session in self._sessions.items():
            if session["user_id"] == user_id and session.get("is_active", False):
                user_sessions[session_id] = session
        return user_sessions

    def deactivate_user_sessions(self, user_id: int, except_session_id: Optional[str] = None) -> int:
        """
        使用户的所有会话失效（除了指定的会话）
        
        Args:
            user_id: 用户ID
            except_session_id: 要排除的会话ID
            
        Returns:
            int: 失效的会话数量
        """
        deactivated_count = 0
        for session_id, session in self._sessions.items():
            if (session["user_id"] == user_id 
                and session.get("is_active", False) 
                and session_id != except_session_id):
                session["is_active"] = False
                deactivated_count += 1
        
        logger.info(f"用户 {user_id} 的 {deactivated_count} 个会话已失效")
        return deactivated_count


# 创建会话管理器实例
session_manager = SimpleSessionManager()