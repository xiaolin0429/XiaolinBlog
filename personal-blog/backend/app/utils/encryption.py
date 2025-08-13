"""
加密工具
"""
import hashlib
import secrets
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from typing import Union, Tuple


def generate_salt(length: int = 32) -> str:
    """生成随机盐值"""
    return secrets.token_hex(length)


def generate_secret_key() -> str:
    """生成密钥"""
    return secrets.token_urlsafe(32)


def hash_password(password: str, salt: str = None) -> Tuple[str, str]:
    """
    哈希密码
    
    Returns:
        Tuple[str, str]: (哈希值, 盐值)
    """
    if salt is None:
        salt = generate_salt()
    
    # 使用PBKDF2进行密码哈希
    password_bytes = password.encode('utf-8')
    salt_bytes = salt.encode('utf-8')
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt_bytes,
        iterations=100000,
    )
    
    key = kdf.derive(password_bytes)
    hash_value = base64.urlsafe_b64encode(key).decode('utf-8')
    
    return hash_value, salt


def verify_password(password: str, hash_value: str, salt: str) -> bool:
    """验证密码"""
    try:
        new_hash, _ = hash_password(password, salt)
        return secrets.compare_digest(hash_value, new_hash)
    except Exception:
        return False


def generate_token(length: int = 32) -> str:
    """生成安全令牌"""
    return secrets.token_urlsafe(length)


def generate_api_key(length: int = 40) -> str:
    """生成API密钥"""
    return secrets.token_hex(length)


def encrypt_string(text: str, key: Union[str, bytes]) -> str:
    """加密字符串"""
    if isinstance(key, str):
        key = key.encode()
    
    # 使用密钥生成Fernet实例
    if len(key) != 32:
        # 如果密钥长度不是32字节，使用哈希生成
        key = hashlib.sha256(key).digest()
    
    f = Fernet(base64.urlsafe_b64encode(key))
    encrypted = f.encrypt(text.encode('utf-8'))
    return base64.urlsafe_b64encode(encrypted).decode('utf-8')


def decrypt_string(encrypted_text: str, key: Union[str, bytes]) -> str:
    """解密字符串"""
    if isinstance(key, str):
        key = key.encode()
    
    if len(key) != 32:
        key = hashlib.sha256(key).digest()
    
    try:
        f = Fernet(base64.urlsafe_b64encode(key))
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_text.encode('utf-8'))
        decrypted = f.decrypt(encrypted_bytes)
        return decrypted.decode('utf-8')
    except Exception:
        raise ValueError("解密失败")


def hash_string(text: str, algorithm: str = 'sha256') -> str:
    """哈希字符串"""
    text_bytes = text.encode('utf-8')
    
    if algorithm == 'md5':
        return hashlib.md5(text_bytes).hexdigest()
    elif algorithm == 'sha1':
        return hashlib.sha1(text_bytes).hexdigest()
    elif algorithm == 'sha256':
        return hashlib.sha256(text_bytes).hexdigest()
    elif algorithm == 'sha512':
        return hashlib.sha512(text_bytes).hexdigest()
    else:
        raise ValueError(f"不支持的哈希算法: {algorithm}")


def generate_uuid() -> str:
    """生成UUID"""
    import uuid
    return str(uuid.uuid4())


def generate_short_id(length: int = 8) -> str:
    """生成短ID"""
    import string
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def constant_time_compare(a: str, b: str) -> bool:
    """常量时间比较，防止时序攻击"""
    return secrets.compare_digest(a, b)


def encode_base64(data: Union[str, bytes]) -> str:
    """Base64编码"""
    if isinstance(data, str):
        data = data.encode('utf-8')
    return base64.b64encode(data).decode('utf-8')


def decode_base64(encoded: str) -> str:
    """Base64解码"""
    try:
        decoded_bytes = base64.b64decode(encoded)
        return decoded_bytes.decode('utf-8')
    except Exception:
        raise ValueError("Base64解码失败")


def generate_csrf_token() -> str:
    """生成CSRF令牌"""
    return generate_token(32)


def create_signature(data: str, secret: str) -> str:
    """创建HMAC签名"""
    import hmac
    
    signature = hmac.new(
        secret.encode('utf-8'),
        data.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return signature


def verify_signature(data: str, signature: str, secret: str) -> bool:
    """验证HMAC签名"""
    expected = create_signature(data, secret)
    return constant_time_compare(signature, expected)