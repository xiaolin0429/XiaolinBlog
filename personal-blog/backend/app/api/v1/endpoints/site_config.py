from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api.v1.endpoints import deps
from app.models.site_config import ConfigCategory
from app.schemas.site_config import (
    SiteConfigCreate,
    SiteConfigUpdate,
    SiteConfigResponse,
    SiteConfigBatchUpdate,
    SiteConfigPublic
)

router = APIRouter()


@router.get("/", response_model=List[SiteConfigResponse])
def read_configs(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    category: Optional[ConfigCategory] = None,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    获取配置项列表（需要管理员权限）
    """
    configs = crud.site_config.get_multi(
        db, skip=skip, limit=limit, category=category
    )
    return configs


@router.get("/public", response_model=List[SiteConfigPublic])
def read_public_configs(
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    获取公开的配置项（无需权限）
    """
    configs = crud.site_config.get_public_configs(db)
    return configs


@router.get("/category/{category}", response_model=List[SiteConfigResponse])
def read_configs_by_category(
    *,
    db: Session = Depends(deps.get_db),
    category: ConfigCategory,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    根据分类获取配置项
    """
    configs = crud.site_config.get_by_category(db, category=category)
    return configs


@router.get("/{config_id}", response_model=SiteConfigResponse)
def read_config(
    *,
    db: Session = Depends(deps.get_db),
    config_id: int,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    获取单个配置项
    """
    config = crud.site_config.get(db=db, config_id=config_id)
    if not config:
        raise HTTPException(
            status_code=404, detail="配置项不存在"
        )
    return config


@router.get("/key/{key}", response_model=SiteConfigResponse)
def read_config_by_key(
    *,
    db: Session = Depends(deps.get_db),
    key: str,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    根据键名获取配置项
    """
    config = crud.site_config.get_by_key(db=db, key=key)
    if not config:
        raise HTTPException(
            status_code=404, detail="配置项不存在"
        )
    return config


@router.post("/", response_model=SiteConfigResponse)
def create_config(
    *,
    db: Session = Depends(deps.get_db),
    config_in: SiteConfigCreate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    创建配置项
    """
    # 检查键名是否已存在
    existing_config = crud.site_config.get_by_key(db, key=config_in.key)
    if existing_config:
        raise HTTPException(
            status_code=400,
            detail="配置项键名已存在"
        )
    
    config = crud.site_config.create(db=db, obj_in=config_in)
    return config


@router.put("/{config_id}", response_model=SiteConfigResponse)
def update_config(
    *,
    db: Session = Depends(deps.get_db),
    config_id: int,
    config_in: SiteConfigUpdate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    更新配置项
    """
    config = crud.site_config.get(db=db, config_id=config_id)
    if not config:
        raise HTTPException(
            status_code=404, detail="配置项不存在"
        )
    
    config = crud.site_config.update(db=db, db_obj=config, obj_in=config_in)
    return config


@router.put("/key/{key}", response_model=SiteConfigResponse)
def update_config_by_key(
    *,
    db: Session = Depends(deps.get_db),
    key: str,
    value: str,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    根据键名更新配置项的值
    """
    config = crud.site_config.update_by_key(db=db, key=key, value=value)
    if not config:
        raise HTTPException(
            status_code=404, detail="配置项不存在"
        )
    return config


@router.post("/batch-update", response_model=List[SiteConfigResponse])
def batch_update_configs(
    *,
    db: Session = Depends(deps.get_db),
    batch_data: SiteConfigBatchUpdate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    批量更新配置项
    """
    try:
        # 验证批量更新数据
        if not batch_data.configs:
            raise HTTPException(
                status_code=400,
                detail="批量更新数据不能为空"
            )
        
        # 将Pydantic对象转换为字典格式，供CRUD层使用
        config_dicts = []
        for config in batch_data.configs:
            config_dicts.append({
                'key': config.key,
                'value': config.value
            })
        
        # 执行批量更新
        configs = crud.site_config.batch_update(db=db, configs=config_dicts)
        
        if not configs:
            raise HTTPException(
                status_code=404,
                detail="没有找到可更新的配置项"
            )
        
        return configs
        
    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        # 捕获其他异常并转换为HTTP异常
        raise HTTPException(
            status_code=500,
            detail=f"批量更新失败: {str(e)}"
        )


@router.delete("/{config_id}", response_model=SiteConfigResponse)
def delete_config(
    *,
    db: Session = Depends(deps.get_db),
    config_id: int,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    删除配置项
    """
    config = crud.site_config.get(db=db, config_id=config_id)
    if not config:
        raise HTTPException(
            status_code=404, detail="配置项不存在"
        )
    
    config = crud.site_config.delete(db=db, config_id=config_id)
    return config


@router.post("/init-defaults", response_model=List[SiteConfigResponse])
def init_default_configs(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    初始化默认配置项
    """
    configs = crud.site_config.init_default_configs(db=db)
    return configs