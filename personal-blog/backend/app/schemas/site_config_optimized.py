"""
优化后的网站配置Schema定义
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from app.models.site_config import ConfigCategory, ConfigDataType
import json


class ConfigChangeRequest(BaseModel):
    """单个配置变更请求"""
    key: str = Field(..., description="配置键名")
    value: Optional[str] = Field(None, description="配置值")
    operation: str = Field("update", description="操作类型: update, delete")


class ConfigBatchRequest(BaseModel):
    """批量配置变更请求"""
    changes: List[ConfigChangeRequest] = Field(..., description="配置变更列表")
    category: Optional[ConfigCategory] = Field(None, description="限制变更的分类")


class ConfigDiffResponse(BaseModel):
    """配置差异响应"""
    changed: List[str] = Field(default_factory=list, description="已变更的配置键")
    added: List[str] = Field(default_factory=list, description="新增的配置键")
    deleted: List[str] = Field(default_factory=list, description="删除的配置键")
    errors: Dict[str, str] = Field(default_factory=dict, description="错误信息")


class ConfigValidationRequest(BaseModel):
    """配置验证请求"""
    configs: List[Dict[str, Any]] = Field(..., description="待验证的配置项")


class ConfigValidationResponse(BaseModel):
    """配置验证响应"""
    valid: bool = Field(..., description="是否全部有效")
    errors: Dict[str, List[str]] = Field(default_factory=dict, description="验证错误")
    warnings: Dict[str, List[str]] = Field(default_factory=dict, description="警告信息")


class ConfigCacheInfo(BaseModel):
    """配置缓存信息"""
    last_modified: datetime = Field(..., description="最后修改时间")
    version: str = Field(..., description="配置版本号")
    checksum: str = Field(..., description="配置校验和")


class SiteConfigOptimized(BaseModel):
    """优化后的配置项响应"""
    id: int
    key: str
    value: Optional[str]
    category: ConfigCategory
    description: Optional[str]
    data_type: ConfigDataType
    is_public: str
    sort_order: int
    created_at: datetime
    updated_at: datetime
    version: Optional[str] = Field(None, description="配置版本")

    class Config:
        from_attributes = True


class ConfigSyncRequest(BaseModel):
    """配置同步请求"""
    client_version: Optional[str] = Field(None, description="客户端配置版本")
    last_sync: Optional[datetime] = Field(None, description="最后同步时间")


class ConfigSyncResponse(BaseModel):
    """配置同步响应"""
    configs: List[SiteConfigOptimized] = Field(default_factory=list, description="配置数据")
    cache_info: ConfigCacheInfo = Field(..., description="缓存信息")
    has_changes: bool = Field(..., description="是否有变更")