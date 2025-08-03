"""
评论相关API端点
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session

from app.api.v1.endpoints.deps import get_db, get_current_active_user
from app.schemas.comment import Comment, CommentCreate, CommentUpdate
from app.schemas.user import User
from app.services import comment_service, user_service, post_service

router = APIRouter()


@router.get("/", response_model=List[Comment])
def read_comments(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
    post_id: Optional[int] = None,
    is_approved: Optional[bool] = None,
    request: Request = None,
) -> Any:
    """
    获取评论列表
    - 前台调用时默认只返回已审核评论
    - 管理后台可以通过is_approved参数控制，或者通过认证状态判断
    """
    # 尝试获取当前用户（如果有认证的话）
    current_user = None
    if request:
        authorization = request.headers.get("authorization")
        if authorization:
            try:
                current_user = user_service.get_current_user_optional(db=db, authorization=authorization)
            except:
                pass
    
    # 如果没有明确指定is_approved参数，根据用户权限决定默认行为
    if is_approved is None:
        # 如果是管理员用户，默认返回所有评论（包括待审核）
        if current_user and user_service.is_superuser(current_user):
            is_approved = None  # 不过滤，返回所有状态的评论
        else:
            # 前台用户或未认证用户，只返回已审核的评论
            is_approved = True
        
    comments = comment_service.get_multi_with_filters(
        db, 
        skip=skip, 
        limit=limit,
        post_id=post_id,
        is_approved=is_approved
    )
    return comments


@router.post("/", response_model=Comment)
def create_comment(
    *,
    db: Session = Depends(get_db),
    comment_in: CommentCreate,
    request: Request,
) -> Any:
    """
    创建新评论
    """
    # 检查文章是否存在
    post = post_service.get(db=db, id=comment_in.post_id)
    if not post:
        raise HTTPException(status_code=404, detail="文章不存在")
    
    # 如果指定了父评论，检查父评论是否存在
    if comment_in.parent_id:
        parent_comment = comment_service.get(db=db, id=comment_in.parent_id)
        if not parent_comment:
            raise HTTPException(status_code=404, detail="父评论不存在")
        if parent_comment.post_id != comment_in.post_id:
            raise HTTPException(status_code=400, detail="父评论不属于该文章")
    
    # 获取Authorization头
    authorization = request.headers.get("authorization")
    
    # 获取当前用户（如果有认证的话）
    current_user = user_service.get_current_user_optional(db=db, authorization=authorization)
    
    # 获取客户端IP和User-Agent
    client_ip = request.client.host
    user_agent = request.headers.get("user-agent", "")
    
    comment = comment_service.create_with_metadata(
        db=db, 
        obj_in=comment_in, 
        author_id=current_user.id if current_user else None,
        ip_address=client_ip,
        user_agent=user_agent
    )
    return comment


@router.put("/update", response_model=Comment)
def update_comment(
    *,
    db: Session = Depends(get_db),
    comment_id: int = Query(..., description="要更新的评论ID"),
    comment_in: CommentUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    更新评论
    """
    comment = comment_service.get(db=db, id=comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")
    
    # 检查权限：只有评论作者或管理员可以编辑
    if not user_service.is_superuser(current_user) and comment.author_id != current_user.id:
        raise HTTPException(status_code=400, detail="权限不足")
    
    comment = comment_service.update(db=db, db_obj=comment, obj_in=comment_in)
    return comment


@router.get("/detail", response_model=Comment)
def read_comment(
    *,
    db: Session = Depends(get_db),
    comment_id: int = Query(..., description="评论ID"),
) -> Any:
    """
    根据ID获取评论详情
    """
    comment = comment_service.get(db=db, id=comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")
    return comment


@router.delete("/delete")
def delete_comment(
    *,
    db: Session = Depends(get_db),
    comment_id: int = Query(..., description="要删除的评论ID"),
    current_user: User = Depends(user_service.get_current_active_user),
) -> Any:
    """
    删除评论
    """
    comment = comment_service.get(db=db, id=comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")
    
    # 检查权限：只有评论作者或管理员可以删除
    if not user_service.is_superuser(current_user) and comment.author_id != current_user.id:
        raise HTTPException(status_code=400, detail="权限不足")
    
    comment_service.remove(db=db, id=comment_id)
    return {"message": "评论删除成功"}


@router.post("/approve")
def approve_comment(
    *,
    db: Session = Depends(get_db),
    comment_id: int = Query(..., description="要审核的评论ID"),
    current_user: User = Depends(user_service.get_current_active_user),
) -> Any:
    """
    审核通过评论（仅管理员）
    """
    if not user_service.is_superuser(current_user):
        raise HTTPException(status_code=400, detail="权限不足")
    
    comment = comment_service.get(db=db, id=comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")
    
    comment_service.approve_comment(db=db, comment_id=comment_id)
    return {"message": "评论审核通过"}


@router.post("/reject")
def reject_comment(
    *,
    db: Session = Depends(get_db),
    comment_id: int = Query(..., description="要拒绝的评论ID"),
    current_user: User = Depends(user_service.get_current_active_user),
) -> Any:
    """
    拒绝评论（仅管理员）
    """
    if not user_service.is_superuser(current_user):
        raise HTTPException(status_code=400, detail="权限不足")
    
    comment = comment_service.get(db=db, id=comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")
    
    comment_service.reject_comment(db=db, comment_id=comment_id)
    return {"message": "评论已拒绝"}


@router.post("/like")
def like_comment(
    *,
    db: Session = Depends(get_db),
    comment_id: int = Query(..., description="要点赞的评论ID"),
) -> Any:
    """
    点赞评论
    """
    comment = comment_service.get(db=db, id=comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")
    
    comment_service.increment_like_count(db=db, comment_id=comment_id)
    return {"message": "点赞成功"}


