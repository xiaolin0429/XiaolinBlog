"""
公开统计数据 API 端点
提供前台页面展示的统计信息
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from .deps import get_db
from app.models.post import Post
from app.models.comment import Comment
from app.models.user import User

router = APIRouter()


@router.get("/site-stats")
def get_site_stats(
    *,
    db: Session = Depends(get_db)
) -> dict:
    """
    获取网站统计数据
    无需认证，用于前台页面展示
    """
    # 获取已发布文章数量
    published_posts_count = db.query(Post).filter(
        Post.status == "published"
    ).count()
    
    # 获取总浏览量（所有已发布文章的浏览量之和）
    total_views = db.query(func.sum(Post.view_count)).filter(
        Post.status == "published"
    ).scalar() or 0
    
    # 获取已审核评论数量
    approved_comments_count = db.query(Comment).filter(
        Comment.is_approved == True,
        Comment.is_spam == False
    ).count()
    
    # 格式化数字显示
    def format_number(num):
        if num >= 1000000:
            return f"{num/1000000:.1f}M"
        elif num >= 1000:
            return f"{num/1000:.1f}K"
        else:
            return str(num)
    
    return {
        "posts_count": published_posts_count,
        "posts_count_formatted": format_number(published_posts_count),
        "views_count": total_views,
        "views_count_formatted": format_number(total_views),
        "comments_count": approved_comments_count,
        "comments_count_formatted": format_number(approved_comments_count)
    }