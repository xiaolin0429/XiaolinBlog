"""
增强的认证管理模块
实现JWT Token + Session + Cookie 三重验证机制
"""
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union

from fastapi import HTTPException, status, Request
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import verify_password
from app.core.token_blacklist import is_token_blacklisted, add_token_to_blacklist
from app.core.session import session_manager
from app.models.user import User
from app.services import user_service
import logging

logger = logging.getLogger(__name__)


class AuthManager:
    """增强的认证管理器"""
    
    def __init__(self):
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        self.refresh_token_expire_days = settings.REFRESH_TOKEN_EXPIRE_DAYS

    def create_access_token(
        self, 
        subject: Union[str, Any], 
        session_id: str = None,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        创建访问令牌（支持包含session_id）
        
        Args:
            subject: 用户ID
            session_id: 会话ID（可选，用于增强验证）
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
        session_id: str = None,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        创建刷新令牌（支持包含session_id）
        
        Args:
            subject: 用户ID
            session_id: 会话ID（可选，用于增强验证）
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

    def verify_token(self, token: str, token_type: str = "access") -> Optional[Union[str, Dict[str, Any]]]:
        """
        验证令牌并返回用户ID或载荷信息
        
        Args:
            token: JWT令牌
            token_type: 令牌类型
            
        Returns:
            str|dict: 用户ID（兼容模式）或完整载荷信息（增强模式）
        """
        try:
            # 检查令牌是否在黑名单中
            if is_token_blacklisted(token):
                logger.warning("令牌在黑名单中")
                return None
            
            payload = jwt.decode(
                token, self.secret_key, algorithms=[self.algorithm]
            )
            
            # 检查令牌类型
            if payload.get("type") != token_type:
                logger.warning(f"令牌类型不匹配: expected={token_type}, actual={payload.get('type')}")
                return None
            
            # 如果包含session_id，返回完整载荷信息（增强模式）
            if payload.get("session_id"):
                return {
                    "user_id": payload.get("sub"),
                    "session_id": payload.get("session_id"),
                    "exp": payload.get("exp"),
                    "iat": payload.get("iat")
                }
            
            # 否则返回用户ID（兼容模式）
            return payload.get("sub")
            
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
        user = user_service.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def create_token_pair(self, user_id: int) -> Dict[str, Any]:
        """创建令牌对（访问令牌和刷新令牌）- 兼容模式"""
        access_token = self.create_access_token(subject=user_id)
        refresh_token = self.create_refresh_token(subject=user_id)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": self.access_token_expire_minutes * 60
        }

    def create_token_pair_with_session(
        self, 
        user_id: int, 
        user_agent: str = "",
        ip_address: str = ""
    ) -> Dict[str, Any]:
        """
        创建令牌对和会话（访问令牌、刷新令牌和会话）- 增强模式
        
        Args:
            user_id: 用户ID
            user_agent: 用户代理
            ip_address: IP地址
            
        Returns:
            dict: 包含令牌和会话信息的字典
        """
        # 创建会话
        session_id = session_manager.create_session(
            user_id=user_id,
            user_agent=user_agent,
            ip_address=ip_address
        )
        
        if not session_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="创建会话失败"
            )
        
        # 创建包含session_id的令牌
        access_token = self.create_access_token(subject=user_id, session_id=session_id)
        refresh_token = self.create_refresh_token(subject=user_id, session_id=session_id)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "session_id": session_id,
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
        
        # 处理兼容模式和增强模式
        if isinstance(token_data, dict):
            # 增强模式
            user_id = token_data["user_id"]
            session_id = token_data["session_id"]
            
            # 验证会话是否有效
            if not session_manager.validate_session(session_id, int(user_id)):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="会话已失效",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        else:
            # 兼容模式
            user_id = token_data
            session_id = None
        
        # 验证用户是否存在且激活
        user = user_service.get(db, id=int(user_id))
        if not user or not user_service.is_active(user):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户不存在或未激活",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 创建新的访问令牌
        access_token = self.create_access_token(subject=user_id, session_id=session_id)
        
        # 更新会话活动时间（如果有会话）
        if session_id:
            session_manager.update_session_activity(session_id)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": self.access_token_expire_minutes * 60
        }

    def revoke_token(self, token: str) -> bool:
        """撤销令牌"""
        try:
            # 解析令牌获取过期时间和会话ID
            payload = jwt.decode(
                token, self.secret_key, algorithms=[self.algorithm]
            )
            exp_timestamp = payload.get("exp")
            session_id = payload.get("session_id")
            
            # 将令牌加入黑名单
            if exp_timestamp:
                expires_at = datetime.fromtimestamp(exp_timestamp)
                token_blacklisted = add_token_to_blacklist(token, expires_at)
            else:
                token_blacklisted = add_token_to_blacklist(token)
            
            # 使会话失效（如果有会话）
            session_invalidated = True
            if session_id:
                session_invalidated = session_manager.deactivate_session(session_id)
            
            return token_blacklisted and session_invalidated
            
        except JWTError:
            # 如果令牌无效，也将其添加到黑名单
            return add_token_to_blacklist(token)

    def validate_password_strength(self, password: str) -> bool:
        """验证密码强度"""
        if len(password) < 8:
            return False
        
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        
        return has_upper and has_lower and has_digit

    def triple_verify_authentication(
        self, 
        request: Request, 
        db: Session
    ) -> Optional[User]:
        """
        三重验证认证（JWT + Session + Cookie）
        
        Args:
            request: FastAPI请求对象
            db: 数据库会话
            
        Returns:
            User: 认证成功的用户对象，失败返回None
        """
        try:
            # 1. 提取认证信息
            jwt_token = self._extract_jwt_token(request)
            session_cookie = self._extract_session_cookie(request)
            
            if not jwt_token:
                logger.warning("未找到JWT令牌")
                return None
            
            if not session_cookie:
                logger.warning("未找到会话Cookie")
                return None
            
            # 2. JWT验证
            token_data = self.verify_token(jwt_token)
            if not token_data:
                logger.warning("JWT令牌验证失败")
                return None
            
            # 处理兼容模式和增强模式
            if isinstance(token_data, dict):
                user_id = token_data["user_id"]
                jwt_session_id = token_data["session_id"]
            else:
                # 兼容模式：没有session_id的旧令牌
                user_id = token_data
                jwt_session_id = session_cookie
            
            # 3. Session验证
            if not session_manager.validate_session(jwt_session_id, int(user_id)):
                logger.warning(f"会话验证失败: session_id={jwt_session_id}")
                return None
            
            # 4. Cookie一致性验证
            if session_cookie != jwt_session_id:
                logger.warning(f"Cookie与JWT中的session_id不一致: cookie={session_cookie}, jwt={jwt_session_id}")
                return None
            
            # 5. 获取用户信息
            user = user_service.get(db, id=int(user_id))
            if not user or not user_service.is_active(user):
                logger.warning(f"用户不存在或未激活: user_id={user_id}")
                return None
            
            # 6. 更新会话活动时间
            session_manager.update_session_activity(jwt_session_id)
            
            logger.info(f"三重验证成功: user_id={user_id}, session_id={jwt_session_id}")
            return user
            
        except Exception as e:
            logger.error(f"三重验证过程中发生错误: {e}")
            return None

    def logout_user(self, request: Request) -> bool:
        """
        用户登出，清理所有认证信息
        
        Args:
            request: FastAPI请求对象
            
        Returns:
            bool: 登出是否成功
        """
        try:
            # 提取认证信息
            jwt_token = self._extract_jwt_token(request)
            session_cookie = self._extract_session_cookie(request)
            
            success = True
            
            # 撤销JWT令牌
            if jwt_token:
                if not self.revoke_token(jwt_token):
                    success = False
                    logger.warning("撤销JWT令牌失败")
            
            # 使会话失效
            if session_cookie:
                if not session_manager.deactivate_session(session_cookie):
                    success = False
                    logger.warning("使会话失效失败")
            
            return success
            
        except Exception as e:
            logger.error(f"用户登出过程中发生错误: {e}")
            return False

    def _extract_jwt_token(self, request: Request) -> Optional[str]:
        """从请求中提取JWT令牌"""
        # 首先尝试从Authorization header获取
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            return authorization.split(" ")[1]
        
        # 然后尝试从Cookie获取（备用方案）
        token = request.cookies.get("access_token")
        return token

    def _extract_session_cookie(self, request: Request) -> Optional[str]:
        """从请求中提取会话Cookie"""
        return request.cookies.get(getattr(settings, 'COOKIE_NAME', 'session_id'))

    def _get_client_ip(self, request: Request) -> str:
        """获取客户端IP地址"""
        forwarded_for = request.headers.get('X-Forwarded-For')
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()
        
        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"


# 创建认证管理器实例
auth_manager = AuthManager()

# 导出常用函数（兼容模式）
create_access_token = auth_manager.create_access_token
create_refresh_token = auth_manager.create_refresh_token
verify_token = auth_manager.verify_token
authenticate_user = auth_manager.authenticate_user
create_token_pair = auth_manager.create_token_pair
refresh_access_token = auth_manager.refresh_access_token
revoke_token = auth_manager.revoke_token
validate_password_strength = auth_manager.validate_password_strength

# 导出增强功能函数
create_token_pair_with_session = auth_manager.create_token_pair_with_session
triple_verify_authentication = auth_manager.triple_verify_authentication
logout_user = auth_manager.logout_user
