"""
安全相关功能模块
保留密码处理功能
"""
from datetime import datetime
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证密码
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    获取密码哈希值
    """
    return pwd_context.hash(password)


def get_current_timestamp() -> str:
    """
    获取当前时间戳（ISO格式）
    """
    return datetime.utcnow().isoformat()
