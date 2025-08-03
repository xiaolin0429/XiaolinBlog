"""
JWT令牌黑名单管理模块
用于管理被撤销的JWT令牌
"""
import json
import redis
from datetime import datetime, timedelta
from typing import Optional, Set, List
from uuid import uuid4

from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class TokenBlacklistManager:
    """JWT令牌黑名单管理器"""
    
    def __init__(self):
        self.redis_client = redis.Redis.from_url(settings.REDIS_URL)
        self.blacklist_prefix = "token_blacklist:"
        self.blacklist_set_key = "blacklisted_tokens"
        self.default_expire_hours = 24  # 默认过期时间24小时
    
    def add_token(
        self, 
        token: str, 
        expires_at: Optional[datetime] = None,
        reason: str = "manual_revoke"
    ) -> bool:
        """
        将令牌添加到黑名单
        
        Args:
            token: JWT令牌
            expires_at: 令牌过期时间
            reason: 撤销原因
            
        Returns:
            bool: 是否添加成功
        """
        try:
            # 生成黑名单记录ID
            blacklist_id = str(uuid4())
            
            # 计算过期时间
            if expires_at:
                expire_seconds = int((expires_at - datetime.utcnow()).total_seconds())
                if expire_seconds <= 0:
                    # 令牌已过期，无需加入黑名单
                    return True
            else:
                expire_seconds = self.default_expire_hours * 3600
            
            # 黑名单记录数据
            blacklist_data = {
                "token": token,
                "blacklisted_at": datetime.utcnow().isoformat(),
                "expires_at": expires_at.isoformat() if expires_at else None,
                "reason": reason,
                "blacklist_id": blacklist_id
            }
            
            # 存储黑名单记录
            blacklist_key = f"{self.blacklist_prefix}{blacklist_id}"
            self.redis_client.setex(
                blacklist_key,
                expire_seconds,
                json.dumps(blacklist_data)
            )
            
            # 将令牌哈希添加到黑名单集合（用于快速查询）
            token_hash = self._hash_token(token)
            self.redis_client.sadd(self.blacklist_set_key, token_hash)
            self.redis_client.expire(self.blacklist_set_key, expire_seconds)
            
            logger.info(f"令牌已添加到黑名单: reason={reason}, expires_in={expire_seconds}s")
            return True
            
        except Exception as e:
            logger.error(f"添加令牌到黑名单失败: {e}")
            return False
    
    def is_blacklisted(self, token: str) -> bool:
        """
        检查令牌是否在黑名单中
        
        Args:
            token: JWT令牌
            
        Returns:
            bool: 是否在黑名单中
        """
        try:
            token_hash = self._hash_token(token)
            return self.redis_client.sismember(self.blacklist_set_key, token_hash)
        except Exception as e:
            logger.error(f"检查令牌黑名单状态失败: {e}")
            # 出错时为了安全起见，假设令牌在黑名单中
            return True
    
    def remove_token(self, token: str) -> bool:
        """
        从黑名单中移除令牌（通常不需要，因为Redis会自动过期）
        
        Args:
            token: JWT令牌
            
        Returns:
            bool: 是否移除成功
        """
        try:
            token_hash = self._hash_token(token)
            removed = self.redis_client.srem(self.blacklist_set_key, token_hash)
            return removed > 0
        except Exception as e:
            logger.error(f"从黑名单移除令牌失败: {e}")
            return False
    
    def get_blacklist_info(self, token: str) -> Optional[dict]:
        """
        获取令牌的黑名单信息
        
        Args:
            token: JWT令牌
            
        Returns:
            dict: 黑名单信息，如果不在黑名单中返回None
        """
        try:
            if not self.is_blacklisted(token):
                return None
            
            # 遍历所有黑名单记录查找匹配的令牌
            pattern = f"{self.blacklist_prefix}*"
            keys = self.redis_client.keys(pattern)
            
            for key in keys:
                try:
                    data = self.redis_client.get(key)
                    if data:
                        blacklist_info = json.loads(data)
                        if blacklist_info.get("token") == token:
                            return blacklist_info
                except Exception:
                    continue
            
            return None
            
        except Exception as e:
            logger.error(f"获取黑名单信息失败: {e}")
            return None
    
    def cleanup_expired_tokens(self) -> int:
        """
        清理过期的黑名单记录
        
        Returns:
            int: 清理的记录数量
        """
        try:
            pattern = f"{self.blacklist_prefix}*"
            keys = self.redis_client.keys(pattern)
            
            cleaned_count = 0
            current_time = datetime.utcnow()
            
            for key in keys:
                try:
                    data = self.redis_client.get(key)
                    if data:
                        blacklist_info = json.loads(data)
                        expires_at_str = blacklist_info.get("expires_at")
                        
                        if expires_at_str:
                            expires_at = datetime.fromisoformat(expires_at_str)
                            if current_time > expires_at:
                                # 从黑名单集合中移除
                                token = blacklist_info.get("token")
                                if token:
                                    token_hash = self._hash_token(token)
                                    self.redis_client.srem(self.blacklist_set_key, token_hash)
                                
                                # 删除黑名单记录
                                self.redis_client.delete(key)
                                cleaned_count += 1
                except Exception:
                    # 如果记录损坏，直接删除
                    self.redis_client.delete(key)
                    cleaned_count += 1
            
            logger.info(f"清理了 {cleaned_count} 个过期的黑名单记录")
            return cleaned_count
            
        except Exception as e:
            logger.error(f"清理过期黑名单记录失败: {e}")
            return 0
    
    def get_blacklist_stats(self) -> dict:
        """
        获取黑名单统计信息
        
        Returns:
            dict: 统计信息
        """
        try:
            # 获取黑名单集合大小
            total_blacklisted = self.redis_client.scard(self.blacklist_set_key)
            
            # 获取详细记录数量
            pattern = f"{self.blacklist_prefix}*"
            detailed_records = len(self.redis_client.keys(pattern))
            
            return {
                "total_blacklisted_tokens": total_blacklisted,
                "detailed_records": detailed_records,
                "last_cleanup": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"获取黑名单统计信息失败: {e}")
            return {
                "total_blacklisted_tokens": 0,
                "detailed_records": 0,
                "error": str(e)
            }
    
    def blacklist_user_tokens(
        self, 
        user_id: int, 
        reason: str = "user_logout_all"
    ) -> int:
        """
        将指定用户的所有令牌加入黑名单
        注意：这需要配合会话管理来实现，因为JWT本身不包含足够信息来识别用户的所有令牌
        
        Args:
            user_id: 用户ID
            reason: 撤销原因
            
        Returns:
            int: 加入黑名单的令牌数量
        """
        try:
            # 这里需要配合会话管理系统
            from app.core.session import session_manager
            
            # 获取用户的所有会话
            user_sessions = session_manager.get_user_sessions(user_id)
            
            blacklisted_count = 0
            for session in user_sessions:
                session_id = session.get("session_id")
                if session_id:
                    # 使会话失效，这会间接使相关的JWT令牌失效
                    if session_manager.delete_session(session_id):
                        blacklisted_count += 1
            
            logger.info(f"用户 {user_id} 的 {blacklisted_count} 个会话已失效")
            return blacklisted_count
            
        except Exception as e:
            logger.error(f"使用户令牌失效失败: {e}")
            return 0
    
    def _hash_token(self, token: str) -> str:
        """
        对令牌进行哈希处理（用于快速查询）
        
        Args:
            token: JWT令牌
            
        Returns:
            str: 令牌哈希值
        """
        import hashlib
        return hashlib.sha256(token.encode()).hexdigest()


# 创建令牌黑名单管理器实例
token_blacklist_manager = TokenBlacklistManager()

# 导出常用函数
add_token_to_blacklist = token_blacklist_manager.add_token
is_token_blacklisted = token_blacklist_manager.is_blacklisted
remove_token_from_blacklist = token_blacklist_manager.remove_token
get_blacklist_info = token_blacklist_manager.get_blacklist_info
cleanup_expired_blacklist = token_blacklist_manager.cleanup_expired_tokens
get_blacklist_stats = token_blacklist_manager.get_blacklist_stats
blacklist_user_tokens = token_blacklist_manager.blacklist_user_tokens