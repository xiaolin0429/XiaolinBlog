"""
权限管理模块
"""
from enum import Enum
from typing import List, Optional
from functools import wraps

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User


class Permission(str, Enum):
    """权限枚举"""
    # 用户权限
    USER_READ = "user:read"
    USER_WRITE = "user:write"
    USER_DELETE = "user:delete"
    
    # 文章权限
    POST_READ = "post:read"
    POST_WRITE = "post:write"
    POST_DELETE = "post:delete"
    POST_PUBLISH = "post:publish"
    
    # 评论权限
    COMMENT_READ = "comment:read"
    COMMENT_WRITE = "comment:write"
    COMMENT_DELETE = "comment:delete"
    COMMENT_MODERATE = "comment:moderate"
    
    # 分类和标签权限
    CATEGORY_WRITE = "category:write"
    TAG_WRITE = "tag:write"
    
    # 管理员权限
    ADMIN_ACCESS = "admin:access"
    SYSTEM_CONFIG = "system:config"


class Role(str, Enum):
    """角色枚举"""
    GUEST = "guest"           # 游客
    USER = "user"             # 普通用户
    AUTHOR = "author"         # 作者
    MODERATOR = "moderator"   # 版主
    ADMIN = "admin"           # 管理员
    SUPERUSER = "superuser"   # 超级管理员


# 角色权限映射
ROLE_PERMISSIONS = {
    Role.GUEST: [
        Permission.POST_READ,
        Permission.COMMENT_READ,
    ],
    Role.USER: [
        Permission.POST_READ,
        Permission.COMMENT_READ,
        Permission.COMMENT_WRITE,
        Permission.USER_READ,
    ],
    Role.AUTHOR: [
        Permission.POST_READ,
        Permission.POST_WRITE,
        Permission.COMMENT_READ,
        Permission.COMMENT_WRITE,
        Permission.USER_READ,
        Permission.USER_WRITE,
    ],
    Role.MODERATOR: [
        Permission.POST_READ,
        Permission.POST_WRITE,
        Permission.COMMENT_READ,
        Permission.COMMENT_WRITE,
        Permission.COMMENT_MODERATE,
        Permission.COMMENT_DELETE,
        Permission.USER_READ,
        Permission.USER_WRITE,
    ],
    Role.ADMIN: [
        Permission.POST_READ,
        Permission.POST_WRITE,
        Permission.POST_DELETE,
        Permission.POST_PUBLISH,
        Permission.COMMENT_READ,
        Permission.COMMENT_WRITE,
        Permission.COMMENT_DELETE,
        Permission.COMMENT_MODERATE,
        Permission.USER_READ,
        Permission.USER_WRITE,
        Permission.USER_DELETE,
        Permission.CATEGORY_WRITE,
        Permission.TAG_WRITE,
        Permission.ADMIN_ACCESS,
    ],
    Role.SUPERUSER: [permission for permission in Permission],
}


def get_user_role(user: Optional[User]) -> Role:
    """获取用户角色"""
    if not user:
        return Role.GUEST
    
    if user.is_superuser:
        return Role.SUPERUSER
    
    # 这里可以根据实际需求扩展角色判断逻辑
    # 例如根据用户的特定字段或关联表来判断角色
    if hasattr(user, 'role') and user.role:
        return Role(user.role)
    
    # 默认为普通用户
    return Role.USER


def has_permission(user: Optional[User], permission: Permission) -> bool:
    """检查用户是否有指定权限"""
    user_role = get_user_role(user)
    user_permissions = ROLE_PERMISSIONS.get(user_role, [])
    return permission in user_permissions


def require_permissions(*permissions: Permission):
    """权限装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 从kwargs中获取current_user
            current_user = kwargs.get('current_user')
            
            # 检查权限
            for permission in permissions:
                if not has_permission(current_user, permission):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"权限不足：需要 {permission.value} 权限"
                    )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def check_resource_owner(
    resource_owner_id: int,
    current_user: User,
    required_permission: Optional[Permission] = None
) -> bool:
    """检查资源所有者权限"""
    # 超级用户拥有所有权限
    if current_user.is_superuser:
        return True
    
    # 资源所有者拥有权限
    if resource_owner_id == current_user.id:
        return True
    
    # 检查特定权限
    if required_permission and has_permission(current_user, required_permission):
        return True
    
    return False


def can_edit_post(post_author_id: int, current_user: User) -> bool:
    """检查是否可以编辑文章"""
    return check_resource_owner(
        post_author_id, 
        current_user, 
        Permission.POST_WRITE
    )


def can_delete_post(post_author_id: int, current_user: User) -> bool:
    """检查是否可以删除文章"""
    return check_resource_owner(
        post_author_id, 
        current_user, 
        Permission.POST_DELETE
    )


def can_moderate_comment(current_user: User) -> bool:
    """检查是否可以审核评论"""
    return has_permission(current_user, Permission.COMMENT_MODERATE)


def can_delete_comment(comment_author_id: int, current_user: User) -> bool:
    """检查是否可以删除评论"""
    return check_resource_owner(
        comment_author_id, 
        current_user, 
        Permission.COMMENT_DELETE
    )


def can_access_admin(current_user: User) -> bool:
    """检查是否可以访问管理后台"""
    return has_permission(current_user, Permission.ADMIN_ACCESS)