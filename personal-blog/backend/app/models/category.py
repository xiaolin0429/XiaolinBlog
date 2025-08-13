"""
分类模型
"""
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.config.database import Base


class Category(Base):
    """分类表"""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True, comment="分类名称")
    slug = Column(String(100), unique=True, nullable=False, index=True, comment="URL别名")
    description = Column(Text, nullable=True, comment="分类描述")
    color = Column(String(7), nullable=True, comment="分类颜色(HEX)")
    post_count = Column(Integer, default=0, comment="文章数量")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关联关系
    posts = relationship("Post", back_populates="category")

    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}', post_count={self.post_count})>"