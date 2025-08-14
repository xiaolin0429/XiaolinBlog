"""
博客配置 API 端点
提供博客配置管理的 RESTful 接口
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .deps import get_db, get_current_active_superuser
from app.crud import blog_config, config_group
from app.models.user import User
from app.models.blog_config import ConfigCategory
from app.schemas.blog_config import (
    BlogConfigResponse,
    BlogConfigCreate,
    BlogConfigUpdate,
    BlogConfigPublic,
    ConfigGroupResponse,
    ConfigGroupCreate,
    ConfigGroupUpdate,
    BatchConfigUpdate,
    CategoryConfigResponse,
    GroupedConfigResponse,
    ConfigStats,
    ApiResponse,
    PaginatedResponse
)

router = APIRouter()

# ============ 博客配置管理接口 ============

@router.get("/", response_model=List[BlogConfigResponse])
def get_configs(
    *,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    category: Optional[ConfigCategory] = Query(None, description="配置分类"),
    group_key: Optional[str] = Query(None, description="分组键名"),
    is_enabled: Optional[bool] = Query(None, description="是否启用"),
    is_public: Optional[bool] = Query(None, description="是否公开"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    current_user: User = Depends(get_current_active_superuser)
) -> List[BlogConfigResponse]:
    """
    获取博客配置列表（管理员接口）
    需要管理员权限
    """
    configs = blog_config.get_multi(
        db,
        skip=skip,
        limit=limit,
        category=category,
        group_key=group_key,
        is_enabled=is_enabled,
        is_public=is_public,
        search=search
    )
    return configs


@router.get("/public", response_model=List[BlogConfigPublic])
def get_public_configs(
    *,
    db: Session = Depends(get_db)
) -> List[BlogConfigPublic]:
    """
    获取公开的博客配置
    无需认证，用于前端展示
    """
    configs = blog_config.get_public_configs(db)
    return [
        BlogConfigPublic(
            config_key=config.config_key,
            config_value=config.config_value,
            data_type=config.data_type,
            display_name=config.display_name,
            description=config.description
        )
        for config in configs
    ]


@router.get("/category/{category}", response_model=List[BlogConfigResponse])
def get_configs_by_category(
    *,
    db: Session = Depends(get_db),
    category: ConfigCategory,
    current_user: User = Depends(get_current_active_superuser)
) -> List[BlogConfigResponse]:
    """
    根据分类获取配置
    需要管理员权限
    """
    configs = blog_config.get_by_category(db, category=category)
    return configs


@router.get("/grouped/{category}", response_model=List[GroupedConfigResponse])
def get_grouped_configs(
    *,
    db: Session = Depends(get_db),
    category: ConfigCategory,
    current_user: User = Depends(get_current_active_superuser)
) -> List[GroupedConfigResponse]:
    """
    获取分组的配置
    需要管理员权限
    """
    # 获取分组
    groups = config_group.get_multi(db, category=category, is_active=True)
    
    # 获取配置并按分组组织
    grouped_configs = blog_config.get_grouped_configs(db, category=category)
    
    result = []
    for group in groups:
        group_configs = grouped_configs.get(group.group_key, [])
        result.append(GroupedConfigResponse(
            group=group,
            configs=group_configs
        ))
    
    return result


@router.get("/{config_id}", response_model=BlogConfigResponse)
def get_config(
    *,
    db: Session = Depends(get_db),
    config_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> BlogConfigResponse:
    """
    根据ID获取配置
    需要管理员权限
    """
    config = blog_config.get(db=db, config_id=config_id)
    if not config:
        raise HTTPException(
            status_code=404,
            detail="配置不存在"
        )
    return config


@router.get("/key/{config_key}", response_model=BlogConfigResponse)
def get_config_by_key(
    *,
    db: Session = Depends(get_db),
    config_key: str,
    current_user: User = Depends(get_current_active_superuser)
) -> BlogConfigResponse:
    """
    根据键名获取配置
    需要管理员权限
    """
    config = blog_config.get_by_key(db=db, config_key=config_key)
    if not config:
        raise HTTPException(
            status_code=404,
            detail="配置不存在"
        )
    return config


@router.post("/", response_model=BlogConfigResponse)
def create_config(
    *,
    db: Session = Depends(get_db),
    config_in: BlogConfigCreate,
    current_user: User = Depends(get_current_active_superuser)
) -> BlogConfigResponse:
    """
    创建博客配置
    需要管理员权限
    """
    # 检查键名是否已存在
    existing_config = blog_config.get_by_key(db, config_key=config_in.config_key)
    if existing_config:
        raise HTTPException(
            status_code=400,
            detail="配置键名已存在"
        )
    
    config = blog_config.create(db=db, obj_in=config_in)
    return config


@router.put("/{config_id}", response_model=BlogConfigResponse)
def update_config(
    *,
    db: Session = Depends(get_db),
    config_id: int,
    config_in: BlogConfigUpdate,
    current_user: User = Depends(get_current_active_superuser)
) -> BlogConfigResponse:
    """
    更新博客配置
    需要管理员权限
    """
    config = blog_config.get(db=db, config_id=config_id)
    if not config:
        raise HTTPException(
            status_code=404,
            detail="配置不存在"
        )
    
    config = blog_config.update(db=db, db_obj=config, obj_in=config_in)
    return config


@router.put("/key/{config_key}", response_model=BlogConfigResponse)
def update_config_by_key(
    *,
    db: Session = Depends(get_db),
    config_key: str,
    config_value: Optional[str] = None,
    config_in: Optional[BlogConfigUpdate] = None,
    current_user: User = Depends(get_current_active_superuser)
) -> BlogConfigResponse:
    """
    根据键名更新配置
    需要管理员权限
    """
    config = blog_config.update_by_key(
        db=db,
        config_key=config_key,
        config_value=config_value,
        obj_in=config_in
    )
    if not config:
        raise HTTPException(
            status_code=404,
            detail="配置不存在"
        )
    return config


@router.post("/batch-update", response_model=List[BlogConfigResponse])
def batch_update_configs(
    *,
    db: Session = Depends(get_db),
    batch_data: BatchConfigUpdate,
    current_user: User = Depends(get_current_active_superuser)
) -> List[BlogConfigResponse]:
    """
    批量更新配置
    需要管理员权限
    """
    try:
        configs = blog_config.batch_update(db=db, batch_data=batch_data)
        return configs
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"批量更新失败: {str(e)}"
        )


@router.delete("/{config_id}", response_model=BlogConfigResponse)
def delete_config(
    *,
    db: Session = Depends(get_db),
    config_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> BlogConfigResponse:
    """
    删除博客配置
    需要管理员权限
    """
    config = blog_config.get(db=db, config_id=config_id)
    if not config:
        raise HTTPException(
            status_code=404,
            detail="配置不存在"
        )
    
    config = blog_config.delete(db=db, config_id=config_id)
    return config


# ============ 配置分组管理接口 ============

@router.get("/groups/", response_model=List[ConfigGroupResponse])
def get_config_groups(
    *,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[ConfigCategory] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_active_superuser)
) -> List[ConfigGroupResponse]:
    """
    获取配置分组列表
    需要管理员权限
    """
    groups = config_group.get_multi(
        db,
        skip=skip,
        limit=limit,
        category=category,
        is_active=is_active
    )
    return groups


@router.get("/groups/{group_id}", response_model=ConfigGroupResponse)
def get_config_group(
    *,
    db: Session = Depends(get_db),
    group_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> ConfigGroupResponse:
    """
    根据ID获取配置分组
    需要管理员权限
    """
    group = config_group.get(db=db, group_id=group_id)
    if not group:
        raise HTTPException(
            status_code=404,
            detail="配置分组不存在"
        )
    return group


@router.post("/groups/", response_model=ConfigGroupResponse)
def create_config_group(
    *,
    db: Session = Depends(get_db),
    group_in: ConfigGroupCreate,
    current_user: User = Depends(get_current_active_superuser)
) -> ConfigGroupResponse:
    """
    创建配置分组
    需要管理员权限
    """
    # 检查键名是否已存在
    existing_group = config_group.get_by_key(db, group_key=group_in.group_key)
    if existing_group:
        raise HTTPException(
            status_code=400,
            detail="分组键名已存在"
        )
    
    group = config_group.create(db=db, obj_in=group_in)
    return group


@router.put("/groups/{group_id}", response_model=ConfigGroupResponse)
def update_config_group(
    *,
    db: Session = Depends(get_db),
    group_id: int,
    group_in: ConfigGroupUpdate,
    current_user: User = Depends(get_current_active_superuser)
) -> ConfigGroupResponse:
    """
    更新配置分组
    需要管理员权限
    """
    group = config_group.get(db=db, group_id=group_id)
    if not group:
        raise HTTPException(
            status_code=404,
            detail="配置分组不存在"
        )
    
    group = config_group.update(db=db, db_obj=group, obj_in=group_in)
    return group


@router.delete("/groups/{group_id}", response_model=ConfigGroupResponse)
def delete_config_group(
    *,
    db: Session = Depends(get_db),
    group_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> ConfigGroupResponse:
    """
    删除配置分组
    需要管理员权限
    """
    group = config_group.get(db=db, group_id=group_id)
    if not group:
        raise HTTPException(
            status_code=404,
            detail="配置分组不存在"
        )
    
    group = config_group.delete(db=db, group_id=group_id)
    return group


# ============ 初始化和管理接口 ============

@router.post("/init-defaults", response_model=ApiResponse)
def init_default_configs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> ApiResponse:
    """
    初始化默认配置
    需要管理员权限
    """
    try:
        # 初始化默认分组
        created_groups = config_group.init_default_groups(db=db)
        
        # 初始化默认配置
        created_configs = blog_config.init_default_configs(db=db)
        
        return ApiResponse(
            success=True,
            message=f"初始化完成，创建了 {len(created_groups)} 个分组和 {len(created_configs)} 个配置项",
            data={
                "groups_created": len(created_groups),
                "configs_created": len(created_configs)
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"初始化失败: {str(e)}"
        )


# ============ 公开访问接口 ============

@router.get("/public/category/{category}", response_model=List[BlogConfigPublic])
def get_public_configs_by_category(
    *,
    db: Session = Depends(get_db),
    category: ConfigCategory
) -> List[BlogConfigPublic]:
    """
    根据分类获取公开配置
    无需认证，用于前端展示
    """
    configs = blog_config.get_by_category(db, category=category)
    public_configs = [c for c in configs if c.is_public and c.is_enabled]
    
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


@router.get("/public/key/{config_key}", response_model=BlogConfigPublic)
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


# 将stats路由移到前面，避免与/{config_id}路由冲突
@router.get("/stats/", response_model=ConfigStats)
def get_config_stats(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> ConfigStats:
    """
    获取配置统计信息（管理员接口）
    需要管理员权限
    """
    # 获取所有配置
    all_configs = blog_config.get_multi(db, limit=10000)
    enabled_configs = [c for c in all_configs if c.is_enabled]
    public_configs = [c for c in all_configs if c.is_public]
    
    # 获取分类数量
    categories = set(c.category for c in all_configs)
    
    # 获取分组数量
    all_groups = config_group.get_multi(db, limit=1000)
    
    # 获取最后更新时间
    last_updated = None
    if all_configs:
        last_updated = max(c.updated_at for c in all_configs)
    
    return ConfigStats(
        total_configs=len(all_configs),
        enabled_configs=len(enabled_configs),
        public_configs=len(public_configs),
        categories_count=len(categories),
        groups_count=len(all_groups),
        last_updated=last_updated
    )


# ============ 配置历史接口 ============

@router.get("/history/{config_key}")
def get_config_history(
    *,
    db: Session = Depends(get_db),
    config_key: str,
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_superuser)
):
    """
    获取配置变更历史
    需要管理员权限
    """
    history = blog_config.get_config_history(db, config_key=config_key, limit=limit)
    return history


# ============ 缓存管理接口 ============

@router.post("/cache/clear", response_model=ApiResponse)
def clear_config_cache(
    *,
    db: Session = Depends(get_db),
    category: Optional[ConfigCategory] = Query(None, description="指定分类，为空则清除所有缓存"),
    current_user: User = Depends(get_current_active_superuser)
) -> ApiResponse:
    """
    清除配置缓存
    需要管理员权限
    """
    try:
        if category:
            blog_config._clear_cache(db, category=category)
            message = f"已清除 {category.value} 分类的缓存"
        else:
            blog_config._clear_all_cache(db)
            message = "已清除所有配置缓存"
        
        return ApiResponse(
            success=True,
            message=message
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"清除缓存失败: {str(e)}"
        )