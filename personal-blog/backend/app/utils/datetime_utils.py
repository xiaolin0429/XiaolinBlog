"""
时间处理工具
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, Union
import time


def get_current_timestamp() -> float:
    """获取当前时间戳"""
    return time.time()


def get_current_datetime() -> datetime:
    """获取当前UTC时间"""
    return datetime.now(timezone.utc)


def get_current_iso_string() -> str:
    """获取当前时间的ISO格式字符串"""
    return get_current_datetime().isoformat()


def format_datetime(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """格式化时间"""
    return dt.strftime(format_str)


def parse_iso_string(iso_string: str) -> Optional[datetime]:
    """解析ISO格式时间字符串"""
    try:
        return datetime.fromisoformat(iso_string.replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        return None


def time_ago(dt: datetime) -> str:
    """计算相对时间（多久前）"""
    now = get_current_datetime()
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    diff = now - dt
    
    if diff.days > 365:
        years = diff.days // 365
        return f"{years}年前"
    elif diff.days > 30:
        months = diff.days // 30
        return f"{months}个月前"
    elif diff.days > 0:
        return f"{diff.days}天前"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours}小时前"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes}分钟前"
    else:
        return "刚刚"


def add_timezone(dt: datetime, tz: timezone = timezone.utc) -> datetime:
    """为时间添加时区信息"""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=tz)
    return dt


def is_expired(dt: datetime, expire_hours: int = 24) -> bool:
    """检查时间是否过期"""
    now = get_current_datetime()
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    return (now - dt) > timedelta(hours=expire_hours)


def get_date_range(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    days_back: int = 30
) -> tuple[datetime, datetime]:
    """
    获取日期范围
    
    Args:
        start_date: 开始日期
        end_date: 结束日期  
        days_back: 如果没有指定开始日期，往前推几天
        
    Returns:
        tuple: (开始日期, 结束日期)
    """
    now = get_current_datetime()
    
    if end_date is None:
        end_date = now
    
    if start_date is None:
        start_date = now - timedelta(days=days_back)
    
    return start_date, end_date