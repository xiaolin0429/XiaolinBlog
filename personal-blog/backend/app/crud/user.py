"""
用户CRUD操作
"""
from typing import Any, Dict, Optional, Union
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core import security
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.crud.base import CRUDBase


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    """用户CRUD操作类"""
    
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        """根据邮箱获取用户"""
        return db.query(User).filter(User.email == email).first()

    def get_by_username(self, db: Session, *, username: str) -> Optional[User]:
        """根据用户名获取用户"""
        return db.query(User).filter(User.username == username).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        """创建用户"""
        db_obj = User(
            email=obj_in.email,
            username=obj_in.username,
            hashed_password=security.get_password_hash(obj_in.password),
            full_name=obj_in.full_name,
            avatar=obj_in.avatar,
            bio=obj_in.bio,
            is_active=obj_in.is_active,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        """更新用户"""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        if update_data.get("password"):
            hashed_password = security.get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def authenticate(self, db: Session, *, email: str, password: str) -> Optional[User]:
        """用户认证 - 支持邮箱或用户名登录"""
        # 首先尝试通过邮箱查找用户
        user = self.get_by_email(db, email=email)
        
        # 如果邮箱查找失败，尝试通过用户名查找
        if not user:
            user = self.get_by_username(db, username=email)
        
        if not user:
            return None
        if not security.verify_password(password, user.hashed_password):
            return None
        return user

    def is_active(self, user: User) -> bool:
        """检查用户是否激活"""
        return user.is_active

    def is_superuser(self, user: User) -> bool:
        """检查用户是否为超级用户"""
        return user.is_superuser

    def update_last_login(self, db: Session, *, user_id: int) -> User:
        """更新用户最后登录时间（不触发updated_at字段更新）"""
        user = self.get(db, id=user_id)
        if user:
            current_time = datetime.now(timezone.utc)
            
            # 使用原生SQL更新，避免触发updated_at字段的自动更新
            db.execute(
                text("UPDATE users SET last_login = :last_login WHERE id = :user_id"),
                {"last_login": current_time, "user_id": user_id}
            )
            db.commit()
            
            # 重新获取用户信息
            db.refresh(user)
        return user


# 创建用户CRUD实例
user = CRUDUser(User)