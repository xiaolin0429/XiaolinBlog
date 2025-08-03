"""
增强的API依赖注入模块
实现三重验证机制（JWT + Session + Cookie）
"""
from typing import Generator, Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.auth import auth_manager
from app.models.user import User
from app.services import user_service

# OAuth2 Bearer token scheme for Swagger documentation
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"/api/v1/auth/login",
    auto_error=False,
    scheme_name="EnhancedBearerAuth"
)

# HTTP Bearer scheme for better Swagger integration
http_bearer = HTTPBearer(auto_error=False)


def get_db() -> Generator:
    """获取数据库会话"""
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()


def get_current_user_enhanced(
    request: Request,
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    """
    获取当前用户（使用增强的三重验证）
    
    Args:
        request: FastAPI请求对象
        db: 数据库会话
        token: OAuth2令牌（用于Swagger文档）
        
    Returns:
        User: 认证成功的用户对象
        
    Raises:
        HTTPException: 认证失败时抛出401或403异常
    """
    user = auth_manager.triple_verify_authentication(request, db)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="认证失败：JWT令牌、会话或Cookie验证失败",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def get_current_active_user_enhanced(
    current_user: User = Depends(get_current_user_enhanced),
) -> User:
    """获取当前激活用户（使用增强验证）"""
    if not user_service.is_active(current_user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="用户未激活"
        )
    return current_user


def get_current_active_superuser_enhanced(
    current_user: User = Depends(get_current_user_enhanced),
) -> User:
    """获取当前激活的超级用户（使用增强验证）"""
    if not user_service.is_superuser(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="权限不足：需要超级用户权限"
        )
    return current_user


def get_current_user_optional_enhanced(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    获取当前用户（可选，用于评论等功能，使用增强验证）
    
    Args:
        request: FastAPI请求对象
        db: 数据库会话
        
    Returns:
        Optional[User]: 认证成功的用户对象，失败返回None
    """
    try:
        return auth_manager.triple_verify_authentication(request, db)
    except Exception:
        return None


def check_post_owner_enhanced(
    post_id: int,
    current_user: User = Depends(get_current_active_user_enhanced),
    db: Session = Depends(get_db)
) -> User:
    """检查文章所有者权限（使用增强验证）"""
    from app.services import post_service
    
    post = post_service.get(db, id=post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="文章不存在"
        )
    
    if post.author_id != current_user.id and not user_service.is_superuser(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="权限不足：只能操作自己的文章"
        )
    
    return current_user


def check_comment_owner_enhanced(
    comment_id: int,
    current_user: User = Depends(get_current_active_user_enhanced),
    db: Session = Depends(get_db)
) -> User:
    """检查评论所有者权限（使用增强验证）"""
    from app.services import comment_service
    
    comment = comment_service.get(db, id=comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="评论不存在"
        )
    
    if comment.author_id != current_user.id and not user_service.is_superuser(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="权限不足：只能操作自己的评论"
        )
    
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
    session_cookie = request.cookies.get("blog_auth_session")  # 使用配置中的Cookie名称
    
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


# 兼容性函数，逐步迁移时使用
def get_current_user_legacy(
    request: Request,
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    """
    获取当前用户（兼容旧版本的依赖注入）
    在迁移期间提供向后兼容性
    """
    # 首先尝试使用增强验证
    try:
        user = auth_manager.triple_verify_authentication(request, db)
        if user:
            return user
    except Exception:
        pass
    
    # 如果增强验证失败，回退到原有验证方式
    from app.api.v1.endpoints.deps import get_current_user as legacy_get_current_user
    return legacy_get_current_user(request, db, token)


# 导出增强版本的依赖函数
get_current_user = get_current_user_enhanced
get_current_active_user = get_current_active_user_enhanced
get_current_active_superuser = get_current_active_superuser_enhanced
get_current_user_optional = get_current_user_optional_enhanced
check_post_owner = check_post_owner_enhanced
check_comment_owner = check_comment_owner_enhanced