"""
文章CRUD操作
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func

from app.models.post import Post
from app.schemas.post import PostCreate, PostUpdate
from app.crud.base import CRUDBase


class CRUDPost(CRUDBase[Post, PostCreate, PostUpdate]):
    """文章CRUD操作类"""
    
    def get_by_slug(self, db: Session, *, slug: str) -> Optional[Post]:
        """根据slug获取文章"""
        return db.query(Post).filter(Post.slug == slug).first()

    def get_published(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Post]:
        """获取已发布的文章"""
        return (
            db.query(Post)
            .filter(Post.is_published == True)
            .order_by(desc(Post.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_category(
        self, db: Session, *, category_id: int, skip: int = 0, limit: int = 100
    ) -> List[Post]:
        """根据分类获取文章"""
        return (
            db.query(Post)
            .filter(and_(Post.category_id == category_id, Post.is_published == True))
            .order_by(desc(Post.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_author(
        self, db: Session, *, author_id: int, skip: int = 0, limit: int = 100
    ) -> List[Post]:
        """根据作者获取文章"""
        return (
            db.query(Post)
            .filter(Post.author_id == author_id)
            .order_by(desc(Post.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def search_posts(
        self, db: Session, *, query: str, skip: int = 0, limit: int = 100
    ) -> List[Post]:
        """搜索文章"""
        return (
            db.query(Post)
            .filter(
                and_(
                    Post.is_published == True,
                    Post.title.contains(query) | Post.content.contains(query)
                )
            )
            .order_by(desc(Post.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_popular_posts(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[Post]:
        """获取热门文章"""
        return (
            db.query(Post)
            .filter(Post.is_published == True)
            .order_by(desc(Post.view_count))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def increment_views(self, db: Session, *, post_id: int) -> bool:
        """增加文章浏览量"""
        post = self.get(db, id=post_id)
        if not post:
            return False
        
        try:
            post.view_count = (post.view_count or 0) + 1
            db.add(post)
            db.commit()
            db.refresh(post)
            return True
        except Exception as e:
            db.rollback()
            raise e


# 创建文章CRUD实例
post = CRUDPost(Post)