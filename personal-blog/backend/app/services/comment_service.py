"""
评论业务服务类
只处理评论相关的业务逻辑
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentUpdate
from app.services.base import StandardService
from app.crud import comment as comment_crud, user as user_crud, post as post_crud
from app.core.exceptions import BusinessError, NotFoundError


class CommentService(StandardService):
    """评论业务服务类"""
    
    def __init__(self):
        super().__init__(comment_crud)
    
    def get_service_name(self) -> str:
        return "CommentService"
    
    def create_comment(
        self,
        db: Session,
        *,
        comment_in: CommentCreate,
        author_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Comment:
        """
        创建评论
        
        Args:
            db: 数据库会话
            comment_in: 评论创建数据
            author_id: 作者ID（可选，匿名评论时为None）
            ip_address: IP地址
            user_agent: 用户代理
            
        Returns:
            Comment: 创建的评论对象
        """
        self.log_operation("create_comment", {
            "post_id": comment_in.post_id,
            "author_id": author_id,
            "is_anonymous": author_id is None
        })
        
        def _create_comment():
            # 检查文章是否存在
            post = post_crud.get(db, id=comment_in.post_id)
            if not post:
                raise NotFoundError("文章不存在", resource_type="Post", resource_id=str(comment_in.post_id))
            
            # 检查父评论是否存在（如果是回复）
            if comment_in.parent_id:
                parent_comment = self.crud.get(db, id=comment_in.parent_id)
                if not parent_comment:
                    raise NotFoundError("父评论不存在", resource_type="Comment", resource_id=str(comment_in.parent_id))
                
                # 检查父评论是否属于同一篇文章
                if parent_comment.post_id != comment_in.post_id:
                    raise BusinessError("回复评论必须属于同一篇文章")
            
            # 判断是否自动审核通过
            is_approved = False
            if author_id:
                user = user_crud.get(db, id=author_id)
                if user and user_crud.is_superuser(user):
                    is_approved = True
            
            # 创建评论
            comment_data = comment_in.dict()
            comment_data.update({
                "author_id": author_id,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "is_approved": is_approved
            })
            
            comment = self.crud.create(db, obj_in=CommentCreate(**comment_data))
            
            return comment
        
        return self.execute_in_transaction(db, _create_comment)
    
    def approve_comment(self, db: Session, *, comment_id: int) -> Comment:
        """
        审核通过评论
        
        Args:
            db: 数据库会话
            comment_id: 评论ID
            
        Returns:
            Comment: 更新后的评论对象
        """
        self.log_operation("approve_comment", {"comment_id": comment_id})
        
        comment = self.crud.get(db, id=comment_id)
        if not comment:
            raise NotFoundError("评论不存在", resource_type="Comment", resource_id=str(comment_id))
        
        if comment.is_approved:
            raise BusinessError("评论已经审核通过")
        
        return self.crud.approve_comment(db, comment_id=comment_id)
    
    def reject_comment(self, db: Session, *, comment_id: int) -> Comment:
        """
        拒绝评论
        
        Args:
            db: 数据库会话
            comment_id: 评论ID
            
        Returns:
            Comment: 更新后的评论对象
        """
        self.log_operation("reject_comment", {"comment_id": comment_id})
        
        comment = self.crud.get(db, id=comment_id)
        if not comment:
            raise NotFoundError("评论不存在", resource_type="Comment", resource_id=str(comment_id))
        
        return self.crud.reject_comment(db, comment_id=comment_id)
    
    def mark_as_spam(self, db: Session, *, comment_id: int) -> Comment:
        """
        标记为垃圾评论
        
        Args:
            db: 数据库会话
            comment_id: 评论ID
            
        Returns:
            Comment: 更新后的评论对象
        """
        self.log_operation("mark_as_spam", {"comment_id": comment_id})
        
        comment = self.crud.get(db, id=comment_id)
        if not comment:
            raise NotFoundError("评论不存在", resource_type="Comment", resource_id=str(comment_id))
        
        # 这里可以添加垃圾评论检测逻辑
        return self.execute_with_error_handling(
            self.crud.update, db,
            db_obj=comment,
            obj_in={"is_spam": True, "is_approved": False},
            error_message="标记垃圾评论失败"
        )
    
    def delete_comment(
        self,
        db: Session,
        *,
        comment_id: int,
        force: bool = False
    ) -> Comment:
        """
        删除评论
        
        Args:
            db: 数据库会话
            comment_id: 评论ID
            force: 是否强制删除（即使有回复）
            
        Returns:
            Comment: 被删除的评论对象
        """
        self.log_operation("delete_comment", {"comment_id": comment_id, "force": force})
        
        comment = self.crud.get(db, id=comment_id)
        if not comment:
            raise NotFoundError("评论不存在", resource_type="Comment", resource_id=str(comment_id))
        
        # 检查是否有回复
        if not force:
            replies = self.crud.get_by_parent(db, parent_id=comment_id, limit=1)
            if replies:
                raise BusinessError("评论有回复，无法删除。如需强制删除，请设置force=True")
        
        return self.execute_with_error_handling(
            self.crud.remove, db, id=comment_id,
            error_message="删除评论失败"
        )
    
    def get_comment_stats(self, db: Session) -> Dict[str, Any]:
        """
        获取评论统计信息
        
        Returns:
            dict: 评论统计信息
        """
        # 获取总评论数
        total_comments = len(self.crud.get_multi(db, limit=10000))  # 简化实现
        
        # 获取待审核评论数
        pending_comments = len(self.crud.get_pending_approval(db, limit=10000))
        
        # 获取最近评论数
        recent_comments = len(self.crud.get_recent_comments(db, limit=10))
        
        return {
            "total_comments": total_comments,
            "approved_comments": total_comments - pending_comments,
            "pending_comments": pending_comments,
            "recent_comments": recent_comments
        }
    
    def get_comments_with_replies(
        self,
        db: Session,
        *,
        post_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        获取文章评论及其回复（树形结构）
        
        Args:
            db: 数据库会话
            post_id: 文章ID
            skip: 跳过数量
            limit: 限制数量
            
        Returns:
            List[dict]: 评论树形结构
        """
        # 获取顶级评论
        top_comments = self.crud.get_approved_by_post(db, post_id=post_id, skip=skip, limit=limit)
        
        result = []
        for comment in top_comments:
            comment_dict = {
                "id": comment.id,
                "content": comment.content,
                "author": comment.author.username if comment.author else comment.author_name,
                "created_at": comment.created_at,
                "like_count": getattr(comment, 'like_count', 0),
                "replies": []
            }
            
            # 获取回复
            replies = self.crud.get_approved_by_post(db, post_id=post_id)
            comment_replies = [r for r in replies if r.parent_id == comment.id]
            
            for reply in comment_replies:
                reply_dict = {
                    "id": reply.id,
                    "content": reply.content,
                    "author": reply.author.username if reply.author else reply.author_name,
                    "created_at": reply.created_at,
                    "like_count": getattr(reply, 'like_count', 0),
                }
                comment_dict["replies"].append(reply_dict)
            
            result.append(comment_dict)
        
        return result
    
    def moderate_comments(
        self,
        db: Session,
        *,
        comment_ids: List[int],
        action: str
    ) -> Dict[str, int]:
        """
        批量管理评论
        
        Args:
            db: 数据库会话
            comment_ids: 评论ID列表
            action: 操作类型 ('approve', 'reject', 'spam', 'delete')
            
        Returns:
            dict: 操作结果统计
        """
        self.log_operation("moderate_comments", {
            "comment_count": len(comment_ids),
            "action": action
        })
        
        success_count = 0
        error_count = 0
        
        def _moderate():
            nonlocal success_count, error_count
            
            for comment_id in comment_ids:
                try:
                    comment = self.crud.get(db, id=comment_id)
                    if not comment:
                        error_count += 1
                        continue
                    
                    if action == "approve":
                        self.crud.approve_comment(db, comment_id=comment_id)
                    elif action == "reject":
                        self.crud.reject_comment(db, comment_id=comment_id)
                    elif action == "spam":
                        self.crud.update(db, db_obj=comment, obj_in={"is_spam": True, "is_approved": False})
                    elif action == "delete":
                        self.crud.remove(db, id=comment_id)
                    else:
                        error_count += 1
                        continue
                    
                    success_count += 1
                    
                except Exception as e:
                    self.logger.error(f"批量管理评论失败: comment_id={comment_id}, error={e}")
                    error_count += 1
        
        self.execute_in_transaction(db, _moderate)
        
        return {
            "success_count": success_count,
            "error_count": error_count,
            "total_count": len(comment_ids)
        }
    
    def get_multi_with_filters(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        post_id: Optional[int] = None,
        author_id: Optional[int] = None,
        is_approved: Optional[bool] = None,
        parent_id: Optional[int] = None
    ) -> List[Comment]:
        """
        根据多个条件过滤获取评论列表
        
        Args:
            db: 数据库会话
            skip: 跳过数量
            limit: 限制数量
            post_id: 文章ID
            author_id: 作者ID
            is_approved: 是否已审核
            parent_id: 父评论ID
            
        Returns:
            List[Comment]: 评论列表
        """
        from sqlalchemy import and_
        
        query = db.query(Comment)
        
        # 构建过滤条件
        conditions = []
        
        # 文章过滤
        if post_id:
            conditions.append(Comment.post_id == post_id)
        
        # 作者过滤
        if author_id:
            conditions.append(Comment.author_id == author_id)
        
        # 审核状态过滤
        if is_approved is not None:
            conditions.append(Comment.is_approved == is_approved)
        
        # 父评论过滤
        if parent_id is not None:
            conditions.append(Comment.parent_id == parent_id)
        
        # 应用所有条件
        if conditions:
            query = query.filter(and_(*conditions))
        
        # 按创建时间倒序排列
        query = query.order_by(Comment.created_at.desc())
        
        return query.offset(skip).limit(limit).all()


# 创建评论服务实例
comment_service = CommentService()

# 导出常用方法
create_comment = comment_service.create_comment
approve_comment = comment_service.approve_comment
reject_comment = comment_service.reject_comment
mark_as_spam = comment_service.mark_as_spam
delete_comment = comment_service.delete_comment
get_comment_stats = comment_service.get_comment_stats
get_comments_with_replies = comment_service.get_comments_with_replies
moderate_comments = comment_service.moderate_comments
get_multi_with_filters = comment_service.get_multi_with_filters

# 从CRUD层导出的便捷函数
get = comment_crud.get
get_multi = comment_crud.get_multi
get_by_post = comment_crud.get_by_post
get_approved_by_post = comment_crud.get_approved_by_post
get_by_author = comment_crud.get_by_author
get_pending_approval = comment_crud.get_pending_approval
get_recent_comments = comment_crud.get_recent_comments