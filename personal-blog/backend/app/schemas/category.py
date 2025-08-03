"""
分类相关的Pydantic模式
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class CategoryBase(BaseModel):
    """分类基础模式"""
    name: str
    slug: str
    description: Optional[str] = None
    color: Optional[str] = None


class CategoryCreate(CategoryBase):
    """创建分类模式"""
    pass


class CategoryUpdate(BaseModel):
    """更新分类模式"""
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class CategoryInDBBase(CategoryBase):
    """数据库中的分类基础模式"""
    id: int
    post_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Category(CategoryInDBBase):
    """返回给客户端的分类模式"""
    pass


class CategoryInDB(CategoryInDBBase):
    """数据库中的分类模式"""
    pass