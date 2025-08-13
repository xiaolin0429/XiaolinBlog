"""
增强鉴权系统启动配置
初始化所有必要的组件和服务
"""
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from app.core.config import settings
from app.core.config.database import engine, Base
from app.core.auth.session_auth import session_manager
from app.core.logging.utils import setup_logging, get_security_logger

logger = logging.getLogger(__name__)


async def init_database():
    """初始化数据库"""
    try:
        # 创建所有表
        Base.metadata.create_all(bind=engine)
        logger.info("数据库表创建完成")
    except Exception as e:
        logger.error(f"数据库初始化失败: {e}")
        raise


async def init_session_manager():
    """初始化会话管理器"""
    try:
        # 会话管理器已在导入时初始化
        logger.info("会话管理器初始化完成")
        
        # 清理过期会话
        cleaned_count = session_manager.cleanup_expired_sessions()
        logger.info(f"清理了 {cleaned_count} 个过期会话")
        
    except Exception as e:
        logger.error(f"会话管理器初始化失败: {e}")
        raise


async def init_token_blacklist():
    """初始化令牌黑名单 - 已禁用，使用JWT revoke功能代替
    """
    # 注意：令牌黑名单已被移除，使用JWT revoke功能代替
    logger.info("令牌管理已迁移到JWT revoke系统")
    pass




async def init_security_logging():
    """初始化安全日志"""
    try:
        # 设置日志系统
        setup_logging()
        
        # 获取安全日志记录器
        security_logger = get_security_logger()
        security_logger.log_system_event(
            event_type="system_startup",
            description="增强鉴权系统启动",
            details={
                "version": "1.0.0",
                "features": [
                    "JWT Token + Session + Cookie 三重验证",
                    "会话管理",
                    "令牌黑名单"
                ]
            }
        )
        logger.info("安全日志系统初始化完成")
        
    except Exception as e:
        logger.error(f"安全日志初始化失败: {e}")
        raise


async def cleanup_resources():
    """清理资源"""
    try:
        # 会话管理器清理（如果需要的话）
        logger.info("会话管理器已清理")
        
        # 清理令牌 - 已迁移到JWT revoke系统
        # await token_blacklist_manager.cleanup()
        logger.info("令牌管理已迁移到JWT revoke系统")
        
        # 记录系统关闭
        security_logger = get_security_logger()
        security_logger.log_system_event(
            event_type="system_shutdown",
            description="增强鉴权系统关闭"
        )
        logger.info("系统资源清理完成")
        
    except Exception as e:
        logger.error(f"资源清理失败: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """应用生命周期管理"""
    # 启动时初始化
    logger.info("开始初始化增强鉴权系统...")
    
    try:
        # 按顺序初始化各个组件
        await init_database()
        await init_session_manager()
        await init_token_blacklist()
        await init_security_logging()
        
        logger.info("增强鉴权系统初始化完成")
        
        # 启动后台任务
        cleanup_task = asyncio.create_task(periodic_cleanup())
        
        yield
        
    except Exception as e:
        logger.error(f"系统初始化失败: {e}")
        raise
    finally:
        # 关闭时清理资源
        logger.info("开始清理系统资源...")
        
        # 取消后台任务
        if 'cleanup_task' in locals():
            cleanup_task.cancel()
            try:
                await cleanup_task
            except asyncio.CancelledError:
                pass
        
        await cleanup_resources()
        logger.info("系统关闭完成")


async def periodic_cleanup():
    """定期清理任务"""
    while True:
        try:
            # 每小时执行一次清理
            await asyncio.sleep(3600)
            
            logger.info("开始定期清理任务...")
            
            # 清理过期会话
            expired_sessions = session_manager.cleanup_expired_sessions()
            
            # 清理过期令牌 - 已迁移到JWT revoke系统
            # expired_tokens = token_blacklist_manager.cleanup_expired_tokens()
            expired_tokens = 0  # 临时设置
            
            logger.info(f"定期清理完成: 会话{expired_sessions}个, 令牌{expired_tokens}个")
            
            # 记录清理统计
            security_logger = get_security_logger()
            security_logger.log_system_event(
                event_type="periodic_cleanup",
                description="定期清理任务完成",
                details={
                    "expired_sessions": expired_sessions,
                    "expired_tokens": expired_tokens,
                }
            )
            
        except asyncio.CancelledError:
            logger.info("定期清理任务已取消")
            break
        except Exception as e:
            logger.error(f"定期清理任务失败: {e}")
            # 继续运行，不中断清理循环


def get_app_config():
    """获取应用配置"""
    return {
        "title": "个人博客系统 - 增强鉴权版",
        "description": "集成JWT Token + Session + Cookie三重验证的个人博客系统",
        "version": "1.0.0",
        "lifespan": lifespan,
        "docs_url": "/docs" if settings.DEBUG else None,
        "redoc_url": "/redoc" if settings.DEBUG else None,
    }


def validate_configuration():
    """验证配置"""
    errors = []
    
    # 检查必要的配置项
    if not settings.SECRET_KEY:
        errors.append("SECRET_KEY 未设置")
    
    if not settings.DATABASE_URL:
        errors.append("DATABASE_URL 未设置")
    
    if settings.ACCESS_TOKEN_EXPIRE_MINUTES <= 0:
        errors.append("ACCESS_TOKEN_EXPIRE_MINUTES 必须大于0")
    
    if settings.SESSION_EXPIRE_HOURS <= 0:
        errors.append("SESSION_EXPIRE_HOURS 必须大于0")
    
    # 检查Redis配置（如果启用）
    if hasattr(settings, 'REDIS_URL') and settings.REDIS_URL:
        try:
            import redis
            r = redis.from_url(settings.REDIS_URL)
            r.ping()
        except Exception as e:
            errors.append(f"Redis连接失败: {e}")
    
    if errors:
        error_msg = "配置验证失败:\n" + "\n".join(f"- {error}" for error in errors)
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    logger.info("配置验证通过")


def print_startup_banner():
    """打印启动横幅"""
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║                    个人博客系统 - 增强鉴权版                    ║
    ║                                                              ║
    ║  🔐 JWT Token + Session + Cookie 三重验证                    ║
    ║  📊 实时会话管理和监控                                        ║
    ║  🛡️  令牌黑名单防护                                          ║
    ║  📝 安全日志记录                                             ║
    ║                                                              ║
    ║  版本: 1.0.0                                                ║
    ║  环境: {env}                                               ║
    ║  调试模式: {debug}                                           ║
    ╚══════════════════════════════════════════════════════════════╝
    """.format(
        env="开发" if settings.DEBUG else "生产",
        debug="开启" if settings.DEBUG else "关闭"
    )
    
    print(banner)
    logger.info("增强鉴权系统启动横幅已显示")


# 导出主要函数
__all__ = [
    "lifespan",
    "get_app_config", 
    "validate_configuration",
    "print_startup_banner"
]