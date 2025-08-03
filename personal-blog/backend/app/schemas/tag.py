"""
标签相关的Pydantic模式
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class TagBase(BaseModel):
    """标签基础模式"""
    name: str
    slug: str
    color: Optional[str] = None


class TagCreate(TagBase):
    """创建标签模式"""
    pass


class TagUpdate(BaseModel):
    """更新标签模式"""
    name: Optional[str] = None
    slug: Optional[str] = None
    color: Optional[str] = None


class TagInDBBase(TagBase):
    """数据库中的标签基础模式"""
    id: int
    post_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Tag(TagInDBBase):
    """返回给客户端的标签模式"""
    pass


class TagInDB(TagInDBBase):
    """数据库中的标签模式"""
    pass