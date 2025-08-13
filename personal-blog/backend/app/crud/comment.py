"""
评论CRUD操作
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func

from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentUpdate
from app.crud.base import CRUDBase


class CRUDComment(CRUDBase[Comment, CommentCreate, CommentUpdate]):
    """评论CRUD操作类"""
    
    def get_by_post(
        self, db: Session, *, post_id: int, skip: int = 0, limit: int = 100
    ) -> List[Comment]:
        """根据文章获取评论"""
        return (
            db.query(Comment)
            .filter(Comment.post_id == post_id)
            .order_by(desc(Comment.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_approved_by_post(
        self, db: Session, *, post_id: int, skip: int = 0, limit: int = 100
    ) -> List[Comment]:
        """根据文章获取已审核的评论"""
        return (
            db.query(Comment)
            .filter(and_(Comment.post_id == post_id, Comment.is_approved == True))
            .order_by(desc(Comment.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_author(
        self, db: Session, *, author_id: int, skip: int = 0, limit: int = 100
    ) -> List[Comment]:
        """根据作者获取评论"""
        return (
            db.query(Comment)
            .filter(Comment.author_id == author_id)
            .order_by(desc(Comment.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_pending_approval(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[Comment]:
        """获取待审核的评论"""
        return (
            db.query(Comment)
            .filter(Comment.is_approved == False)
            .order_by(desc(Comment.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_recent_comments(
        self, db: Session, *, skip: int = 0, limit: int = 10
    ) -> List[Comment]:
        """获取最新评论"""
        return (
            db.query(Comment)
            .filter(Comment.is_approved == True)
            .order_by(desc(Comment.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def approve_comment(self, db: Session, *, comment_id: int) -> Optional[Comment]:
        """审核通过评论"""
        comment = self.get(db, id=comment_id)
        if comment:
            comment.is_approved = True
            db.add(comment)
            db.commit()
            db.refresh(comment)
        return comment

    def reject_comment(self, db: Session, *, comment_id: int) -> Optional[Comment]:
        """拒绝评论"""
        comment = self.get(db, id=comment_id)
        if comment:
            comment.is_approved = False
            db.add(comment)
            db.commit()
            db.refresh(comment)
        return comment

    def get_comment_count_by_post(self, db: Session, *, post_id: int) -> int:
        """获取文章的评论数量"""
        return (
            db.query(func.count(Comment.id))
            .filter(and_(Comment.post_id == post_id, Comment.is_approved == True))
            .scalar()
        )


# 创建评论CRUD实例
comment = CRUDComment(Comment)