"""
文章相关API端点
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.api.v1.endpoints.deps import get_db, get_current_active_user
from app.schemas.post import Post, PostCreate, PostUpdate, PostList
from app.schemas.user import User
from app.services import post_service, user_service
from app.services.user_service import is_superuser
from app.services.post_service import (
    get_multi_with_filters, get as get_post, create_post_with_tags, 
    update_post_with_tags, increment_view_count, get_by_slug, get_popular_posts
)
from app.crud.post import post as post_crud

router = APIRouter()


@router.get("/", response_model=List[PostList])
def read_posts(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = Query(None, description="文章状态筛选"),
    category_id: Optional[int] = Query(None, description="分类ID筛选"),
    tag_id: Optional[int] = Query(None, description="标签ID筛选"),
    search: Optional[str] = Query(None, description="搜索关键词"),
) -> Any:
    """
    获取文章列表
    """
    posts = get_multi_with_filters(
        db, 
        skip=skip, 
        limit=limit,
        status=status,
        category_id=category_id,
        tag_id=tag_id,
        search=search
    )
    return posts


@router.get("/detail", response_model=Post)
def read_post_detail(
    db: Session = Depends(get_db),
    id: Optional[int] = Query(None, description="文章ID"),
    slug: Optional[str] = Query(None, description="文章别名"),
) -> Any:
    """
    获取单个文章详情（包含完整内容）
    注意：此接口不会自动增加浏览量，需要单独调用 /posts/view 接口
    """
    if not id and not slug:
        raise HTTPException(status_code=400, detail="必须提供文章ID或别名")
    
    # 如果提供了ID，返回单个文章
    if id is not None:
        post = get_post(db=db, id=id)
        if not post:
            raise HTTPException(status_code=404, detail="文章不存在")
        return post
    
    # 如果提供了slug，返回单个文章
    if slug is not None:
        post = get_by_slug(db=db, slug=slug)
        if not post:
            raise HTTPException(status_code=404, detail="文章不存在")
        return post


@router.post("/", response_model=Post)
def create_post(
    *,
    db: Session = Depends(get_db),
    post_in: PostCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    创建新文章
    """
    post = create_post_with_tags(db=db, obj_in=post_in, owner_id=current_user.id)
    return post


@router.put("/", response_model=Post)
def update_post(
    *,
    db: Session = Depends(get_db),
    post_id: int = Query(..., description="要更新的文章ID"),
    post_in: PostUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    更新文章
    """
    post = get_post(db=db, id=post_id)
    if not post:
        raise HTTPException(status_code=404, detail="文章不存在")
    if not is_superuser(current_user) and (post.author_id != current_user.id):
        raise HTTPException(status_code=400, detail="权限不足")
    post = update_post_with_tags(db=db, db_obj=post, obj_in=post_in)
    return post


@router.delete("/")
def delete_post(
    *,
    db: Session = Depends(get_db),
    post_id: int = Query(..., description="要删除的文章ID"),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    删除文章
    """
    post = get_post(db=db, id=post_id)
    if not post:
        raise HTTPException(status_code=404, detail="文章不存在")
    if not is_superuser(current_user) and (post.author_id != current_user.id):
        raise HTTPException(status_code=400, detail="权限不足")
    post = post_crud.remove(db=db, id=post_id)
    return {"message": "文章删除成功"}


@router.post("/view")
def increment_post_view(
    *,
    request: Request,
    db: Session = Depends(get_db),
    post_id: int = Query(..., description="要增加浏览量的文章ID"),
) -> Any:
    """
    增加文章浏览量
    """
    post = get_post(db=db, id=post_id)
    if not post:
        raise HTTPException(status_code=404, detail="文章不存在")
    
    # 获取客户端IP
    client_ip = request.client.host if request.client else "unknown"
    
    # 增加浏览次数（带防重复机制）
    success = increment_view_count(db=db, post_id=post_id, client_ip=client_ip)
    
    return {
        "message": "浏览量更新成功" if success else "重复浏览，未增加计数",
        "incremented": success
    }


@router.post("/like")
def like_post(
    *,
    db: Session = Depends(get_db),
    post_id: int = Query(..., description="要点赞的文章ID"),
) -> Any:
    """
    点赞文章
    """
    post = get_post(db=db, id=post_id)
    if not post:
        raise HTTPException(status_code=404, detail="文章不存在")
    
    # 简单的点赞实现 - 这里需要实现真正的点赞逻辑
    # post_crud.increment_like_count(db=db, post_id=post_id)
    # 暂时返回成功消息
    
    return {"message": "点赞成功"}


@router.get("/featured/", response_model=List[PostList])
def read_featured_posts(
    db: Session = Depends(get_db),
    limit: int = 10,
) -> Any:
    """
    获取精选文章列表
    """
    posts = get_popular_posts(db=db, limit=limit)
    return posts