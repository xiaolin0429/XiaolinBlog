"""
标签CRUD操作
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagUpdate
from app.crud.base import CRUDBase


class CRUDTag(CRUDBase[Tag, TagCreate, TagUpdate]):
    """标签CRUD操作类"""
    
    def get_by_name(self, db: Session, *, name: str) -> Optional[Tag]:
        """根据名称获取标签"""
        return db.query(Tag).filter(Tag.name == name).first()

    def get_by_slug(self, db: Session, *, slug: str) -> Optional[Tag]:
        """根据slug获取标签"""
        return db.query(Tag).filter(Tag.slug == slug).first()

    def get_with_post_count(self, db: Session) -> List[Tag]:
        """获取标签及其文章数量"""
        from app.models.post import Post
        from sqlalchemy import func
        
        # 由于标签和文章是多对多关系，需要通过关联表查询
        return (
            db.query(
                Tag,
                func.count(Post.id).label("post_count")
            )
            .outerjoin(Tag.posts)
            .group_by(Tag.id)
            .order_by(Tag.name)
            .all()
        )

    def get_active_tags(self, db: Session) -> List[Tag]:
        """获取有文章的标签"""
        from app.models.post import Post
        from sqlalchemy import and_, exists
        
        return (
            db.query(Tag)
            .filter(
                exists().where(
                    and_(
                        Tag.posts.any(Post.id != None),
                        Tag.posts.any(Post.is_published == True)
                    )
                )
            )
            .order_by(Tag.name)
            .all()
        )

    def get_popular_tags(self, db: Session, *, limit: int = 20) -> List[Tag]:
        """获取热门标签"""
        from app.models.post import Post
        from sqlalchemy import func, desc
        
        return (
            db.query(Tag)
            .join(Tag.posts)
            .filter(Post.is_published == True)
            .group_by(Tag.id)
            .order_by(desc(func.count(Post.id)))
            .limit(limit)
            .all()
        )


# 创建标签CRUD实例
tag = CRUDTag(Tag)