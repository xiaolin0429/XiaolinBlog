"""
业务服务层模块
重构后的规范化服务层，采用统一的Service基类
"""
from app.services.base import BaseService, StandardService, CRUDServiceMixin, TransactionalService, CacheableService

# 导入各个业务服务
from app.services.user_service import user_service, UserService
from app.services.post_service import post_service, PostService
from app.services.category_service import category_service, CategoryService
from app.services.comment_service import comment_service, CommentService

# 导入未重构的服务（待后续重构）
from app.services import tag_service, log_service

__all__ = [
    # 基础类
    "BaseService",
    "StandardService", 
    "CRUDServiceMixin",
    "TransactionalService",
    "CacheableService",
    
    # 业务服务类
    "UserService",
    "PostService",
    "CategoryService", 
    "CommentService",
    
    # 业务服务实例
    "user_service",
    "post_service",
    "category_service", 
    "comment_service",
    
    # 待重构的服务
    "tag_service",
    "log_service"
]