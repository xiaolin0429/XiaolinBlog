"""
CRUD操作模块
"""
from app.crud.base import CRUDBase
from app.crud.user import user
from app.crud.post import post
from app.crud.category import category
from app.crud.tag import tag
from app.crud.comment import comment
from app.crud.blog_config import blog_config, config_group

__all__ = [
    "CRUDBase",
    "user",
    "post", 
    "category",
    "tag",
    "comment",
    "blog_config",
    "config_group"
]