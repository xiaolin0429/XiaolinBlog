"""
用户服务类
"""
from typing import Any, Dict, Optional, Union
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.base import CRUDBase

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


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
        print(f"🔍 正在更新用户 {user_id} 的最后登录时间...")
        user = self.get(db, id=user_id)
        if user:
            from datetime import timezone
            current_time = datetime.now(timezone.utc)
            print(f"⏰ 设置最后登录时间为: {current_time}")
            
            # 使用原生SQL更新，避免触发updated_at字段的自动更新
            from sqlalchemy import text
            db.execute(
                text("UPDATE users SET last_login = :last_login WHERE id = :user_id"),
                {"last_login": current_time, "user_id": user_id}
            )
            db.commit()
            
            # 重新获取用户信息
            db.refresh(user)
            print(f"✅ 用户 {user.username} 的最后登录时间已更新为: {user.last_login}")
        else:
            print(f"❌ 未找到用户 ID: {user_id}")
        return user


# 创建用户服务实例
user_service = CRUDUser(User)


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    """获取当前用户"""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = payload.get("sub")
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无法验证凭据",
        )
    user = user_service.get(db, id=token_data)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """获取当前激活用户"""
    if not user_service.is_active(current_user):
        raise HTTPException(status_code=400, detail="用户未激活")
    return current_user


def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """获取当前激活的超级用户"""
    if not user_service.is_superuser(current_user):
        raise HTTPException(
            status_code=400, detail="权限不足"
        )
    return current_user


def get_current_user_optional(
    db: Session = Depends(get_db), 
    authorization: Optional[str] = None
) -> Optional[User]:
    """获取当前用户（可选，用于评论等功能）"""
    try:
        if not authorization:
            return None
        
        # 从Authorization头中提取token
        if not authorization.startswith("Bearer "):
            return None
        
        token = authorization[7:]  # 移除 "Bearer " 前缀
        
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = payload.get("sub")
        if not token_data:
            return None
        user = user_service.get(db, id=token_data)
        return user
    except (jwt.JWTError, ValidationError):
        return None


# 导出函数
authenticate = user_service.authenticate
get_by_email = user_service.get_by_email
get_by_username = user_service.get_by_username
is_active = user_service.is_active
is_superuser = user_service.is_superuser
get_multi = user_service.get_multi
get = user_service.get
create = user_service.create
update = user_service.update
remove = user_service.remove
update_last_login = user_service.update_last_login
