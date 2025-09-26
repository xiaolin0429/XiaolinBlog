"""
FastAPI 主应用入口
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.core.logging.config import setup_logging
from app.core.logging.utils import get_logger
from app.middleware.logging_middleware import LoggingMiddleware
from app.api.v1.api import api_router

# 初始化日志系统
setup_logging()
logger = get_logger('main')

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="个人博客系统后端API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# 配置OpenAPI安全方案
from fastapi.openapi.utils import get_openapi

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # 添加安全方案定义
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT Bearer token authentication. Please enter your JWT token in the format: Bearer <your_jwt_token>"
        },
        "CookieAuth": {
            "type": "apiKey",
            "in": "cookie",
            "name": settings.COOKIE_NAME,
            "description": "Cookie-based authentication"
        }
    }
    
    # 为需要认证的路径添加安全要求
    for path, path_item in openapi_schema["paths"].items():
        for method, operation in path_item.items():
            if method.lower() in ["get", "post", "put", "delete", "patch"]:
                # 检查是否有安全要求
                has_security = "security" in operation and operation["security"]
                
                if has_security:
                    # 替换现有的OAuth2PasswordBearer为我们的安全方案
                    new_security = []
                    for security_item in operation["security"]:
                        if "OAuth2PasswordBearer" in security_item:
                            new_security.append({"BearerAuth": []})
                        elif "BearerAuth" in security_item:
                            new_security.append(security_item)
                        else:
                            new_security.append(security_item)
                    operation["security"] = new_security
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# 设置CORS - 必须在其他中间件之前
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # 移除通配符，明确指定前端域名
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token",
        "Cache-Control",
    ],
    expose_headers=["*"],
    max_age=3600,  # 预检请求缓存时间
)

# 添加日志中间件
app.add_middleware(LoggingMiddleware)

# 应用启动事件
@app.on_event("startup")
async def startup_event():
    """
    应用启动时的初始化操作
    """
    logger.info("🚀 博客系统后端服务启动中...")
    logger.info(f"📝 项目名称: {settings.PROJECT_NAME}")
    logger.info(f"🔢 版本号: {settings.VERSION}")
    logger.info(f"🌐 API前缀: {settings.API_V1_STR}")
    logger.info("✅ 博客系统后端服务启动完成")

# 应用关闭事件
@app.on_event("shutdown")
async def shutdown_event():
    """
    应用关闭时的清理操作
    """
    logger.info("🛑 博客系统后端服务正在关闭...")
    logger.info("✅ 博客系统后端服务已安全关闭")

# 创建上传目录
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
(uploads_dir / "avatars").mkdir(exist_ok=True)

# 挂载静态文件服务
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 包含API路由
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    """
    根路径接口
    """
    logger.info("访问根路径接口")
    return {"message": "个人博客系统API", "version": settings.VERSION}

@app.get("/health")
async def health_check():
    """
    健康检查接口
    """
    return {"status": "healthy", "timestamp": "2025-01-01T00:00:00Z"}
