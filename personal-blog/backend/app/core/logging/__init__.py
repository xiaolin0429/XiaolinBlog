"""
日志模块统一入口
"""
from app.core.logging.config import setup_logging
from app.core.logging.utils import get_logger

__all__ = [
    "setup_logging",
    "get_logger"
]