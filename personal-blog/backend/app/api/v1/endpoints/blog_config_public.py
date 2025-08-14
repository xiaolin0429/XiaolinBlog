"""
博客配置公开 API 端点
提供无需认证的配置访问接口，用于前端展示
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .deps import get_db
from app.crud import blog_config, config_group
from app.models.blog_config import ConfigCategory
from app.schemas.blog_config import (
    BlogConfigPublic,
    ConfigGroupResponse
)

router = APIRouter()

# ============ 公开配置接口 ============

@router.get("/configs", response_model=List[BlogConfigPublic])
def get_all_public_configs(
    *,
    db: Session = Depends(get_db),
    category: Optional[ConfigCategory] = Query(None, description="配置分类")
) -> List[BlogConfigPublic]:
    """
    获取所有公开配置
    无需认证，用于前端展示
    """
    if category:
        configs = blog_config.get_by_category(db, category=category)
        public_configs = [c for c in configs if c.is_public and c.is_enabled]
    else:
        public_configs = blog_config.get_public_configs(db)
    
    return [
        BlogConfigPublic(
            config_key=config.config_key,
            config_value=config.config_value,
            data_type=config.data_type,
            display_name=config.display_name,
            description=config.description
        )
        for config in public_configs
    ]


@router.get("/configs/key/{config_key}", response_model=BlogConfigPublic)
def get_public_config_by_key(
    *,
    db: Session = Depends(get_db),
    config_key: str
) -> BlogConfigPublic:
    """
    根据键名获取公开配置
    无需认证，用于前端展示
    """
    config = blog_config.get_by_key(db=db, config_key=config_key)
    if not config or not config.is_public or not config.is_enabled:
        raise HTTPException(
            status_code=404,
            detail="配置不存在或不可访问"
        )
    
    return BlogConfigPublic(
        config_key=config.config_key,
        config_value=config.config_value,
        data_type=config.data_type,
        display_name=config.display_name,
        description=config.description
    )


@router.get("/groups", response_model=List[ConfigGroupResponse])
def get_public_config_groups(
    *,
    db: Session = Depends(get_db),
    category: Optional[ConfigCategory] = Query(None, description="配置分类")
) -> List[ConfigGroupResponse]:
    """
    获取公开配置分组
    无需认证，用于前端展示
    """
    groups = config_group.get_multi(
        db,
        category=category,
        is_active=True,
        limit=1000
    )
    return groups


@router.get("/site-info", response_model=Dict[str, Any])
def get_site_info(
    *,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    获取网站基础信息
    无需认证，用于前端展示
    """
    # 获取站点基础配置
    site_configs = blog_config.get_by_category(db, category=ConfigCategory.SITE_BASIC)
    public_site_configs = [c for c in site_configs if c.is_public and c.is_enabled]
    
    # 获取SEO配置
    seo_configs = blog_config.get_by_category(db, category=ConfigCategory.SEO)
    public_seo_configs = [c for c in seo_configs if c.is_public and c.is_enabled]
    
    # 获取社交媒体配置
    social_configs = blog_config.get_by_category(db, category=ConfigCategory.SOCIAL)
    public_social_configs = [c for c in social_configs if c.is_public and c.is_enabled]
    
    # 组织数据
    result = {
        "site": {},
        "seo": {},
        "social": {}
    }
    
    for config in public_site_configs:
        result["site"][config.config_key] = config.config_value
    
    for config in public_seo_configs:
        result["seo"][config.config_key] = config.config_value
        
    for config in public_social_configs:
        result["social"][config.config_key] = config.config_value
    
    return result