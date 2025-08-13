"""
会话管理兼容性文件
重定向到新的简化会话管理系统
"""
from app.core.auth.session_auth import session_manager

# 保持向后兼容性
SessionManager = session_manager.__class__

# 导出session_manager实例
__all__ = ["session_manager", "SessionManager"]