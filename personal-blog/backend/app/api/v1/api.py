"""
API v1 主路由
"""
from fastapi import APIRouter
from app.api.v1.endpoints import users, posts, categories, tags, comments, auth, logs, site_config, session, heartbeat, cookie_monitor

api_router = APIRouter()

# 认证相关路由
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])

# 会话管理路由
api_router.include_router(session.router, prefix="/session", tags=["会话管理"])

# 心跳检测路由
api_router.include_router(heartbeat.router, prefix="/heartbeat", tags=["心跳检测"])

# Cookie监控路由
api_router.include_router(cookie_monitor.router, prefix="/cookie-monitor", tags=["Cookie监控"])

# 用户相关路由
api_router.include_router(users.router, prefix="/users", tags=["用户"])

# 文章相关路由
api_router.include_router(posts.router, prefix="/posts", tags=["文章"])

# 分类相关路由
api_router.include_router(categories.router, prefix="/categories", tags=["分类"])

# 标签相关路由
api_router.include_router(tags.router, prefix="/tags", tags=["标签"])

# 评论相关路由
api_router.include_router(comments.router, prefix="/comments", tags=["评论"])

# 日志管理路由
api_router.include_router(logs.router, prefix="/logs", tags=["日志管理"])

# 网站配置路由
api_router.include_router(site_config.router, prefix="/site-config", tags=["网站配置"])
