"""
标签服务类
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagUpdate
from app.services.base import CRUDBase


class CRUDTag(CRUDBase[Tag, TagCreate, TagUpdate]):
    """标签CRUD操作类"""
    
    def get_by_name(self, db: Session, *, name: str) -> Optional[Tag]:
        """根据名称获取标签"""
        return db.query(Tag).filter(Tag.name == name).first()

    def get_by_slug(self, db: Session, *, slug: str) -> Optional[Tag]:
        """根据slug获取标签"""
        return db.query(Tag).filter(Tag.slug == slug).first()

    def get_popular_tags(self, db: Session, *, limit: int = 20) -> List[Tag]:
        """获取热门标签（按文章数量排序）"""
        return (
            db.query(Tag)
            .filter(Tag.post_count > 0)
            .order_by(desc(Tag.post_count))
            .limit(limit)
            .all()
        )

    def increment_post_count(self, db: Session, *, tag_id: int) -> None:
        """增加标签文章数量"""
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        if tag:
            tag.post_count += 1
            db.commit()

    def decrement_post_count(self, db: Session, *, tag_id: int) -> None:
        """减少标签文章数量"""
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        if tag and tag.post_count > 0:
            tag.post_count -= 1
            db.commit()


# 创建标签服务实例
tag_service = CRUDTag(Tag)

# 导出函数
get = tag_service.get
get_multi = tag_service.get_multi
get_by_name = tag_service.get_by_name
get_by_slug = tag_service.get_by_slug
get_popular_tags = tag_service.get_popular_tags
create = tag_service.create
update = tag_service.update
remove = tag_service.remove
increment_post_count = tag_service.increment_post_count
decrement_post_count = tag_service.decrement_post_count