"""
认证态心跳管理模块
负责管理前端与后端的心跳检测机制
"""
import json
import redis
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import uuid4

from app.core.config import settings
from app.core.session import session_manager
import logging

logger = logging.getLogger(__name__)


class HeartbeatManager:
    """心跳管理器"""
    
    def __init__(self):
        self.redis_client = redis.Redis.from_url(settings.REDIS_URL)
        self.heartbeat_prefix = "heartbeat:"
        self.heartbeat_stats_key = "heartbeat_stats"
        self.heartbeat_interval = settings.HEARTBEAT_INTERVAL  # 5分钟
        self.heartbeat_timeout = settings.HEARTBEAT_TIMEOUT  # 10秒
        self.max_missed_heartbeats = 3  # 最大错过心跳次数
    
    def record_heartbeat(
        self,
        session_id: str,
        user_id: int,
        client_info: Dict[str, Any],
        server_timestamp: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        记录心跳信息
        
        Args:
            session_id: 会话ID
            user_id: 用户ID
            client_info: 客户端信息
            server_timestamp: 服务器时间戳
            
        Returns:
            dict: 心跳记录结果
        """
        try:
            if not server_timestamp:
                server_timestamp = datetime.utcnow()
            
            # 生成心跳记录ID
            heartbeat_id = str(uuid4())
            
            # 心跳记录数据
            heartbeat_data = {
                "heartbeat_id": heartbeat_id,
                "session_id": session_id,
                "user_id": user_id,
                "server_timestamp": server_timestamp.isoformat(),
                "client_timestamp": client_info.get("timestamp"),
                "ip_address": client_info.get("ip_address", ""),
                "user_agent": client_info.get("user_agent", ""),
                "page_url": client_info.get("page_url", ""),
                "activity_data": client_info.get("activity_data", {}),
                "response_time": None,  # 将在响应时计算
                "status": "active"
            }
            
            # 存储心跳记录（保存1小时）
            heartbeat_key = f"{self.heartbeat_prefix}{session_id}:{heartbeat_id}"
            self.redis_client.setex(
                heartbeat_key,
                3600,  # 1小时
                json.dumps(heartbeat_data)
            )
            
            # 更新会话的最后心跳时间
            session_heartbeat_key = f"{self.heartbeat_prefix}session:{session_id}"
            session_heartbeat_info = {
                "last_heartbeat": server_timestamp.isoformat(),
                "heartbeat_count": self._increment_heartbeat_count(session_id),
                "missed_count": 0,  # 重置错过次数
                "status": "active"
            }
            
            self.redis_client.setex(
                session_heartbeat_key,
                self.heartbeat_interval * 2,  # 保存2个心跳间隔
                json.dumps(session_heartbeat_info)
            )
            
            # 更新全局心跳统计
            self._update_heartbeat_stats(user_id, "heartbeat_received")
            
            logger.info(f"心跳记录成功: session_id={session_id}, user_id={user_id}")
            
            return {
                "heartbeat_id": heartbeat_id,
                "status": "recorded",
                "server_timestamp": server_timestamp.isoformat(),
                "next_heartbeat_in": self.heartbeat_interval,
                "session_status": "active"
            }
            
        except Exception as e:
            logger.error(f"记录心跳失败: {e}")
            return {
                "status": "error",
                "error_message": str(e),
                "server_timestamp": datetime.utcnow().isoformat()
            }
    
    def check_session_heartbeat_status(self, session_id: str) -> Dict[str, Any]:
        """
        检查会话的心跳状态
        
        Args:
            session_id: 会话ID
            
        Returns:
            dict: 心跳状态信息
        """
        try:
            session_heartbeat_key = f"{self.heartbeat_prefix}session:{session_id}"
            heartbeat_data = self.redis_client.get(session_heartbeat_key)
            
            if not heartbeat_data:
                return {
                    "status": "no_heartbeat",
                    "is_alive": False,
                    "last_heartbeat": None,
                    "missed_count": 0
                }
            
            heartbeat_info = json.loads(heartbeat_data)
            last_heartbeat_str = heartbeat_info.get("last_heartbeat")
            
            if not last_heartbeat_str:
                return {
                    "status": "invalid_heartbeat",
                    "is_alive": False,
                    "last_heartbeat": None,
                    "missed_count": 0
                }
            
            last_heartbeat = datetime.fromisoformat(last_heartbeat_str)
            current_time = datetime.utcnow()
            time_since_last = (current_time - last_heartbeat).total_seconds()
            
            # 判断心跳状态
            if time_since_last <= self.heartbeat_interval:
                status = "active"
                is_alive = True
            elif time_since_last <= self.heartbeat_interval * 2:
                status = "warning"
                is_alive = True
            else:
                status = "timeout"
                is_alive = False
            
            return {
                "status": status,
                "is_alive": is_alive,
                "last_heartbeat": last_heartbeat_str,
                "time_since_last": int(time_since_last),
                "heartbeat_count": heartbeat_info.get("heartbeat_count", 0),
                "missed_count": heartbeat_info.get("missed_count", 0)
            }
            
        except Exception as e:
            logger.error(f"检查心跳状态失败: {e}")
            return {
                "status": "error",
                "is_alive": False,
                "error_message": str(e)
            }
    
    def mark_missed_heartbeat(self, session_id: str) -> bool:
        """
        标记错过的心跳
        
        Args:
            session_id: 会话ID
            
        Returns:
            bool: 是否应该使会话失效
        """
        try:
            session_heartbeat_key = f"{self.heartbeat_prefix}session:{session_id}"
            heartbeat_data = self.redis_client.get(session_heartbeat_key)
            
            if heartbeat_data:
                heartbeat_info = json.loads(heartbeat_data)
                missed_count = heartbeat_info.get("missed_count", 0) + 1
                heartbeat_info["missed_count"] = missed_count
                heartbeat_info["status"] = "missed"
                
                # 更新记录
                self.redis_client.setex(
                    session_heartbeat_key,
                    self.heartbeat_interval * 2,
                    json.dumps(heartbeat_info)
                )
                
                # 如果错过次数超过阈值，返回True表示应该使会话失效
                if missed_count >= self.max_missed_heartbeats:
                    logger.warning(f"会话 {session_id} 错过心跳次数过多，建议使其失效")
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"标记错过心跳失败: {e}")
            return False
    
    def get_session_heartbeat_history(
        self, 
        session_id: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        获取会话的心跳历史记录
        
        Args:
            session_id: 会话ID
            limit: 返回记录数量限制
            
        Returns:
            list: 心跳历史记录列表
        """
        try:
            pattern = f"{self.heartbeat_prefix}{session_id}:*"
            keys = self.redis_client.keys(pattern)
            
            heartbeat_records = []
            for key in keys[:limit]:
                try:
                    data = self.redis_client.get(key)
                    if data:
                        record = json.loads(data)
                        heartbeat_records.append(record)
                except Exception:
                    continue
            
            # 按时间戳排序（最新的在前）
            heartbeat_records.sort(
                key=lambda x: x.get("server_timestamp", ""),
                reverse=True
            )
            
            return heartbeat_records[:limit]
            
        except Exception as e:
            logger.error(f"获取心跳历史失败: {e}")
            return []
    
    def cleanup_expired_heartbeats(self) -> int:
        """
        清理过期的心跳记录
        
        Returns:
            int: 清理的记录数量
        """
        try:
            pattern = f"{self.heartbeat_prefix}*"
            keys = self.redis_client.keys(pattern)
            
            cleaned_count = 0
            current_time = datetime.utcnow()
            
            for key in keys:
                try:
                    # 检查TTL，如果已过期则删除
                    ttl = self.redis_client.ttl(key)
                    if ttl == -2:  # 键已过期
                        self.redis_client.delete(key)
                        cleaned_count += 1
                except Exception:
                    continue
            
            logger.info(f"清理了 {cleaned_count} 个过期的心跳记录")
            return cleaned_count
            
        except Exception as e:
            logger.error(f"清理过期心跳记录失败: {e}")
            return 0
    
    def get_heartbeat_stats(self) -> Dict[str, Any]:
        """
        获取心跳统计信息
        
        Returns:
            dict: 统计信息
        """
        try:
            stats_data = self.redis_client.get(self.heartbeat_stats_key)
            
            if stats_data:
                stats = json.loads(stats_data)
            else:
                stats = {
                    "total_heartbeats": 0,
                    "active_sessions": 0,
                    "failed_heartbeats": 0,
                    "last_updated": datetime.utcnow().isoformat()
                }
            
            # 获取当前活跃会话数
            pattern = f"{self.heartbeat_prefix}session:*"
            active_sessions = len(self.redis_client.keys(pattern))
            stats["active_sessions"] = active_sessions
            
            return stats
            
        except Exception as e:
            logger.error(f"获取心跳统计失败: {e}")
            return {
                "error": str(e),
                "total_heartbeats": 0,
                "active_sessions": 0,
                "failed_heartbeats": 0
            }
    
    def validate_heartbeat_request(
        self, 
        session_id: str, 
        user_id: int,
        client_timestamp: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        验证心跳请求的有效性
        
        Args:
            session_id: 会话ID
            user_id: 用户ID
            client_timestamp: 客户端时间戳
            
        Returns:
            dict: 验证结果
        """
        try:
            # 验证会话是否存在且有效
            if not session_manager.validate_session(session_id, user_id):
                return {
                    "is_valid": False,
                    "error": "session_invalid",
                    "message": "会话无效或已过期"
                }
            
            # 验证时间戳（可选）
            if client_timestamp:
                try:
                    client_time = datetime.fromisoformat(client_timestamp.replace('Z', '+00:00'))
                    server_time = datetime.utcnow()
                    time_diff = abs((server_time - client_time).total_seconds())
                    
                    # 如果时间差超过5分钟，发出警告但不拒绝
                    if time_diff > 300:
                        logger.warning(f"客户端时间与服务器时间差异较大: {time_diff}秒")
                except Exception as e:
                    logger.warning(f"解析客户端时间戳失败: {e}")
            
            return {
                "is_valid": True,
                "session_status": "active",
                "server_timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"验证心跳请求失败: {e}")
            return {
                "is_valid": False,
                "error": "validation_error",
                "message": str(e)
            }
    
    def _increment_heartbeat_count(self, session_id: str) -> int:
        """增加会话的心跳计数"""
        try:
            count_key = f"{self.heartbeat_prefix}count:{session_id}"
            count = self.redis_client.incr(count_key)
            self.redis_client.expire(count_key, 24 * 3600)  # 24小时过期
            return count
        except Exception:
            return 1
    
    def _update_heartbeat_stats(self, user_id: int, event_type: str):
        """更新全局心跳统计"""
        try:
            stats_data = self.redis_client.get(self.heartbeat_stats_key)
            
            if stats_data:
                stats = json.loads(stats_data)
            else:
                stats = {
                    "total_heartbeats": 0,
                    "active_sessions": 0,
                    "failed_heartbeats": 0,
                    "last_updated": datetime.utcnow().isoformat()
                }
            
            if event_type == "heartbeat_received":
                stats["total_heartbeats"] += 1
            elif event_type == "heartbeat_failed":
                stats["failed_heartbeats"] += 1
            
            stats["last_updated"] = datetime.utcnow().isoformat()
            
            self.redis_client.setex(
                self.heartbeat_stats_key,
                24 * 3600,  # 24小时
                json.dumps(stats)
            )
            
        except Exception as e:
            logger.error(f"更新心跳统计失败: {e}")


# 创建心跳管理器实例
heartbeat_manager = HeartbeatManager()

# 导出常用函数
record_heartbeat = heartbeat_manager.record_heartbeat
check_session_heartbeat_status = heartbeat_manager.check_session_heartbeat_status
mark_missed_heartbeat = heartbeat_manager.mark_missed_heartbeat
get_session_heartbeat_history = heartbeat_manager.get_session_heartbeat_history
cleanup_expired_heartbeats = heartbeat_manager.cleanup_expired_heartbeats
get_heartbeat_stats = heartbeat_manager.get_heartbeat_stats
validate_heartbeat_request = heartbeat_manager.validate_heartbeat_request