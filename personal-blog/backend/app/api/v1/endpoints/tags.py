"""
标签相关API端点
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.v1.endpoints.deps import get_db, get_current_active_user
from app.schemas.tag import Tag, TagCreate, TagUpdate
from app.schemas.user import User
from app.services import tag_service, user_service

router = APIRouter()


@router.get("/", response_model=List[Tag])
def read_tags(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    获取标签列表
    """
    tags = tag_service.get_multi(db, skip=skip, limit=limit)
    return tags


@router.post("/", response_model=Tag)
def create_tag(
    *,
    db: Session = Depends(get_db),
    tag_in: TagCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    创建新标签
    """
    if not user_service.is_superuser(current_user):
        raise HTTPException(status_code=400, detail="权限不足")
    
    # 检查标签名称是否已存在
    if tag_service.get_by_name(db, name=tag_in.name):
        raise HTTPException(status_code=400, detail="标签名称已存在")
    
    # 检查slug是否已存在
    if tag_service.get_by_slug(db, slug=tag_in.slug):
        raise HTTPException(status_code=400, detail="标签别名已存在")
    
    tag = tag_service.create(db=db, obj_in=tag_in)
    return tag


@router.put("/", response_model=Tag)
def update_tag(
    *,
    db: Session = Depends(get_db),
    tag_id: int = Query(..., description="要更新的标签ID"),
    tag_in: TagUpdate,
    current_user: User = Depends(user_service.get_current_active_user),
) -> Any:
    """
    更新标签
    """
    if not user_service.is_superuser(current_user):
        raise HTTPException(status_code=400, detail="权限不足")
    
    tag = tag_service.get(db=db, id=tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="标签不存在")
    
    # 检查标签名称是否已存在（排除当前标签）
    if tag_in.name and tag_in.name != tag.name:
        if tag_service.get_by_name(db, name=tag_in.name):
            raise HTTPException(status_code=400, detail="标签名称已存在")
    
    # 检查slug是否已存在（排除当前标签）
    if tag_in.slug and tag_in.slug != tag.slug:
        if tag_service.get_by_slug(db, slug=tag_in.slug):
            raise HTTPException(status_code=400, detail="标签别名已存在")
    
    tag = tag_service.update(db=db, db_obj=tag, obj_in=tag_in)
    return tag


@router.delete("/")
def delete_tag(
    *,
    db: Session = Depends(get_db),
    tag_id: int = Query(..., description="要删除的标签ID"),
    current_user: User = Depends(user_service.get_current_active_user),
) -> Any:
    """
    删除标签
    """
    if not user_service.is_superuser(current_user):
        raise HTTPException(status_code=400, detail="权限不足")
    
    tag = tag_service.get(db=db, id=tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="标签不存在")
    
    # 检查是否有文章使用此标签
    if tag.post_count > 0:
        raise HTTPException(status_code=400, detail="该标签下还有文章，无法删除")
    
    tag_service.remove(db=db, id=tag_id)
    return {"message": "标签删除成功"}


@router.get("/popular/", response_model=List[Tag])
def read_popular_tags(
    db: Session = Depends(get_db),
    limit: int = 20,
) -> Any:
    """
    获取热门标签列表
    """
    tags = tag_service.get_popular_tags(db=db, limit=limit)
    return tags