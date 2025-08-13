"""
权限管理模块
"""
from typing import List, Optional
from enum import Enum

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.crud import user as user_crud


class Permission(str, Enum):
    """权限枚举"""
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    ADMIN = "admin"


class Role(str, Enum):
    """角色枚举"""
    GUEST = "guest"
    USER = "user"
    AUTHOR = "author"
    ADMIN = "admin"
    SUPERUSER = "superuser"


class PermissionManager:
    """权限管理器"""
    
    # 角色权限映射
    ROLE_PERMISSIONS = {
        Role.GUEST: [Permission.READ],
        Role.USER: [Permission.READ, Permission.WRITE],
        Role.AUTHOR: [Permission.READ, Permission.WRITE, Permission.DELETE],
        Role.ADMIN: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN],
        Role.SUPERUSER: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN],
    }

    def get_user_role(self, user: Optional[User]) -> Role:
        """获取用户角色"""
        if not user:
            return Role.GUEST
        
        if user_crud.is_superuser(user):
            return Role.SUPERUSER
        elif hasattr(user, 'is_admin') and user.is_admin:
            return Role.ADMIN
        elif hasattr(user, 'is_author') and user.is_author:
            return Role.AUTHOR
        elif user_crud.is_active(user):
            return Role.USER
        else:
            return Role.GUEST

    def get_user_permissions(self, user: Optional[User]) -> List[Permission]:
        """获取用户权限列表"""
        role = self.get_user_role(user)
        return self.ROLE_PERMISSIONS.get(role, [])

    def has_permission(self, user: Optional[User], permission: Permission) -> bool:
        """检查用户是否有指定权限"""
        user_permissions = self.get_user_permissions(user)
        return permission in user_permissions

    def require_permission(self, user: Optional[User], permission: Permission) -> None:
        """要求用户有指定权限，否则抛出异常"""
        if not self.has_permission(user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"权限不足：需要 {permission.value} 权限"
            )

    def check_resource_owner(
        self, 
        current_user: User, 
        resource_user_id: int,
        allow_admin: bool = True
    ) -> bool:
        """
        检查用户是否为资源所有者
        
        Args:
            current_user: 当前用户
            resource_user_id: 资源所属用户ID
            allow_admin: 是否允许管理员访问
            
        Returns:
            bool: 是否有权限
        """
        # 检查是否为资源所有者
        if current_user.id == resource_user_id:
            return True
        
        # 检查是否为管理员（如果允许）
        if allow_admin and self.has_permission(current_user, Permission.ADMIN):
            return True
        
        return False

    def require_resource_owner(
        self, 
        current_user: User, 
        resource_user_id: int,
        allow_admin: bool = True
    ) -> None:
        """要求用户为资源所有者，否则抛出异常"""
        if not self.check_resource_owner(current_user, resource_user_id, allow_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="权限不足：只能操作自己的资源"
            )

    def is_admin(self, user: Optional[User]) -> bool:
        """检查用户是否为管理员"""
        return self.has_permission(user, Permission.ADMIN)

    def is_superuser(self, user: Optional[User]) -> bool:
        """检查用户是否为超级用户"""
        if not user:
            return False
        return user_crud.is_superuser(user)

    def require_admin(self, user: Optional[User]) -> None:
        """要求管理员权限"""
        self.require_permission(user, Permission.ADMIN)

    def require_superuser(self, user: Optional[User]) -> None:
        """要求超级用户权限"""
        if not self.is_superuser(user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="权限不足：需要超级用户权限"
            )

    def require_active_user(self, user: Optional[User]) -> None:
        """要求激活用户"""
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="未登录"
            )
        
        if not user_crud.is_active(user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="用户未激活"
            )


# 创建权限管理器实例
permission_manager = PermissionManager()

# 导出常用函数
has_permission = permission_manager.has_permission
require_permission = permission_manager.require_permission
check_resource_owner = permission_manager.check_resource_owner
require_resource_owner = permission_manager.require_resource_owner
is_admin = permission_manager.is_admin
is_superuser = permission_manager.is_superuser
require_admin = permission_manager.require_admin
require_superuser = permission_manager.require_superuser
require_active_user = permission_manager.require_active_user