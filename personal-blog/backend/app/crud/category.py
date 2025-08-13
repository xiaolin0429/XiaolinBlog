"""
分类CRUD操作
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.crud.base import CRUDBase


class CRUDCategory(CRUDBase[Category, CategoryCreate, CategoryUpdate]):
    """分类CRUD操作类"""
    
    def get_by_name(self, db: Session, *, name: str) -> Optional[Category]:
        """根据名称获取分类"""
        return db.query(Category).filter(Category.name == name).first()

    def get_by_slug(self, db: Session, *, slug: str) -> Optional[Category]:
        """根据slug获取分类"""
        return db.query(Category).filter(Category.slug == slug).first()

    def get_with_post_count(self, db: Session) -> List[Category]:
        """获取分类及其文章数量"""
        from app.models.post import Post
        from sqlalchemy import func
        
        return (
            db.query(
                Category,
                func.count(Post.id).label("post_count")
            )
            .outerjoin(Post)
            .group_by(Category.id)
            .order_by(Category.name)
            .all()
        )

    def get_active_categories(self, db: Session) -> List[Category]:
        """获取有文章的分类"""
        from app.models.post import Post
        from sqlalchemy import and_, exists
        
        return (
            db.query(Category)
            .filter(
                exists().where(
                    and_(
                        Post.category_id == Category.id,
                        Post.is_published == True
                    )
                )
            )
            .order_by(Category.name)
            .all()
        )


# 创建分类CRUD实例
category = CRUDCategory(Category)