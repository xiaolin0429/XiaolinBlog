"""
用户相关的Pydantic模式
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """用户基础模式"""
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False


class UserCreate(UserBase):
    """创建用户模式"""
    password: str


class UserUpdate(BaseModel):
    """更新用户模式"""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    password: Optional[str] = None


class UserInDBBase(UserBase):
    """数据库中的用户基础模式"""
    id: int
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class User(UserInDBBase):
    """返回给客户端的用户模式"""
    pass


class UserInDB(UserInDBBase):
    """数据库中的用户模式（包含密码哈希）"""
    hashed_password: str


class UserLogin(BaseModel):
    """用户登录请求模式"""
    username: str  # 可以是用户名或邮箱
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "admin",
                "password": "admin123"
            }
        }
