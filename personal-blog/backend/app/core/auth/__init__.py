"""
认证模块统一入口
提供简化的认证接口
"""
from app.core.auth.jwt_auth import (
    jwt_auth_manager,
    create_access_token,
    create_refresh_token,
    verify_token,
    authenticate_user,
    create_token_pair,
    refresh_access_token,
    revoke_token
)

from app.core.auth.session_auth import session_manager

from app.core.auth.permissions import (
    permission_manager,
    Permission,
    Role,
    has_permission,
    require_permission,
    check_resource_owner,
    require_resource_owner,
    is_admin,
    is_superuser,
    require_admin,
    require_superuser,
    require_active_user
)

__all__ = [
    # JWT认证
    "jwt_auth_manager",
    "create_access_token",
    "create_refresh_token", 
    "verify_token",
    "authenticate_user",
    "create_token_pair",
    "refresh_access_token",
    "revoke_token",
    
    # 会话管理
    "session_manager",
    
    # 权限管理
    "permission_manager",
    "Permission",
    "Role", 
    "has_permission",
    "require_permission",
    "check_resource_owner",
    "require_resource_owner",
    "is_admin",
    "is_superuser", 
    "require_admin",
    "require_superuser",
    "require_active_user"
]