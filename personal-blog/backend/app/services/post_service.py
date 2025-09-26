"""
文章业务服务类
只处理文章相关的业务逻辑
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import hashlib

from app.models.post import Post
from app.schemas.post import PostCreate, PostUpdate
from app.services.base import StandardService
from app.crud import post as post_crud, category as category_crud, tag as tag_crud
from app.core.exceptions import BusinessError, NotFoundError


class PostService(StandardService):
    """文章业务服务类"""
    
    def __init__(self):
        super().__init__(post_crud)
        # 用于存储最近的浏览记录，防止重复计数
        self._recent_views = {}
    
    def get_service_name(self) -> str:
        return "PostService"
    
    def create_post_with_tags(
        self, 
        db: Session, 
        *, 
        post_in: PostCreate, 
        author_id: int,
        tag_ids: Optional[List[int]] = None
    ) -> Post:
        """
        创建文章并关联标签
        
        Args:
            db: 数据库会话
            post_in: 文章创建数据
            author_id: 作者ID
            tag_ids: 标签ID列表
            
        Returns:
            Post: 创建的文章对象
        """
        self.log_operation("create_post_with_tags", {
            "author_id": author_id,
            "tag_count": len(tag_ids) if tag_ids else 0
        })
        
        def _create_post(transaction_db):
            # 检查slug唯一性
            if post_in.slug and self.crud.get_by_slug(db, slug=post_in.slug):
                raise BusinessError("文章slug已存在")
            
            # 创建文章
            post_data = post_in.dict()
            post_data["author_id"] = author_id
            
            # 移除不属于Post模型的字段，直接创建Post对象
            post_create_data = {k: v for k, v in post_data.items() if k != "tag_ids"}
                
            # 直接使用字典创建，避免PostCreate schema的tag_ids字段问题
            from ..models.post import Post
            post = Post(**post_create_data)
            db.add(post)
            db.flush()  # 获取ID但不提交事务
            
            # 添加标签关联
            if tag_ids:
                tags = []
                for tag_id in tag_ids:
                    tag = tag_crud.get(db, id=tag_id)
                    if tag:
                        tags.append(tag)
                
                if tags:
                    post.tags = tags
                    db.commit()
                    db.refresh(post)
            
            return post
        
        return self.execute_in_transaction(db, _create_post)
    
    def update_post_with_tags(
        self,
        db: Session,
        *,
        post: Post,
        post_in: PostUpdate,
        tag_ids: Optional[List[int]] = None
    ) -> Post:
        """
        更新文章并处理标签关联
        
        Args:
            db: 数据库会话
            post: 文章对象
            post_in: 文章更新数据
            tag_ids: 新的标签ID列表
            
        Returns:
            Post: 更新后的文章对象
        """
        self.log_operation("update_post_with_tags", {
            "post_id": post.id,
            "tag_count": len(tag_ids) if tag_ids else 0
        })
        
        def _update_post(transaction_db):
            # 更新基本信息
            updated_post = self.crud.update(transaction_db, db_obj=post, obj_in=post_in)
            
            # 处理标签关联
            if tag_ids is not None:
                tags = []
                for tag_id in tag_ids:
                    tag = tag_crud.get(transaction_db, id=tag_id)
                    if tag:
                        tags.append(tag)
                
                updated_post.tags = tags
                transaction_db.commit()
                transaction_db.refresh(updated_post)
            
            return updated_post
        
        return self.execute_in_transaction(db, _update_post)
    
    def publish_post(self, db: Session, *, post: Post) -> Post:
        """
        发布文章
        
        Args:
            db: 数据库会话
            post: 文章对象
            
        Returns:
            Post: 更新后的文章对象
        """
        self.log_operation("publish_post", {"post_id": post.id})
        
        if post.is_published:
            raise BusinessError("文章已经发布")
        
        return self.crud.update(
            db, 
            db_obj=post, 
            obj_in={
                "is_published": True,
                "published_at": datetime.utcnow()
            }
        )
    
    def unpublish_post(self, db: Session, *, post: Post) -> Post:
        """
        取消发布文章
        
        Args:
            db: 数据库会话
            post: 文章对象
            
        Returns:
            Post: 更新后的文章对象
        """
        self.log_operation("unpublish_post", {"post_id": post.id})
        
        if not post.is_published:
            raise BusinessError("文章尚未发布")
        
        return self.crud.update(
            db,
            db_obj=post,
            obj_in={
                "is_published": False,
                "published_at": None
            }
        )
    
    def increment_view_count(
        self, 
        db: Session, 
        *, 
        post_id: int, 
        client_ip: str = None
    ) -> bool:
        """
        增加文章浏览次数（带防重复机制）
        
        Args:
            db: 数据库会话
            post_id: 文章ID
            client_ip: 客户端IP
            
        Returns:
            bool: 是否成功增加浏览次数
        """
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
        try:
            success = self.crud.increment_views(db, post_id=post_id)
            if not success:
                self.logger.warning(f"文章不存在，无法增加浏览次数: post_id={post_id}")
            return success
        except Exception as e:
            self.logger.error(f"增加浏览次数失败: {str(e)}")
            return False
    
    def get_post_stats(self, db: Session, *, post_id: int) -> Dict[str, Any]:
        """
        获取文章统计信息
        
        Args:
            db: 数据库会话
            post_id: 文章ID
            
        Returns:
            dict: 文章统计信息
        """
        post = self.crud.get(db, id=post_id)
        if not post:
            raise NotFoundError("文章不存在", resource_type="Post", resource_id=str(post_id))
        
        from app.crud import comment
        
        # 获取评论数量
        comment_count = comment.get_comment_count_by_post(db, post_id=post_id)
        
        return {
            "post_id": post_id,
            "title": post.title,
            "views": post.view_count or 0,
            "comment_count": comment_count,
            "is_published": post.is_published,
            "published_at": post.published_at,
            "created_at": post.created_at,
            "updated_at": post.updated_at,
            "category": post.category.name if post.category else None,
            "tag_count": len(post.tags) if post.tags else 0
        }
    
    def get_popular_posts(
        self, 
        db: Session, 
        *, 
        limit: int = 10, 
        days: int = 30
    ) -> List[Post]:
        """
        获取热门文章
        
        Args:
            db: 数据库会话
            limit: 限制数量
            days: 时间范围（天数）
            
        Returns:
            List[Post]: 热门文章列表
        """
        return self.crud.get_popular_posts(db, skip=0, limit=limit)
    
    def search_posts(
        self,
        db: Session,
        *,
        query: str,
        category_id: Optional[int] = None,
        tag_ids: Optional[List[int]] = None,
        skip: int = 0,
        limit: int = 20
    ) -> List[Post]:
        """
        搜索文章
        
        Args:
            db: 数据库会话
            query: 搜索关键词
            category_id: 分类ID筛选
            tag_ids: 标签ID列表筛选
            skip: 跳过数量
            limit: 限制数量
            
        Returns:
            List[Post]: 搜索结果
        """
        return self.crud.search_posts(db, query=query, skip=skip, limit=limit)
    
    def get_related_posts(
        self,
        db: Session,
        *,
        post: Post,
        limit: int = 5
    ) -> List[Post]:
        """
        获取相关文章
        
        Args:
            db: 数据库会话
            post: 当前文章
            limit: 限制数量
            
        Returns:
            List[Post]: 相关文章列表
        """
        # 简单的相关文章逻辑：同分类或同标签的其他文章
        related_posts = []
        
        # 同分类文章
        if post.category_id:
            category_posts = self.crud.get_by_category(
                db, category_id=post.category_id, skip=0, limit=limit
            )
            related_posts.extend([p for p in category_posts if p.id != post.id])
        
        # 如果同分类文章不够，添加同标签文章
        if len(related_posts) < limit and post.tags:
            tag_ids = [tag.id for tag in post.tags]
            for tag_id in tag_ids:
                if len(related_posts) >= limit:
                    break
                
                # 这里需要实现根据标签获取文章的方法
                # 暂时跳过，等待CRUD层完善
                pass
        
    def get_multi_with_filters(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        category_id: Optional[int] = None,
        tag_id: Optional[int] = None,
        author_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[Post]:
        """
        根据多个条件过滤获取文章列表
        
        Args:
            db: 数据库会话
            skip: 跳过数量
            limit: 限制数量
            status: 文章状态 ('published', 'draft')
            category_id: 分类ID
            tag_id: 标签ID
            author_id: 作者ID
            search: 搜索关键词
            
        Returns:
            List[Post]: 文章列表
        """
        from sqlalchemy import and_, or_
        
        query = db.query(Post)
        
        # 构建过滤条件
        conditions = []
        
        # 状态过滤
        if status == 'published':
            conditions.append(Post.status == 'published')
        elif status == 'draft':
            conditions.append(Post.status == 'draft')
        
        # 分类过滤
        if category_id:
            conditions.append(Post.category_id == category_id)
        
        # 标签过滤
        if tag_id:
            query = query.join(Post.tags).filter(Post.tags.any(id=tag_id))
        
        # 作者过滤
        if author_id:
            conditions.append(Post.author_id == author_id)
        
        # 搜索过滤
        if search:
            search_condition = or_(
                Post.title.contains(search),
                Post.content.contains(search),
                Post.summary.contains(search) if hasattr(Post, 'summary') else False
            )
            conditions.append(search_condition)
        
        # 应用所有条件
        if conditions:
            query = query.filter(and_(*conditions))
        
        # 按创建时间倒序排列
        query = query.order_by(Post.created_at.desc())
        
        return query.offset(skip).limit(limit).all()


# 创建文章服务实例
post_service = PostService()

# 导出常用方法
create_post_with_tags = post_service.create_post_with_tags
update_post_with_tags = post_service.update_post_with_tags
publish_post = post_service.publish_post
unpublish_post = post_service.unpublish_post
increment_view_count = post_service.increment_view_count
get_post_stats = post_service.get_post_stats
get_popular_posts = post_service.get_popular_posts
search_posts = post_service.search_posts
get_related_posts = post_service.get_related_posts
get_multi_with_filters = post_service.get_multi_with_filters

# 从CRUD层导出的便捷函数
get = post_crud.get
get_multi = post_crud.get_multi
get_by_slug = post_crud.get_by_slug
get_published = post_crud.get_published
get_by_category = post_crud.get_by_category
get_by_author = post_crud.get_by_author