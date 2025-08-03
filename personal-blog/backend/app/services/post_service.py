"""
文章服务类
"""
from typing import List, Optional, Type
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import datetime, timedelta
import hashlib

from app.models.post import Post
from app.models.tag import Tag
from app.schemas.post import PostCreate, PostUpdate
from app.services.base import CRUDBase
from app.services import category_service, tag_service


class CRUDPost(CRUDBase[Post, PostCreate, PostUpdate]):
    """文章CRUD操作类"""
    
    def __init__(self, model: Type[Post]):
        super().__init__(model)
        # 用于存储最近的浏览记录，防止重复计数
        self._recent_views = {}
    
    def create_with_owner(
        self, db: Session, *, obj_in: PostCreate, owner_id: int
    ) -> Post:
        """创建文章（指定作者）"""
        obj_in_data = obj_in.dict()
        tag_ids = obj_in_data.pop("tag_ids", [])
        
        db_obj = Post(**obj_in_data, author_id=owner_id)
        db.add(db_obj)
        db.flush()  # 获取ID但不提交
        
        # 添加标签关联
        if tag_ids:
            tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
            db_obj.tags = tags
            
            # 更新标签的文章计数
            for tag in tags:
                tag_service.increment_post_count(db, tag_id=tag.id)
        
        # 更新分类的文章计数
        if db_obj.category_id:
            category_service.increment_post_count(db, category_id=db_obj.category_id)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_slug(self, db: Session, *, slug: str) -> Optional[Post]:
        """根据slug获取文章"""
        return db.query(Post).filter(Post.slug == slug).first()

    def get_multi_with_filters(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        category_id: Optional[int] = None,
        tag_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[Post]:
        """根据条件筛选文章"""
        query = db.query(Post)
        
        # 状态筛选
        if status:
            query = query.filter(Post.status == status)
        else:
            # 默认只显示已发布的文章
            query = query.filter(Post.status == "published")
        
        # 分类筛选
        if category_id:
            query = query.filter(Post.category_id == category_id)
        
        # 标签筛选
        if tag_id:
            query = query.join(Post.tags).filter(Tag.id == tag_id)
        
        # 搜索筛选
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Post.title.ilike(search_term),
                    Post.content.ilike(search_term),
                    Post.excerpt.ilike(search_term)
                )
            )
        
        return query.order_by(desc(Post.published_at)).offset(skip).limit(limit).all()

    def get_featured_posts(self, db: Session, *, limit: int = 10) -> List[Post]:
        """获取精选文章"""
        return (
            db.query(Post)
            .filter(and_(Post.is_featured == True, Post.status == "published"))
            .order_by(desc(Post.published_at))
            .limit(limit)
            .all()
        )

    def increment_view_count(self, db: Session, *, post_id: int, client_ip: str = None) -> bool:
        """增加文章浏览次数（带防重复机制）"""
        # 生成唯一标识符
        identifier = f"{post_id}_{client_ip or 'unknown'}"
        view_key = hashlib.md5(identifier.encode()).hexdigest()
        
        # 检查是否在5分钟内已经浏览过
        current_time = datetime.now()
        if view_key in self._recent_views:
            last_view_time = self._recent_views[view_key]
            if current_time - last_view_time < timedelta(minutes=5):
                return False  # 5分钟内重复浏览，不增加计数
        
        # 记录本次浏览时间
        self._recent_views[view_key] = current_time
        
        # 清理过期的浏览记录（超过1小时的记录）
        expired_keys = [
            key for key, time in self._recent_views.items()
            if current_time - time > timedelta(hours=1)
        ]
        for key in expired_keys:
            del self._recent_views[key]
        
        # 增加浏览次数
        post = db.query(Post).filter(Post.id == post_id).first()
        if post:
            post.view_count += 1
            db.commit()
            return True
        return False

    def increment_like_count(self, db: Session, *, post_id: int) -> None:
        """增加文章点赞次数"""
        post = db.query(Post).filter(Post.id == post_id).first()
        if post:
            post.like_count += 1
            db.commit()

    def increment_comment_count(self, db: Session, *, post_id: int) -> None:
        """增加文章评论次数"""
        post = db.query(Post).filter(Post.id == post_id).first()
        if post:
            post.comment_count += 1
            db.commit()

    def decrement_comment_count(self, db: Session, *, post_id: int) -> None:
        """减少文章评论次数"""
        post = db.query(Post).filter(Post.id == post_id).first()
        if post and post.comment_count > 0:
            post.comment_count -= 1
            db.commit()

    def get_by_author(
        self, db: Session, *, author_id: int, skip: int = 0, limit: int = 20
    ) -> List[Post]:
        """获取指定作者的文章"""
        return (
            db.query(Post)
            .filter(Post.author_id == author_id)
            .order_by(desc(Post.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update_with_counts(
        self, db: Session, *, db_obj: Post, obj_in: PostUpdate
    ) -> Post:
        """更新文章并处理分类标签计数"""
        obj_in_data = obj_in.dict(exclude_unset=True)
        tag_ids = obj_in_data.pop("tag_ids", None)
        
        # 记录原来的分类和标签
        old_category_id = db_obj.category_id
        old_tags = list(db_obj.tags)
        
        # 更新文章基本信息
        for field, value in obj_in_data.items():
            setattr(db_obj, field, value)
        
        # 处理分类变更
        if "category_id" in obj_in_data:
            new_category_id = obj_in_data["category_id"]
            if old_category_id != new_category_id:
                # 减少旧分类计数
                if old_category_id:
                    category_service.decrement_post_count(db, category_id=old_category_id)
                # 增加新分类计数
                if new_category_id:
                    category_service.increment_post_count(db, category_id=new_category_id)
        
        # 处理标签变更
        if tag_ids is not None:
            # 减少旧标签计数
            for old_tag in old_tags:
                tag_service.decrement_post_count(db, tag_id=old_tag.id)
            
            # 设置新标签并增加计数
            if tag_ids:
                new_tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
                db_obj.tags = new_tags
                for new_tag in new_tags:
                    tag_service.increment_post_count(db, tag_id=new_tag.id)
            else:
                db_obj.tags = []
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove_with_counts(self, db: Session, *, id: int) -> Post:
        """删除文章并处理分类标签计数"""
        obj = db.query(Post).get(id)
        if obj:
            # 减少分类计数
            if obj.category_id:
                category_service.decrement_post_count(db, category_id=obj.category_id)
            
            # 减少标签计数
            for tag in obj.tags:
                tag_service.decrement_post_count(db, tag_id=tag.id)
            
            db.delete(obj)
            db.commit()
        return obj


# 创建文章服务实例
post_service = CRUDPost(Post)

# 导出函数
get = post_service.get
get_multi = post_service.get_multi
get_by_slug = post_service.get_by_slug
get_multi_with_filters = post_service.get_multi_with_filters
get_featured_posts = post_service.get_featured_posts
get_by_author = post_service.get_by_author
create = post_service.create
create_with_owner = post_service.create_with_owner
update = post_service.update
update_with_counts = post_service.update_with_counts
remove = post_service.remove
remove_with_counts = post_service.remove_with_counts
increment_view_count = post_service.increment_view_count
increment_like_count = post_service.increment_like_count
increment_comment_count = post_service.increment_comment_count
decrement_comment_count = post_service.decrement_comment_count