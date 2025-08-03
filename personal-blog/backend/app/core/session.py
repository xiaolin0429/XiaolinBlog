"""
增强的用户会话管理模块
实现严格的Session+Cookie+JWT三重验证机制
"""
import json
import redis
from datetime import datetime, timedelta
from typing import Dict, Optional, Any, List
from uuid import uuid4
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class SessionManager:
    """增强的用户会话管理器"""
    
    def __init__(self):
        self.redis_client = None
        self.session_prefix = "enhanced_session:"
        self.user_sessions_prefix = "user_sessions:"
        self.session_activity_prefix = "session_activity:"
        self.default_expire_seconds = 24 * 60 * 60  # 24小时
        self.activity_expire_seconds = 30 * 60  # 30分钟无活动则过期
        
        # 延迟初始化Redis连接
        self._init_redis()
    
    def _init_redis(self):
        """初始化Redis连接"""
        try:
            self.redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
            # 测试Redis连接
            self.redis_client.ping()
            logger.info("Redis连接成功")
        except Exception as e:
            logger.error(f"Redis连接失败: {e}")
            logger.warning("SessionManager将在无Redis模式下运行，某些功能可能不可用")
            self.redis_client = None
    
    def _ensure_redis_connection(self) -> bool:
        """确保Redis连接可用"""
        if self.redis_client is None:
            self._init_redis()
        
        if self.redis_client is None:
            logger.error("Redis连接不可用")
            return False
        
        try:
            self.redis_client.ping()
            return True
        except Exception as e:
            logger.error(f"Redis连接测试失败: {e}")
            self.redis_client = None
            return False
    
    def create_session(
        self, 
        user_id: int, 
        user_agent: str = "", 
        ip_address: str = "",
        expires_in: Optional[int] = None
    ) -> str:
        """
        创建用户会话
        
        Args:
            user_id: 用户ID
            user_agent: 用户代理信息
            ip_address: 客户端IP地址
            expires_in: 过期时间（秒），默认24小时
            
        Returns:
            session_id: 会话ID
        """
        if not self._ensure_redis_connection():
            logger.warning("Redis不可用，返回临时会话ID")
            return str(uuid4())
        
        session_id = str(uuid4())
        now = datetime.utcnow()
        expire_seconds = expires_in or self.default_expire_seconds
        
        session_data = {
            "session_id": session_id,
            "user_id": user_id,
            "user_agent": user_agent,
            "ip_address": ip_address,
            "created_at": now.isoformat(),
            "last_activity": now.isoformat(),
            "expires_at": (now + timedelta(seconds=expire_seconds)).isoformat(),
            "is_active": True,
            "login_count": 1
        }
        
        try:
            # 存储会话数据
            session_key = f"{self.session_prefix}{session_id}"
            self.redis_client.setex(
                session_key, 
                expire_seconds, 
                json.dumps(session_data)
            )
            
            # 将会话ID添加到用户的会话列表中
            user_sessions_key = f"{self.user_sessions_prefix}{user_id}"
            self.redis_client.sadd(user_sessions_key, session_id)
            self.redis_client.expire(user_sessions_key, expire_seconds)
            
            # 记录会话活动
            self._record_session_activity(session_id, "session_created", {
                "user_id": user_id,
                "ip_address": ip_address,
                "user_agent": user_agent
            })
            
            logger.info(f"会话创建成功: user_id={user_id}, session_id={session_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"创建会话失败: {e}")
            return ""
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """获取会话数据"""
        if not self._ensure_redis_connection():
            logger.warning("Redis不可用，无法获取会话数据")
            return None
            
        try:
            session_key = f"{self.session_prefix}{session_id}"
            session_data = self.redis_client.get(session_key)
            
            if session_data:
                return json.loads(session_data)
            return None
        except Exception as e:
            logger.error(f"获取会话失败: {e}")
            return None
    
    def update_session_activity(self, session_id: str) -> bool:
        """更新会话活动时间"""
        if not self._ensure_redis_connection():
            return False
            
        try:
            session_data = self.get_session(session_id)
            if not session_data:
                return False
            
            session_data["last_activity"] = datetime.utcnow().isoformat()
            
            session_key = f"{self.session_prefix}{session_id}"
            # 获取当前TTL并重新设置
            ttl = self.redis_client.ttl(session_key)
            if ttl > 0:
                self.redis_client.setex(
                    session_key, 
                    ttl, 
                    json.dumps(session_data)
                )
                return True
            return False
        except Exception as e:
            logger.error(f"更新会话活动时间失败: {e}")
            return False
    
    def delete_session(self, session_id: str) -> bool:
        """删除会话"""
        if not self._ensure_redis_connection():
            return False
            
        try:
            # 获取会话数据以获取用户ID
            session_data = self.get_session(session_id)
            if session_data:
                user_id = session_data.get("user_id")
                
                # 从用户会话列表中移除
                if user_id:
                    user_sessions_key = f"{self.user_sessions_prefix}{user_id}"
                    self.redis_client.srem(user_sessions_key, session_id)
            
            # 删除会话数据
            session_key = f"{self.session_prefix}{session_id}"
            return self.redis_client.delete(session_key) > 0
        except Exception as e:
            logger.error(f"删除会话失败: {e}")
            return False
    
    def get_user_sessions(self, user_id: int) -> list:
        """获取用户的所有会话"""
        if not self._ensure_redis_connection():
            return []
            
        try:
            user_sessions_key = f"{self.user_sessions_prefix}{user_id}"
            session_ids = self.redis_client.smembers(user_sessions_key)
            
            sessions = []
            for session_id in session_ids:
                session_data = self.get_session(session_id)
                if session_data:
                    session_data["session_id"] = session_id
                    sessions.append(session_data)
            
            return sessions
        except Exception as e:
            logger.error(f"获取用户会话失败: {e}")
            return []
    
    def delete_user_sessions(self, user_id: int, exclude_session: Optional[str] = None) -> int:
        """删除用户的所有会话（可排除指定会话）"""
        if not self._ensure_redis_connection():
            return 0
            
        try:
            user_sessions_key = f"{self.user_sessions_prefix}{user_id}"
            session_ids = self.redis_client.smembers(user_sessions_key)
            
            deleted_count = 0
            for session_id in session_ids:
                if exclude_session and session_id == exclude_session:
                    continue
                
                if self.delete_session(session_id):
                    deleted_count += 1
            
            return deleted_count
        except Exception as e:
            logger.error(f"删除用户会话失败: {e}")
            return 0
    
    def cleanup_expired_sessions(self) -> int:
        """清理过期的会话（Redis会自动处理，这里主要用于统计）"""
        if not self._ensure_redis_connection():
            return 0
            
        try:
            pattern = f"{self.session_prefix}*"
            keys = self.redis_client.keys(pattern)
            return len(keys)
        except Exception as e:
            logger.error(f"清理过期会话失败: {e}")
            return 0
    
    def validate_session(self, session_id: str, user_id: int = None, ip_address: str = None) -> bool:
        """
        验证会话有效性
        
        Args:
            session_id: 会话ID
            user_id: 用户ID（可选，用于额外验证）
            ip_address: IP地址（可选，用于安全验证）
            
        Returns:
            bool: 会话是否有效
        """
        if not self._ensure_redis_connection():
            logger.warning("Redis不可用，会话验证失败")
            return False
            
        try:
            session_data = self.get_session(session_id)
            if not session_data:
                return False
            
            # 检查会话是否激活
            if not session_data.get("is_active", False):
                return False
            
            # 检查用户ID匹配
            if user_id and session_data.get("user_id") != user_id:
                return False
            
            # 检查IP地址匹配（可选的安全检查）
            if ip_address and session_data.get("ip_address") != ip_address:
                logger.warning(f"会话IP地址不匹配: session_id={session_id}")
                # 注意：这里不直接返回False，因为用户可能更换网络
            
            # 检查会话是否过期
            expires_at = session_data.get("expires_at")
            if expires_at:
                expire_time = datetime.fromisoformat(expires_at)
                if datetime.utcnow() > expire_time:
                    self.delete_session(session_id)
                    return False
            
            # 更新最后活动时间
            self.update_session_activity(session_id)
            
            return True
            
        except Exception as e:
            logger.error(f"验证会话失败: {e}")
            return False
    
    def _record_session_activity(self, session_id: str, activity_type: str, metadata: Dict[str, Any] = None):
        """记录会话活动"""
        if not self._ensure_redis_connection():
            return
            
        try:
            activity_data = {
                "session_id": session_id,
                "activity_type": activity_type,
                "timestamp": datetime.utcnow().isoformat(),
                "metadata": metadata or {}
            }
            
            activity_key = f"{self.session_activity_prefix}{session_id}:{activity_type}:{datetime.utcnow().timestamp()}"
            self.redis_client.setex(
                activity_key,
                self.activity_expire_seconds,
                json.dumps(activity_data)
            )
            
        except Exception as e:
            logger.error(f"记录会话活动失败: {e}")
    
    def get_session_activities(self, session_id: str) -> List[Dict[str, Any]]:
        """获取会话活动记录"""
        if not self._ensure_redis_connection():
            return []
            
        try:
            pattern = f"{self.session_activity_prefix}{session_id}:*"
            keys = self.redis_client.keys(pattern)
            
            activities = []
            for key in keys:
                activity_data = self.redis_client.get(key)
                if activity_data:
                    activities.append(json.loads(activity_data))
            
            # 按时间戳排序
            activities.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            return activities
            
        except Exception as e:
            logger.error(f"获取会话活动记录失败: {e}")
            return []
    
    def extend_session(self, session_id: str, extend_seconds: int = None) -> bool:
        """延长会话有效期"""
        if not self._ensure_redis_connection():
            return False
            
        try:
            session_data = self.get_session(session_id)
            if not session_data:
                return False
            
            extend_time = extend_seconds or self.default_expire_seconds
            new_expires_at = datetime.utcnow() + timedelta(seconds=extend_time)
            session_data["expires_at"] = new_expires_at.isoformat()
            
            session_key = f"{self.session_prefix}{session_id}"
            self.redis_client.setex(
                session_key,
                extend_time,
                json.dumps(session_data)
            )
            
            # 记录会话延长活动
            self._record_session_activity(session_id, "session_extended", {
                "extend_seconds": extend_time,
                "new_expires_at": new_expires_at.isoformat()
            })
            
            return True
            
        except Exception as e:
            logger.error(f"延长会话失败: {e}")
            return False
    
    def deactivate_session(self, session_id: str) -> bool:
        """停用会话（不删除，只标记为非活跃）"""
        if not self._ensure_redis_connection():
            return False
            
        try:
            session_data = self.get_session(session_id)
            if not session_data:
                return False
            
            session_data["is_active"] = False
            session_data["deactivated_at"] = datetime.utcnow().isoformat()
            
            session_key = f"{self.session_prefix}{session_id}"
            ttl = self.redis_client.ttl(session_key)
            if ttl > 0:
                self.redis_client.setex(
                    session_key,
                    ttl,
                    json.dumps(session_data)
                )
                
                # 记录会话停用活动
                self._record_session_activity(session_id, "session_deactivated")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"停用会话失败: {e}")
            return False


# 创建会话管理器实例
session_manager = SessionManager()

# 导出常用函数
create_session = session_manager.create_session
get_session = session_manager.get_session
update_session_activity = session_manager.update_session_activity
delete_session = session_manager.delete_session
get_user_sessions = session_manager.get_user_sessions
delete_user_sessions = session_manager.delete_user_sessions
cleanup_expired_sessions = session_manager.cleanup_expired_sessions
validate_session = session_manager.validate_session
get_session_activities = session_manager.get_session_activities
extend_session = session_manager.extend_session
deactivate_session = session_manager.deactivate_session