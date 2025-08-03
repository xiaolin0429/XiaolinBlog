"""
优化后的网站配置API端点
"""
from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
import hashlib
import json

from app import crud, models
from app.api.v1.endpoints import deps
from app.models.site_config import ConfigCategory
from app.schemas.site_config_optimized import (
    ConfigBatchRequest,
    ConfigDiffResponse,
    ConfigValidationRequest,
    ConfigValidationResponse,
    ConfigSyncRequest,
    ConfigSyncResponse,
    SiteConfigOptimized,
    ConfigCacheInfo
)
from app.core.cache import redis_client
from app.core.logger_utils import get_logger

logger = get_logger(__name__)
router = APIRouter()

# 配置缓存键前缀
CACHE_PREFIX = "site_config"
CACHE_TTL = 3600  # 1小时


class ConfigManager:
    """配置管理器"""
    
    @staticmethod
    def generate_version(configs: List[models.SiteConfig]) -> str:
        """生成配置版本号"""
        config_data = {
            config.key: {
                'value': config.value,
                'updated_at': config.updated_at.isoformat()
            }
            for config in configs
        }
        content = json.dumps(config_data, sort_keys=True)
        return hashlib.md5(content.encode()).hexdigest()[:16]
    
    @staticmethod
    def generate_checksum(configs: List[models.SiteConfig]) -> str:
        """生成配置校验和"""
        values = [f"{config.key}:{config.value}" for config in sorted(configs, key=lambda x: x.key)]
        content = "|".join(values)
        return hashlib.sha256(content.encode()).hexdigest()[:32]
    
    @staticmethod
    async def invalidate_cache():
        """清除配置缓存"""
        try:
            pattern = f"{CACHE_PREFIX}:*"
            keys = await redis_client.keys(pattern)
            if keys:
                await redis_client.delete(*keys)
        except Exception as e:
            logger.warning(f"清除配置缓存失败: {e}")


@router.post("/validate", response_model=ConfigValidationResponse)
async def validate_configs(
    *,
    db: Session = Depends(deps.get_db),
    request: ConfigValidationRequest,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    验证配置项（不保存）
    """
    errors = {}
    warnings = {}
    
    for config_data in request.configs:
        key = config_data.get('key')
        value = config_data.get('value', '')
        data_type = config_data.get('data_type', 'string')
        
        if not key:
            continue
            
        # 数据类型验证
        field_errors = []
        field_warnings = []
        
        try:
            if data_type == 'email' and value:
                import re
                if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', value):
                    field_errors.append('邮箱格式不正确')
            elif data_type == 'url' and value:
                import re
                if not re.match(r'^https?://[^\s/$.?#].[^\s]*$', value):
                    field_errors.append('URL格式不正确')
            elif data_type == 'json' and value:
                json.loads(value)
            elif data_type == 'number' and value:
                float(value)
            elif data_type == 'boolean' and value:
                if value.lower() not in ['true', 'false', '1', '0']:
                    field_errors.append('布尔值格式不正确')
        except (json.JSONDecodeError, ValueError) as e:
            field_errors.append(f'数据格式错误: {str(e)}')
        
        # 长度检查
        if value and len(value) > 5000:
            field_warnings.append('配置值过长，可能影响性能')
        
        if field_errors:
            errors[key] = field_errors
        if field_warnings:
            warnings[key] = field_warnings
    
    return ConfigValidationResponse(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings
    )


@router.post("/batch-optimized", response_model=ConfigDiffResponse)
async def batch_update_optimized(
    *,
    db: Session = Depends(deps.get_db),
    request: ConfigBatchRequest,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    优化的批量更新配置项
    """
    changed = []
    added = []
    deleted = []
    errors = {}
    
    try:
        for change in request.changes:
            key = change.key
            value = change.value
            operation = change.operation
            
            try:
                if operation == "delete":
                    config = crud.site_config.get_by_key(db, key=key)
                    if config:
                        crud.site_config.delete_by_key(db, key=key)
                        deleted.append(key)
                elif operation == "update":
                    existing_config = crud.site_config.get_by_key(db, key=key)
                    if existing_config:
                        if existing_config.value != value:
                            crud.site_config.update_by_key(db, key=key, value=value or "")
                            changed.append(key)
                    else:
                        # 如果指定了分类限制，只在该分类下创建
                        if request.category:
                            from app.schemas.site_config import SiteConfigCreate
                            config_create = SiteConfigCreate(
                                key=key,
                                value=value or "",
                                category=request.category,
                                description=f"自动创建的{key}配置项"
                            )
                            crud.site_config.create(db, obj_in=config_create)
                            added.append(key)
                        else:
                            errors[key] = "配置项不存在且未指定分类"
            except Exception as e:
                errors[key] = str(e)
        
        # 后台任务：清除缓存
        background_tasks.add_task(ConfigManager.invalidate_cache)
        
        logger.info(f"批量更新配置完成: 变更{len(changed)}项, 新增{len(added)}项, 删除{len(deleted)}项")
        
    except Exception as e:
        logger.error(f"批量更新配置失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"批量更新失败: {str(e)}"
        )
    
    return ConfigDiffResponse(
        changed=changed,
        added=added,
        deleted=deleted,
        errors=errors
    )


@router.post("/sync", response_model=ConfigSyncResponse)
async def sync_configs(
    *,
    db: Session = Depends(deps.get_db),
    request: ConfigSyncRequest,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    配置同步接口（支持增量更新）
    """
    # 获取所有配置
    configs = crud.site_config.get_multi(db, limit=1000)
    
    # 生成缓存信息
    current_version = ConfigManager.generate_version(configs)
    current_checksum = ConfigManager.generate_checksum(configs)
    last_modified = max((config.updated_at for config in configs), default=datetime.now())
    
    cache_info = ConfigCacheInfo(
        last_modified=last_modified,
        version=current_version,
        checksum=current_checksum
    )
    
    # 检查是否有变更
    has_changes = True
    if request.client_version and request.client_version == current_version:
        has_changes = False
        configs = []  # 无变更时不返回配置数据
    
    # 转换为优化的响应格式
    config_responses = [
        SiteConfigOptimized(
            id=config.id,
            key=config.key,
            value=config.value,
            category=config.category,
            description=config.description,
            data_type=config.data_type,
            is_public=config.is_public,
            sort_order=config.sort_order,
            created_at=config.created_at,
            updated_at=config.updated_at,
            version=current_version
        )
        for config in configs
    ]
    
    return ConfigSyncResponse(
        configs=config_responses,
        cache_info=cache_info,
        has_changes=has_changes
    )


@router.get("/cache-info", response_model=ConfigCacheInfo)
async def get_cache_info(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    获取配置缓存信息
    """
    configs = crud.site_config.get_multi(db, limit=1000)
    
    return ConfigCacheInfo(
        last_modified=max((config.updated_at for config in configs), default=datetime.now()),
        version=ConfigManager.generate_version(configs),
        checksum=ConfigManager.generate_checksum(configs)
    )


@router.delete("/cache", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cache(
    *,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    清除配置缓存
    """
    await ConfigManager.invalidate_cache()
    logger.info("配置缓存已清除")