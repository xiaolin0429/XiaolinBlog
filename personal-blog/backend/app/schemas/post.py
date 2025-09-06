"""
文章相关的Pydantic模式
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from .user import User
from .category import Category
from .tag import Tag


class PostBase(BaseModel):
    """文章基础模式"""
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    status: str = "draft"  # draft, published, archived
    is_featured: bool = False
    content_format: str = "html"  # html, markdown


class PostCreate(PostBase):
    """创建文章模式"""
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = []


class PostUpdate(BaseModel):
    """更新文章模式"""
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    status: Optional[str] = None
    is_featured: Optional[bool] = None
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None
    content_format: Optional[str] = None


class PostInDBBase(PostBase):
    """数据库中的文章基础模式"""
    id: int
    author_id: int
    category_id: Optional[int] = None
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Post(PostInDBBase):
    """返回给客户端的文章模式"""
    author: Optional[User] = None
    category: Optional[Category] = None
    tags: Optional[List[Tag]] = []


class PostInDB(PostInDBBase):
    """数据库中的文章模式"""
    pass


class PostList(BaseModel):
    """文章列表模式"""
    id: int
    title: str
    slug: str
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    status: str
    is_featured: bool
    view_count: int
    like_count: int
    comment_count: int
    published_at: Optional[datetime] = None
    created_at: datetime
    author: Optional[User] = None
    category: Optional[Category] = None
    tags: Optional[List[Tag]] = []

    class Config:
        from_attributes = True