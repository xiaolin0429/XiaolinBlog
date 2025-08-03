"""
评论模型
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Comment(Base):
    """评论表"""
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False, comment="评论内容")
    author_name = Column(String(100), nullable=True, comment="访客姓名")
    author_email = Column(String(100), nullable=True, comment="访客邮箱")
    author_website = Column(String(255), nullable=True, comment="访客网站")
    ip_address = Column(String(45), nullable=True, comment="IP地址")
    user_agent = Column(String(500), nullable=True, comment="用户代理")
    is_approved = Column(Boolean, default=False, comment="是否已审核")
    is_spam = Column(Boolean, default=False, comment="是否垃圾评论")
    like_count = Column(Integer, default=0, comment="点赞次数")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 外键
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False, comment="文章ID")
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True, comment="用户ID(注册用户)")
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True, comment="父评论ID")

    # 关联关系
    post = relationship("Post", back_populates="comments")
    author = relationship("User", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")

    def __repr__(self):
        return f"<Comment(id={self.id}, post_id={self.post_id}, is_approved={self.is_approved})>"