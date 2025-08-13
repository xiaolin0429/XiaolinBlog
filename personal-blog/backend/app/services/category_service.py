"""
分类业务服务类
只处理分类相关的业务逻辑
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.services.base import StandardService
from app.crud import category as category_crud
from app.core.exceptions import BusinessError, NotFoundError


class CategoryService(StandardService):
    """分类业务服务类"""
    
    def __init__(self):
        super().__init__(category_crud)
    
    def get_service_name(self) -> str:
        return "CategoryService"
    
    def create_category(
        self, 
        db: Session, 
        *, 
        category_in: CategoryCreate
    ) -> Category:
        """
        创建分类
        
        Args:
            db: 数据库会话
            category_in: 分类创建数据
            
        Returns:
            Category: 创建的分类对象
        """
        self.log_operation("create_category", {"name": category_in.name})
        
        # 检查名称唯一性
        if self.crud.get_by_name(db, name=category_in.name):
            raise BusinessError("分类名称已存在")
        
        # 检查slug唯一性
        if category_in.slug and self.crud.get_by_slug(db, slug=category_in.slug):
            raise BusinessError("分类slug已存在")
        
        return self.execute_with_error_handling(
            self.crud.create, db, obj_in=category_in,
            error_message="创建分类失败"
        )
    
    def update_category(
        self,
        db: Session,
        *,
        category: Category,
        category_in: CategoryUpdate
    ) -> Category:
        """
        更新分类
        
        Args:
            db: 数据库会话
            category: 分类对象
            category_in: 分类更新数据
            
        Returns:
            Category: 更新后的分类对象
        """
        self.log_operation("update_category", {"id": category.id})
        
        # 检查名称唯一性（如果要更新名称）
        if category_in.name and category_in.name != category.name:
            existing = self.crud.get_by_name(db, name=category_in.name)
            if existing and existing.id != category.id:
                raise BusinessError("分类名称已存在")
        
        # 检查slug唯一性（如果要更新slug）
        if category_in.slug and category_in.slug != category.slug:
            existing = self.crud.get_by_slug(db, slug=category_in.slug)
            if existing and existing.id != category.id:
                raise BusinessError("分类slug已存在")
        
        return self.execute_with_error_handling(
            self.crud.update, db, db_obj=category, obj_in=category_in,
            error_message="更新分类失败"
        )
    
    def delete_category(
        self,
        db: Session,
        *,
        category_id: int,
        force: bool = False
    ) -> Category:
        """
        删除分类
        
        Args:
            db: 数据库会话
            category_id: 分类ID
            force: 是否强制删除（即使有文章）
            
        Returns:
            Category: 被删除的分类对象
        """
        self.log_operation("delete_category", {"id": category_id, "force": force})
        
        category = self.crud.get(db, id=category_id)
        if not category:
            raise NotFoundError("分类不存在", resource_type="Category", resource_id=str(category_id))
        
        # 检查是否有关联的文章
        if not force:
            from app.crud import post
            category_posts = post.get_by_category(db, category_id=category_id, limit=1)
            if category_posts:
                raise BusinessError("分类下还有文章，无法删除。如需强制删除，请设置force=True")
        
        return self.execute_with_error_handling(
            self.crud.remove, db, id=category_id,
            error_message="删除分类失败"
        )
    
    def get_category_with_posts(
        self, 
        db: Session, 
        *, 
        category_id: int
    ) -> Dict[str, Any]:
        """
        获取分类及其文章信息
        
        Args:
            db: 数据库会话
            category_id: 分类ID
            
        Returns:
            dict: 分类及文章信息
        """
        category = self.crud.get(db, id=category_id)
        if not category:
            raise NotFoundError("分类不存在", resource_type="Category", resource_id=str(category_id))
        
        from app.crud import post
        
        # 获取分类下的文章数量
        total_posts = len(post.get_by_category(db, category_id=category_id))
        published_posts = len(post.get_by_category(db, category_id=category_id))  # 这里需要过滤已发布
        
        return {
            "id": category.id,
            "name": category.name,
            "slug": category.slug,
            "description": category.description,
            "total_posts": total_posts,
            "published_posts": published_posts,
            "created_at": category.created_at,
            "updated_at": category.updated_at
        }
    
    def get_categories_with_stats(self, db: Session) -> List[Dict[str, Any]]:
        """
        获取所有分类及其统计信息
        
        Returns:
            List[dict]: 分类统计信息列表
        """
        categories = self.crud.get_with_post_count(db)
        
        result = []
        for category_data in categories:
            if isinstance(category_data, tuple):
                category, post_count = category_data
            else:
                category = category_data
                post_count = 0
            
            result.append({
                "id": category.id,
                "name": category.name,
                "slug": category.slug,
                "description": category.description,
                "post_count": post_count,
                "created_at": category.created_at,
                "updated_at": category.updated_at
            })
        
        return result
    
    def search_categories(
        self,
        db: Session,
        *,
        query: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Category]:
        """
        搜索分类
        
        Args:
            db: 数据库会话
            query: 搜索关键词
            skip: 跳过数量
            limit: 限制数量
            
        Returns:
            List[Category]: 搜索结果
        """
        from sqlalchemy import or_
        from app.models.category import Category
        
        return (
            db.query(Category)
            .filter(
                or_(
                    Category.name.contains(query),
                    Category.description.contains(query) if hasattr(Category, 'description') else False
                )
            )
            .offset(skip)
            .limit(limit)
            .all()
        )


# 创建分类服务实例
category_service = CategoryService()

# 导出常用方法
create_category = category_service.create_category
update_category = category_service.update_category
delete_category = category_service.delete_category
get_category_with_posts = category_service.get_category_with_posts
get_categories_with_stats = category_service.get_categories_with_stats
search_categories = category_service.search_categories

# 从CRUD层导出的便捷函数
get = category_crud.get
get_multi = category_crud.get_multi
get_by_name = category_crud.get_by_name
get_by_slug = category_crud.get_by_slug
get_with_post_count = category_crud.get_with_post_count
get_active_categories = category_crud.get_active_categories