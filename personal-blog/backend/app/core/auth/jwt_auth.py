"""
简化的JWT认证模块
统一认证逻辑，支持JWT + Session双重验证
"""
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union

from fastapi import HTTPException, status, Request
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import verify_password
from app.models.user import User
from app.crud import user as user_crud
import logging

logger = logging.getLogger(__name__)


class JWTAuthManager:
    """简化的JWT认证管理器"""
    
    def __init__(self):
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        self.refresh_token_expire_days = getattr(settings, 'REFRESH_TOKEN_EXPIRE_DAYS', 30)

    def create_access_token(
        self, 
        subject: Union[str, Any], 
        session_id: Optional[str] = None,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        创建访问令牌
        
        Args:
            subject: 用户ID
            session_id: 会话ID（可选）
            expires_delta: 过期时间增量
            
        Returns:
            str: JWT访问令牌
        """
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=self.access_token_expire_minutes
            )
        
        to_encode = {
            "exp": expire,
            "sub": str(subject),
            "type": "access",
            "iat": datetime.utcnow().timestamp()
        }
        
        # 如果提供了session_id，则包含在令牌中
        if session_id:
            to_encode["session_id"] = session_id
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def create_refresh_token(
        self, 
        subject: Union[str, Any], 
        session_id: Optional[str] = None,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        创建刷新令牌
        
        Args:
            subject: 用户ID
            session_id: 会话ID（可选）
            expires_delta: 过期时间增量
            
        Returns:
            str: JWT刷新令牌
        """
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                days=self.refresh_token_expire_days
            )
        
        to_encode = {
            "exp": expire,
            "sub": str(subject),
            "type": "refresh",
            "iat": datetime.utcnow().timestamp()
        }
        
        # 如果提供了session_id，则包含在令牌中
        if session_id:
            to_encode["session_id"] = session_id
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verify_token(self, token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
        """
        验证令牌并返回载荷信息
        
        Args:
            token: JWT令牌
            token_type: 令牌类型
            
        Returns:
            dict: 载荷信息
        """
        try:
            # 检查令牌是否在黑名单中（简化版）
            if self._is_token_blacklisted(token):
                logger.warning("令牌在黑名单中")
                return None
            
            payload = jwt.decode(
                token, self.secret_key, algorithms=[self.algorithm]
            )
            
            # 检查令牌类型
            if payload.get("type") != token_type:
                logger.warning(f"令牌类型不匹配: expected={token_type}, actual={payload.get('type')}")
                return None
            
            return {
                "user_id": payload.get("sub"),
                "session_id": payload.get("session_id"),
                "exp": payload.get("exp"),
                "iat": payload.get("iat")
            }
            
        except JWTError as e:
            logger.warning(f"JWT验证失败: {e}")
            return None

    def authenticate_user(
        self, 
        db: Session, 
        email: str, 
        password: str
    ) -> Optional[User]:
        """用户认证"""
        user = user_crud.authenticate(db, email=email, password=password)
        return user

    def create_token_pair(self, user_id: int, session_id: Optional[str] = None) -> Dict[str, Any]:
        """创建令牌对（访问令牌和刷新令牌）"""
        access_token = self.create_access_token(subject=user_id, session_id=session_id)
        refresh_token = self.create_refresh_token(subject=user_id, session_id=session_id)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": self.access_token_expire_minutes * 60
        }

    def refresh_access_token(
        self, 
        db: Session, 
        refresh_token: str
    ) -> Dict[str, Any]:
        """使用刷新令牌获取新的访问令牌"""
        token_data = self.verify_token(refresh_token, token_type="refresh")
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的刷新令牌",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_id = token_data["user_id"]
        session_id = token_data["session_id"]
        
        # 如果有会话，验证会话是否有效
        if session_id:
            try:
                from app.core.session import session_manager
                if not session_manager.validate_session(session_id, int(user_id)):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="会话已失效",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                # 更新会话活动时间
                session_manager.update_session_activity(session_id)
            except ImportError:
                # 如果会话管理器不可用，跳过会话验证
                pass
        
        # 验证用户是否存在且激活
        user = user_crud.get(db, id=int(user_id))
        if not user or not user_crud.is_active(user):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户不存在或未激活",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 创建新的访问令牌
        access_token = self.create_access_token(subject=user_id, session_id=session_id)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": self.access_token_expire_minutes * 60
        }

    def revoke_token(self, token: str) -> bool:
        """撤销令牌（简化版）"""
        try:
            # 解析令牌获取过期时间
            payload = jwt.decode(
                token, self.secret_key, algorithms=[self.algorithm]
            )
            exp_timestamp = payload.get("exp")
            session_id = payload.get("session_id")
            
            # 将令牌加入黑名单（简化版）
            if exp_timestamp:
                expires_at = datetime.fromtimestamp(exp_timestamp)
                self._add_token_to_blacklist(token, expires_at)
            else:
                self._add_token_to_blacklist(token)
            
            # 使会话失效（如果有会话）
            if session_id:
                try:
                    from app.core.session import session_manager
                    session_manager.deactivate_session(session_id)
                except ImportError:
                    # 如果会话管理器不可用，跳过
                    pass
            
            return True
            
        except JWTError:
            # 如果令牌无效，也将其添加到黑名单
            self._add_token_to_blacklist(token)
            return True

    def extract_jwt_token(self, request: Request) -> Optional[str]:
        """从请求中提取JWT令牌"""
        # 首先尝试从Authorization header获取
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            return authorization.split(" ")[1]
        
        # 然后尝试从Cookie获取（备用方案）
        token = request.cookies.get("access_token")
        return token

    def _is_token_blacklisted(self, token: str) -> bool:
        """检查令牌是否在黑名单中（简化版 - 内存存储）"""
        # 简化版本：使用内存存储黑名单
        return hasattr(self, '_blacklist') and token in self._blacklist

    def _add_token_to_blacklist(self, token: str, expires_at: Optional[datetime] = None) -> bool:
        """将令牌添加到黑名单（简化版 - 内存存储）"""
        # 简化版本：使用内存存储黑名单
        if not hasattr(self, '_blacklist'):
            self._blacklist = set()
        self._blacklist.add(token)
        return True


# 创建认证管理器实例
jwt_auth_manager = JWTAuthManager()

# 导出常用函数
create_access_token = jwt_auth_manager.create_access_token
create_refresh_token = jwt_auth_manager.create_refresh_token
verify_token = jwt_auth_manager.verify_token
authenticate_user = jwt_auth_manager.authenticate_user
create_token_pair = jwt_auth_manager.create_token_pair
refresh_access_token = jwt_auth_manager.refresh_access_token
revoke_token = jwt_auth_manager.revoke_token