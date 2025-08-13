"""
用户相关API端点
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Form
from sqlalchemy.orm import Session
import os
import uuid
from pathlib import Path

from app.api.v1.endpoints.deps import get_db, get_current_active_user, get_current_active_superuser
from app.schemas.user import User, UserCreate, UserUpdate
from app.services import user_service
from app.services.user_service import is_superuser, get_multi, get_by_email, get_by_username, create_user as create, update_user as update_current_user, get as get_user
from app.crud.user import user as user_crud
from app.core.security import verify_password

router = APIRouter()


@router.get("/", response_model=List[User])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    获取用户列表（仅超级用户）
    """
    users = get_multi(db, skip=skip, limit=limit)
    return users


@router.post("/", response_model=User)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    创建新用户
    """
    # 检查邮箱是否已存在
    user = get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="该邮箱已被注册",
        )
    
    # 检查用户名是否已存在
    user = get_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=400,
            detail="该用户名已被注册",
        )
    
    try:
        user = create(db=db, obj_in=user_in)
        return user
    except Exception as e:
        # 处理数据库约束违反等异常
        if "duplicate key value violates unique constraint" in str(e):
            if "username" in str(e):
                raise HTTPException(status_code=400, detail="该用户名已被注册")
            elif "email" in str(e):
                raise HTTPException(status_code=400, detail="该邮箱已被注册")
        raise HTTPException(status_code=500, detail="创建用户失败")


@router.put("/me", response_model=User)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    更新当前用户信息
    """
    # 使用传入的数据更新用户信息
    user = update_current_user(db, current_user=current_user, user_in=user_in)
    return user


@router.get("/me", response_model=User)
def read_user_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取当前用户信息
    """
    return current_user


@router.get("/detail", response_model=User)
def read_user_by_id(
    user_id: int = Query(..., description="用户ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    根据ID获取用户信息
    """
    user = get_user(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="用户不存在"
        )
    
    if user == current_user:
        return user
    if not is_superuser(current_user):
        raise HTTPException(
            status_code=400, detail="权限不足"
        )
    return user


@router.put("/update", response_model=User)
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: int = Query(..., description="要更新的用户ID"),
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    更新用户信息（仅超级用户）
    """
    user = get_user(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="用户不存在",
        )
    user = user_crud.update(db, db_obj=user, obj_in=user_in)
    return user


@router.post("/upload-avatar", response_model=dict)
def upload_avatar(
    *,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    上传用户头像
    """
    # 检查文件类型
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="只能上传图片文件"
        )
    
    # 检查文件大小 (5MB)
    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="文件大小不能超过5MB"
        )
    
    try:
        # 创建上传目录
        upload_dir = Path("uploads/avatars")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # 生成唯一文件名
        file_extension = Path(file.filename).suffix if file.filename else '.jpg'
        filename = f"{uuid.uuid4()}{file_extension}"
        file_path = upload_dir / filename
        
        # 保存文件
        with open(file_path, "wb") as buffer:
            content = file.file.read()
            buffer.write(content)
        
        # 更新用户头像URL
        avatar_url = f"/uploads/avatars/{filename}"
        user_update = UserUpdate(avatar=avatar_url)
        user_crud.update(db, db_obj=current_user, obj_in=user_update)
        
        return {"avatar_url": avatar_url}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"上传头像失败: {str(e)}"
        )


@router.post("/change-password")
def change_password(
    *,
    db: Session = Depends(get_db),
    current_password: str = Form(...),
    new_password: str = Form(...),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    修改密码
    """
    # 验证当前密码
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="当前密码不正确"
        )
    
    # 检查新密码长度
    if len(new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="新密码长度不能少于6位"
        )
    
    try:
        # 更新密码
        user_update = UserUpdate(password=new_password)
        user_crud.update(db, db_obj=current_user, obj_in=user_update)
        
        return {"message": "密码修改成功"}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"修改密码失败: {str(e)}"
        )
