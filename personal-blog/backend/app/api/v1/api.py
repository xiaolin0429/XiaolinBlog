"""
API v1 主路由
"""
from fastapi import APIRouter
from .endpoints import users, posts, categories, tags, comments, auth, logs, session, image_upload, image_serve, blog_config

api_router = APIRouter()

# 认证相关路由
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])

# 会话管理路由
api_router.include_router(session.router, prefix="/session", tags=["会话管理"])

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

# 图片上传路由
api_router.include_router(image_upload.router, prefix="/image", tags=["图片上传"])

# 图片服务路由
api_router.include_router(image_serve.router, prefix="/image", tags=["图片服务"])

# 博客配置路由
api_router.include_router(blog_config.router, prefix="/blog-config", tags=["博客配置"])