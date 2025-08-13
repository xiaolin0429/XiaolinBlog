"""
统一的API依赖注入模块
合并了原有deps.py和enhanced_deps.py的功能
"""
from typing import Generator, Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.core.config.database import SessionLocal
from app.models.user import User
from app.services import user_service
from app.services.user_service import get as get_user, is_active, is_superuser

# OAuth2 Bearer token scheme for Swagger documentation
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,  # 允许从Cookie获取token时不报错
    scheme_name="BearerAuth"  # 使用自定义的方案名称
)

# HTTP Bearer scheme for better Swagger integration
http_bearer = HTTPBearer(auto_error=False)


def get_token_from_request(request: Request) -> Optional[str]:
    """
    从请求中获取token，优先从Authorization header，其次从Cookie
    """
    # 首先尝试从Authorization header获取
    authorization = request.headers.get("Authorization")
    if authorization and authorization.startswith("Bearer "):
        return authorization.split(" ")[1]
    
    # 然后尝试从Cookie获取
    token = request.cookies.get(settings.COOKIE_NAME)
    return token


def get_db() -> Generator:
    """获取数据库会话"""
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    """获取当前用户 - 支持JWT + Session双重验证"""
    # 优先使用OAuth2PasswordBearer提供的token（用于Swagger文档）
    if not token:
        token = get_token_from_request(request)
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证凭据",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = payload.get("sub")
        
        # 如果令牌包含session_id，进行会话验证
        session_id = payload.get("session_id")
        if session_id:
            from app.core.session import session_manager
            if not session_manager.validate_session(session_id, int(token_data)):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="会话已失效",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            # 更新会话活动时间
            session_manager.update_session_activity(session_id)
            
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无法验证凭据",
        )
    
    user = get_user(db, id=token_data)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """获取当前激活用户"""
    if not is_active(current_user):
        raise HTTPException(status_code=400, detail="用户未激活")
    return current_user


def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """获取当前激活的超级用户"""
    if not is_superuser(current_user):
        raise HTTPException(
            status_code=400, detail="权限不足"
        )
    return current_user


def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """获取当前用户（可选，用于评论等功能）"""
    token = get_token_from_request(request)
    if not token:
        return None
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = payload.get("sub")
        if not token_data:
            return None
        user = get_user(db, id=token_data)
        return user
    except (jwt.JWTError, ValidationError):
        return None


def check_post_owner(
    post_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> User:
    """检查文章所有者权限"""
    from app.services import post_service
    
    post = post_service.get(db, id=post_id)
    if not post:
        raise HTTPException(status_code=404, detail="文章不存在")
    
    if post.author_id != current_user.id and not is_superuser(current_user):
        raise HTTPException(status_code=403, detail="权限不足")
    
    return current_user


def check_comment_owner(
    comment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> User:
    """检查评论所有者权限"""
    from app.services import comment_service
    
    comment = comment_service.get(db, id=comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")
    
    if comment.author_id != current_user.id and not is_superuser(current_user):
        raise HTTPException(status_code=403, detail="权限不足")
    
    return current_user


def validate_session_dependency(
    request: Request,
    db: Session = Depends(get_db)
) -> dict:
    """
    会话验证依赖（用于需要验证会话但不需要用户信息的场景）
    
    Args:
        request: FastAPI请求对象
        db: 数据库会话
        
    Returns:
        dict: 包含会话信息的字典
        
    Raises:
        HTTPException: 会话验证失败时抛出401异常
    """
    from app.core.session import session_manager
    
    # 提取会话Cookie
    session_cookie = request.cookies.get(settings.COOKIE_NAME)
    
    if not session_cookie:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未找到会话Cookie"
        )
    
    # 验证会话
    if not session_manager.validate_session(session_cookie):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="会话无效"
        )
    
    # 获取会话信息
    session_info = session_manager.get_session_info(session_cookie)
    if not session_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无法获取会话信息"
        )
    
    return session_info


def require_valid_session(
    session_info: dict = Depends(validate_session_dependency)
) -> dict:
    """
    要求有效会话的依赖
    
    Args:
        session_info: 会话信息
        
    Returns:
        dict: 会话信息
    """
    return session_info