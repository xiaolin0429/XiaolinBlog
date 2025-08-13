"""
文章模型
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.config.database import Base

# 文章标签关联表
post_tags = Table(
    'post_tags',
    Base.metadata,
    Column('post_id', Integer, ForeignKey('posts.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)


class Post(Base):
    """文章表"""
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True, comment="文章标题")
    slug = Column(String(200), unique=True, index=True, nullable=False, comment="URL别名")
    content = Column(Text, nullable=False, comment="文章内容(Markdown)")
    excerpt = Column(Text, nullable=True, comment="文章摘要")
    featured_image = Column(String(255), nullable=True, comment="特色图片URL")
    status = Column(String(20), default="draft", comment="文章状态: draft, published, archived")
    is_featured = Column(Boolean, default=False, comment="是否精选")
    view_count = Column(Integer, default=0, comment="浏览次数")
    like_count = Column(Integer, default=0, comment="点赞次数")
    comment_count = Column(Integer, default=0, comment="评论次数")
    published_at = Column(DateTime(timezone=True), nullable=True, comment="发布时间")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 外键
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="作者ID")
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True, comment="分类ID")

    # 关联关系
    author = relationship("User", back_populates="posts")
    category = relationship("Category", back_populates="posts")
    tags = relationship("Tag", secondary=post_tags, back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Post(id={self.id}, title='{self.title}', status='{self.status}')>"