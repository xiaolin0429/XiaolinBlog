"""
数据验证工具
"""
import re
from typing import Any, Optional, List, Dict
from email_validator import validate_email, EmailNotValidError


def is_valid_email(email: str) -> bool:
    """验证邮箱地址是否有效"""
    try:
        validate_email(email)
        return True
    except EmailNotValidError:
        return False


def is_valid_username(username: str) -> bool:
    """
    验证用户名是否有效
    规则：3-20个字符，只能包含字母、数字、下划线、连字符
    """
    if not username or len(username) < 3 or len(username) > 20:
        return False
    
    pattern = r'^[a-zA-Z0-9_-]+$'
    return bool(re.match(pattern, username))


def is_valid_password(password: str) -> bool:
    """
    验证密码强度
    规则：至少8个字符，包含大小写字母和数字
    """
    if not password or len(password) < 8:
        return False
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)  
    has_digit = any(c.isdigit() for c in password)
    
    return has_upper and has_lower and has_digit


def is_valid_phone(phone: str) -> bool:
    """验证手机号码"""
    pattern = r'^1[3-9]\d{9}$'
    return bool(re.match(pattern, phone))


def is_valid_url(url: str) -> bool:
    """验证URL是否有效"""
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    return bool(url_pattern.match(url))


def is_valid_slug(slug: str) -> bool:
    """
    验证URL slug是否有效
    规则：只能包含小写字母、数字、连字符
    """
    if not slug:
        return False
    
    pattern = r'^[a-z0-9-]+$'
    return bool(re.match(pattern, slug))


def sanitize_html(text: str) -> str:
    """简单的HTML标签清理"""
    import html
    
    # 转义HTML特殊字符
    text = html.escape(text)
    
    # 移除常见的危险标签
    dangerous_tags = ['<script', '<iframe', '<object', '<embed', '<form']
    for tag in dangerous_tags:
        text = text.replace(tag.lower(), '').replace(tag.upper(), '')
    
    return text


def validate_json_schema(data: Any, schema: Dict) -> List[str]:
    """
    简单的JSON schema验证
    
    Returns:
        List[str]: 验证错误列表
    """
    errors = []
    
    if not isinstance(data, dict):
        errors.append("数据必须是对象类型")
        return errors
    
    # 检查必需字段
    required = schema.get('required', [])
    for field in required:
        if field not in data:
            errors.append(f"缺少必需字段: {field}")
    
    # 检查字段类型
    properties = schema.get('properties', {})
    for field, field_schema in properties.items():
        if field in data:
            field_type = field_schema.get('type')
            value = data[field]
            
            if field_type == 'string' and not isinstance(value, str):
                errors.append(f"字段 {field} 必须是字符串类型")
            elif field_type == 'integer' and not isinstance(value, int):
                errors.append(f"字段 {field} 必须是整数类型")
            elif field_type == 'boolean' and not isinstance(value, bool):
                errors.append(f"字段 {field} 必须是布尔类型")
            elif field_type == 'array' and not isinstance(value, list):
                errors.append(f"字段 {field} 必须是数组类型")
    
    return errors


def clean_string(text: str, max_length: Optional[int] = None) -> str:
    """清理字符串"""
    if not isinstance(text, str):
        return ""
    
    # 去除首尾空白
    text = text.strip()
    
    # 替换多个连续空白为单个空格
    text = re.sub(r'\s+', ' ', text)
    
    # 截断长度
    if max_length and len(text) > max_length:
        text = text[:max_length].strip()
    
    return text


def is_safe_filename(filename: str) -> bool:
    """检查文件名是否安全"""
    if not filename:
        return False
    
    # 检查危险字符
    dangerous_chars = ['/', '\\', '..', '<', '>', ':', '"', '|', '?', '*']
    for char in dangerous_chars:
        if char in filename:
            return False
    
    # 检查文件名长度
    if len(filename) > 255:
        return False
    
    return True