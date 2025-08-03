"""
评论服务类
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentUpdate
from app.services.base import CRUDBase


class CRUDComment(CRUDBase[Comment, CommentCreate, CommentUpdate]):
    """评论CRUD操作类"""
    
    def create_with_metadata(
        self,
        db: Session,
        *,
        obj_in: CommentCreate,
        author_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Comment:
        """创建评论（包含元数据）"""
        obj_in_data = obj_in.dict()
        
        # 判断是否自动审核通过
        # 只有管理员用户发布的评论才自动审核通过，普通用户需要审核
        is_approved = False
        if author_id:
            # 获取用户信息判断是否为管理员
            from app.models.user import User
            user = db.query(User).filter(User.id == author_id).first()
            if user and user.is_superuser:
                is_approved = True
        
        db_obj = Comment(
            **obj_in_data,
            author_id=author_id,
            ip_address=ip_address,
            user_agent=user_agent,
            is_approved=is_approved
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_with_filters(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 20,
        post_id: Optional[int] = None,
        is_approved: Optional[bool] = None
    ) -> List[Comment]:
        """根据条件筛选评论"""
        query = db.query(Comment)
        
        if post_id:
            query = query.filter(Comment.post_id == post_id)
        
        if is_approved is not None:
            query = query.filter(Comment.is_approved == is_approved)
        
        return query.order_by(desc(Comment.created_at)).offset(skip).limit(limit).all()

    def get_comments_by_post(
        self, db: Session, *, post_id: int, skip: int = 0, limit: int = 50
    ) -> List[Comment]:
        """获取指定文章的评论（仅已审核通过的）"""
        return (
            db.query(Comment)
            .filter(and_(Comment.post_id == post_id, Comment.is_approved == True))
            .order_by(Comment.created_at)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_pending_comments(
        self, db: Session, *, skip: int = 0, limit: int = 20
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

    def approve_comment(self, db: Session, *, comment_id: int) -> None:
        """审核通过评论"""
        comment = db.query(Comment).filter(Comment.id == comment_id).first()
        if comment:
            comment.is_approved = True
            comment.is_spam = False
            db.commit()

    def reject_comment(self, db: Session, *, comment_id: int) -> None:
        """拒绝评论"""
        comment = db.query(Comment).filter(Comment.id == comment_id).first()
        if comment:
            comment.is_approved = False
            db.commit()

    def mark_as_spam(self, db: Session, *, comment_id: int) -> None:
        """标记为垃圾评论"""
        comment = db.query(Comment).filter(Comment.id == comment_id).first()
        if comment:
            comment.is_spam = True
            comment.is_approved = False
            db.commit()

    def increment_like_count(self, db: Session, *, comment_id: int) -> None:
        """增加评论点赞次数"""
        comment = db.query(Comment).filter(Comment.id == comment_id).first()
        if comment:
            comment.like_count += 1
            db.commit()

    def get_replies(self, db: Session, *, parent_id: int) -> List[Comment]:
        """获取评论的回复"""
        return (
            db.query(Comment)
            .filter(and_(Comment.parent_id == parent_id, Comment.is_approved == True))
            .order_by(Comment.created_at)
            .all()
        )

    def get_recent_comments(
        self, db: Session, *, limit: int = 10
    ) -> List[Comment]:
        """获取最新评论"""
        return (
            db.query(Comment)
            .filter(Comment.is_approved == True)
            .order_by(desc(Comment.created_at))
            .limit(limit)
            .all()
        )


# 创建评论服务实例
comment_service = CRUDComment(Comment)

# 导出函数
get = comment_service.get
get_multi = comment_service.get_multi
get_multi_with_filters = comment_service.get_multi_with_filters
get_comments_by_post = comment_service.get_comments_by_post
get_pending_comments = comment_service.get_pending_comments
get_replies = comment_service.get_replies
get_recent_comments = comment_service.get_recent_comments
create = comment_service.create
create_with_metadata = comment_service.create_with_metadata
update = comment_service.update
remove = comment_service.remove
approve_comment = comment_service.approve_comment
reject_comment = comment_service.reject_comment
mark_as_spam = comment_service.mark_as_spam
increment_like_count = comment_service.increment_like_count