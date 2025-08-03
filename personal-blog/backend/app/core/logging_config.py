"""
日志系统配置
"""
import os
import logging
import logging.config
from pathlib import Path
from typing import Dict, Any

from app.core.config import settings


def get_logging_config() -> Dict[str, Any]:
    """
    获取日志配置
    """
    # 确保日志目录存在
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "[{asctime}] {levelname} in {name}: {message}",
                "style": "{",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "detailed": {
                "format": "[{asctime}] {levelname} {name} {funcName}:{lineno} - {message}",
                "style": "{",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "json": {
                "()": "app.core.formatters.JSONFormatter",
            },
            "access": {
                "format": "{asctime} - {name} - {levelname} - {message}",
                "style": "{",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "filters": {
            "correlation_id": {
                "()": "app.core.filters.CorrelationIdFilter",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": "INFO",
                "formatter": "default",
                "stream": "ext://sys.stdout",
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "DEBUG",
                "formatter": "detailed",
                "filename": "logs/app.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "encoding": "utf8",
            },
            "error_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "ERROR",
                "formatter": "json",
                "filename": "logs/error.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "encoding": "utf8",
            },
            "access_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "INFO",
                "formatter": "access",
                "filename": "logs/access.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 10,
                "encoding": "utf8",
            },
            "security_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "INFO",
                "formatter": "json",
                "filename": "logs/security.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 10,
                "encoding": "utf8",
            },
        },
        "loggers": {
            "app": {
                "level": "DEBUG",
                "handlers": ["console", "file", "error_file"],
                "propagate": False,
            },
            "app.access": {
                "level": "INFO",
                "handlers": ["access_file"],
                "propagate": False,
            },
            "app.security": {
                "level": "INFO",
                "handlers": ["security_file", "console"],
                "propagate": False,
            },
            "app.database": {
                "level": "INFO",
                "handlers": ["file"],
                "propagate": False,
            },
            "uvicorn": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False,
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": ["access_file"],
                "propagate": False,
            },
        },
        "root": {
            "level": "INFO",
            "handlers": ["console", "file"],
        },
    }


def setup_logging():
    """
    设置日志系统
    """
    config = get_logging_config()
    logging.config.dictConfig(config)
    
    # 设置第三方库的日志级别
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
    logging.getLogger("alembic").setLevel(logging.INFO)
    
    # 获取应用日志器
    logger = logging.getLogger("app")
    logger.info("日志系统初始化完成")
    
    return logger