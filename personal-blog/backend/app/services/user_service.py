"""
用户业务服务类
只处理用户相关的业务逻辑
"""
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.crud.user import user as user_crud
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserInDB
from app.core.security import get_password_hash, verify_password


class UserService:
    """用户业务服务类"""
    
    def __init__(self):
        self.crud = user_crud
    
    def create_user(self, db: Session, *, user_in: UserCreate) -> User:
        """
        创建新用户
        
        Args:
            db: 数据库会话
            user_in: 用户创建数据
            
        Returns:
            User: 创建的用户对象
        """
        # 检查邮箱是否已存在
        if self.crud.get_by_email(db, email=user_in.email):
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="邮箱已存在")
        
        # 检查用户名是否已存在
        if self.crud.get_by_username(db, username=user_in.username):
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="用户名已存在")
        
        return self.crud.create(db, obj_in=user_in)
    
    def update_user(
        self, 
        db: Session, 
        *, 
        current_user: User, 
        user_in: UserUpdate
    ) -> User:
        """
        更新用户信息
        
        Args:
            db: 数据库会话
            current_user: 当前用户
            user_in: 用户更新数据
            
        Returns:
            User: 更新后的用户对象
        """
        # 如果要更新邮箱，检查是否已存在
        if user_in.email and user_in.email != current_user.email:
            existing_user = self.crud.get_by_email(db, email=user_in.email)
            if existing_user and existing_user.id != current_user.id:
                from fastapi import HTTPException
                raise HTTPException(status_code=400, detail="邮箱已存在")
        
        # 如果要更新用户名，检查是否已存在
        if user_in.username and user_in.username != current_user.username:
            existing_user = self.crud.get_by_username(db, username=user_in.username)
            if existing_user and existing_user.id != current_user.id:
                from fastapi import HTTPException
                raise HTTPException(status_code=400, detail="用户名已存在")
        
        return self.crud.update(db, db_obj=current_user, obj_in=user_in)
    
    def change_password(
        self, 
        db: Session, 
        *, 
        user: User, 
        old_password: str, 
        new_password: str
    ) -> User:
        """
        修改密码
        
        Args:
            db: 数据库会话
            user: 用户对象
            old_password: 旧密码
            new_password: 新密码
            
        Returns:
            User: 更新后的用户对象
        """
        # 验证旧密码
        if not verify_password(old_password, user.hashed_password):
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="旧密码错误")
        
        # 更新密码
        hashed_password = get_password_hash(new_password)
        return self.crud.update(db, db_obj=user, obj_in={"hashed_password": hashed_password})
    
    def reset_password(self, db: Session, *, user: User, new_password: str) -> User:
        """
        重置密码（管理员功能）
        
        Args:
            db: 数据库会话
            user: 用户对象
            new_password: 新密码
            
        Returns:
            User: 更新后的用户对象
        """
        hashed_password = get_password_hash(new_password)
        return self.crud.update(db, db_obj=user, obj_in={"hashed_password": hashed_password})
    
    def activate_user(self, db: Session, *, user: User) -> User:
        """
        激活用户
        
        Args:
            db: 数据库会话
            user: 用户对象
            
        Returns:
            User: 更新后的用户对象
        """
        return self.crud.update(db, db_obj=user, obj_in={"is_active": True})
    
    def deactivate_user(self, db: Session, *, user: User) -> User:
        """
        停用用户
        
        Args:
            db: 数据库会话
            user: 用户对象
            
        Returns:
            User: 更新后的用户对象
        """
        return self.crud.update(db, db_obj=user, obj_in={"is_active": False})
    
    def get_user_stats(self, db: Session, *, user_id: int) -> Dict:
        """
        获取用户统计信息
        
        Args:
            db: 数据库会话
            user_id: 用户ID
            
        Returns:
            dict: 用户统计信息
        """
        user = self.crud.get(db, id=user_id)
        if not user:
            return {}
        
        from app.crud import post, comment
        
        # 获取用户发布的文章数量
        user_posts = post.get_by_author(db, author_id=user_id)
        published_posts_count = sum(1 for p in user_posts if p.is_published)
        draft_posts_count = sum(1 for p in user_posts if not p.is_published)
        
        # 获取用户评论数量
        user_comments = comment.get_by_author(db, author_id=user_id)
        comments_count = len(user_comments)
        
        return {
            "user_id": user_id,
            "username": user.username,
            "published_posts": published_posts_count,
            "draft_posts": draft_posts_count,
            "comments": comments_count,
            "created_at": user.created_at,
            "last_login": user.last_login,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser
        }
    
    def search_users(
        self, 
        db: Session, 
        *, 
        query: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[User]:
        """
        搜索用户
        
        Args:
            db: 数据库会话
            query: 搜索关键词
            skip: 跳过数量
            limit: 限制数量
            
        Returns:
            List[User]: 用户列表
        """
        # 简单的用户搜索，可以根据用户名和邮箱搜索
        from sqlalchemy import or_
        
        return (
            db.query(User)
            .filter(
                or_(
                    User.username.contains(query),
                    User.email.contains(query),
                    User.full_name.contains(query) if hasattr(User, 'full_name') else False
                )
            )
            .filter(User.is_active == True)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def update_last_login(self, db: Session, *, user_id: int) -> User:
        """
        更新用户最后登录时间
        
        Args:
            db: 数据库会话
            user_id: 用户ID
            
        Returns:
            User: 更新后的用户对象
        """
        return self.crud.update_last_login(db, user_id=user_id)


# 创建用户服务实例
user_service = UserService()

# 导出常用方法
create_user = user_service.create_user
update_user = user_service.update_user
change_password = user_service.change_password
reset_password = user_service.reset_password
activate_user = user_service.activate_user
deactivate_user = user_service.deactivate_user
get_user_stats = user_service.get_user_stats
search_users = user_service.search_users
update_last_login = user_service.update_last_login

# 从CRUD层导出的便捷函数
get = user_crud.get
get_multi = user_crud.get_multi
get_by_email = user_crud.get_by_email
get_by_username = user_crud.get_by_username
authenticate = user_crud.authenticate
is_active = user_crud.is_active
is_superuser = user_crud.is_superuser
