"""
分类服务类
"""
from typing import Optional
from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.services.base import CRUDBase


class CRUDCategory(CRUDBase[Category, CategoryCreate, CategoryUpdate]):
    """分类CRUD操作类"""
    
    def get_by_name(self, db: Session, *, name: str) -> Optional[Category]:
        """根据名称获取分类"""
        return db.query(Category).filter(Category.name == name).first()

    def get_by_slug(self, db: Session, *, slug: str) -> Optional[Category]:
        """根据slug获取分类"""
        return db.query(Category).filter(Category.slug == slug).first()

    def increment_post_count(self, db: Session, *, category_id: int) -> None:
        """增加分类文章数量"""
        category = db.query(Category).filter(Category.id == category_id).first()
        if category:
            category.post_count += 1
            db.commit()

    def decrement_post_count(self, db: Session, *, category_id: int) -> None:
        """减少分类文章数量"""
        category = db.query(Category).filter(Category.id == category_id).first()
        if category and category.post_count > 0:
            category.post_count -= 1
            db.commit()


# 创建分类服务实例
category_service = CRUDCategory(Category)

# 导出函数
get = category_service.get
get_multi = category_service.get_multi
get_by_name = category_service.get_by_name
get_by_slug = category_service.get_by_slug
create = category_service.create
update = category_service.update
remove = category_service.remove
increment_post_count = category_service.increment_post_count
decrement_post_count = category_service.decrement_post_count