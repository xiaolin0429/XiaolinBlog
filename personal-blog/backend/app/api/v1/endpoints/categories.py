"""
分类相关API端点
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.v1.endpoints.deps import get_db, get_current_active_user
from app.schemas.category import Category, CategoryCreate, CategoryUpdate
from app.schemas.user import User
from app.services import category_service, user_service
from app.services.user_service import is_superuser

router = APIRouter()


@router.get("/", response_model=List[Category])
def read_categories(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    获取分类列表
    """
    categories = category_service.get_multi(db, skip=skip, limit=limit)
    return categories


@router.post("/", response_model=Category)
def create_category(
    *,
    db: Session = Depends(get_db),
    category_in: CategoryCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    创建新分类
    """
    if not is_superuser(current_user):
        raise HTTPException(status_code=400, detail="权限不足")
    
    # 检查分类名称是否已存在
    if category_service.get_by_name(db, name=category_in.name):
        raise HTTPException(status_code=400, detail="分类名称已存在")
    
    # 检查slug是否已存在
    if category_service.get_by_slug(db, slug=category_in.slug):
        raise HTTPException(status_code=400, detail="分类别名已存在")
    
    category = category_service.create(db=db, obj_in=category_in)
    return category


@router.put("/", response_model=Category)
def update_category(
    *,
    db: Session = Depends(get_db),
    category_id: int = Query(..., description="要更新的分类ID"),
    category_in: CategoryUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    更新分类
    """
    if not is_superuser(current_user):
        raise HTTPException(status_code=400, detail="权限不足")
    
    category = category_service.get(db=db, id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="分类不存在")
    
    # 检查分类名称是否已存在（排除当前分类）
    if category_in.name and category_in.name != category.name:
        if category_service.get_by_name(db, name=category_in.name):
            raise HTTPException(status_code=400, detail="分类名称已存在")
    
    # 检查slug是否已存在（排除当前分类）
    if category_in.slug and category_in.slug != category.slug:
        if category_service.get_by_slug(db, slug=category_in.slug):
            raise HTTPException(status_code=400, detail="分类别名已存在")
    
    category = category_service.update(db=db, db_obj=category, obj_in=category_in)
    return category


@router.delete("/")
def delete_category(
    *,
    db: Session = Depends(get_db),
    category_id: int = Query(..., description="要删除的分类ID"),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    删除分类
    """
    if not is_superuser(current_user):
        raise HTTPException(status_code=400, detail="权限不足")
    
    category = category_service.get(db=db, id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="分类不存在")
    
    # 检查是否有文章使用此分类
    if category.post_count > 0:
        raise HTTPException(status_code=400, detail="该分类下还有文章，无法删除")
    
    category_service.remove(db=db, id=category_id)
    return {"message": "分类删除成功"}
