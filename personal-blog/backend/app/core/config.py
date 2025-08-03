"""
应用配置设置
"""
import os
from typing import List, Optional
from pydantic import validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # 项目基本信息
    PROJECT_NAME: str = "个人博客系统"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # 服务器配置
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8000
    
    # 数据库配置
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "blog_user")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "blog_password")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "blog_db")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    
    # Redis配置
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    
    # JWT配置
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Cookie配置
    COOKIE_NAME: str = "blog_auth_session"  # 会话Cookie名称
    COOKIE_MAX_AGE: int = 24 * 60 * 60  # 24小时（秒）
    COOKIE_DOMAIN: Optional[str] = None  # 生产环境中设置为实际域名
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"  # HTTPS环境设为True
    COOKIE_HTTPONLY: bool = True
    COOKIE_SAMESITE: str = "lax"  # lax, strict, none
    
    # 会话管理配置
    SESSION_EXPIRE_SECONDS: int = 24 * 60 * 60  # 会话过期时间（24小时）
    SESSION_ACTIVITY_TIMEOUT: int = 30 * 60  # 会话活动超时时间（30分钟）
    SESSION_CLEANUP_INTERVAL: int = 60 * 60  # 会话清理间隔（1小时）
    
    # 心跳检测配置
    HEARTBEAT_INTERVAL: int = 5 * 60  # 心跳间隔（5分钟）
    HEARTBEAT_TIMEOUT: int = 10  # 心跳超时（10秒）
    HEARTBEAT_MAX_RETRIES: int = 3  # 心跳最大重试次数
    
    # CORS配置 - 添加更多可能的前端地址
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        # 添加可能的开发环境地址
        "http://0.0.0.0:3000",
        "http://0.0.0.0:3001",
    ]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # 数据库URL
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # Redis URL
    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    # Celery配置
    CELERY_BROKER_URL: str = f"redis://{os.getenv('REDIS_HOST', 'localhost')}:{os.getenv('REDIS_PORT', '6379')}/1"
    CELERY_RESULT_BACKEND: str = f"redis://{os.getenv('REDIS_HOST', 'localhost')}:{os.getenv('REDIS_PORT', '6379')}/2"
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
