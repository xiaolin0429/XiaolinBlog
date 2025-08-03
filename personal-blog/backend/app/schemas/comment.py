"""
评论相关的Pydantic模式
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr
from .user import User


class CommentBase(BaseModel):
    """评论基础模式"""
    content: str
    author_name: Optional[str] = None
    author_email: Optional[EmailStr] = None
    author_website: Optional[str] = None


class CommentCreate(CommentBase):
    """创建评论模式"""
    post_id: int
    parent_id: Optional[int] = None


class CommentUpdate(BaseModel):
    """更新评论模式"""
    content: Optional[str] = None
    is_approved: Optional[bool] = None
    is_spam: Optional[bool] = None


class CommentInDBBase(CommentBase):
    """数据库中的评论基础模式"""
    id: int
    post_id: int
    author_id: Optional[int] = None
    parent_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_approved: bool = False
    is_spam: bool = False
    like_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Comment(CommentInDBBase):
    """返回给客户端的评论模式"""
    author: Optional[User] = None
    replies: Optional[List["Comment"]] = []


class CommentInDB(CommentInDBBase):
    """数据库中的评论模式"""
    pass


# 更新前向引用
Comment.model_rebuild()