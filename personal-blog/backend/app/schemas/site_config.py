from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.models.site_config import ConfigCategory, ConfigDataType
import json


class SiteConfigBase(BaseModel):
    key: str = Field(..., min_length=1, max_length=100, description="配置键名")
    value: Optional[str] = Field(None, description="配置值")
    category: ConfigCategory = Field(..., description="配置分类")
    description: Optional[str] = Field(None, max_length=255, description="配置描述")
    data_type: ConfigDataType = Field(ConfigDataType.STRING, description="数据类型")
    is_public: str = Field("true", description="是否公开显示")
    sort_order: int = Field(0, description="排序顺序")

    @validator('value')
    def validate_value_by_type(cls, v, values):
        if v is None:
            return v
        
        data_type = values.get('data_type')
        if data_type == ConfigDataType.JSON:
            try:
                json.loads(v)
            except json.JSONDecodeError:
                raise ValueError('JSON格式不正确')
        elif data_type == ConfigDataType.NUMBER:
            try:
                float(v)
            except ValueError:
                raise ValueError('数字格式不正确')
        elif data_type == ConfigDataType.BOOLEAN:
            if v.lower() not in ['true', 'false', '1', '0']:
                raise ValueError('布尔值格式不正确')
        elif data_type == ConfigDataType.EMAIL:
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, v):
                raise ValueError('邮箱格式不正确')
        elif data_type == ConfigDataType.URL:
            import re
            url_pattern = r'^https?://[^\s/$.?#].[^\s]*$'
            if not re.match(url_pattern, v):
                raise ValueError('URL格式不正确')
        
        return v


class SiteConfigCreate(SiteConfigBase):
    pass


class SiteConfigUpdate(BaseModel):
    value: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[str] = None
    sort_order: Optional[int] = None


class SiteConfigResponse(SiteConfigBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SiteConfigBatchUpdateItem(BaseModel):
    """批量更新单个配置项"""
    key: str = Field(..., min_length=1, max_length=100, description="配置键名")
    value: str = Field(..., description="配置值")

    @validator('key')
    def validate_key(cls, v):
        if not v or not v.strip():
            raise ValueError('配置键名不能为空')
        return v.strip()

    @validator('value')
    def validate_value(cls, v):
        # 允许空字符串，但不允许None
        if v is None:
            raise ValueError('配置值不能为None')
        return str(v)


class SiteConfigBatchUpdate(BaseModel):
    """批量更新配置项请求"""
    configs: List[SiteConfigBatchUpdateItem] = Field(
        ..., 
        min_items=1, 
        max_items=50,
        description="批量更新的配置项列表"
    )

    @validator('configs')
    def validate_configs(cls, v):
        if not v:
            raise ValueError('配置项列表不能为空')
        
        # 检查重复的键名
        keys = [config.key for config in v]
        if len(keys) != len(set(keys)):
            raise ValueError('配置项中存在重复的键名')
        
        return v


class SiteConfigPublic(BaseModel):
    """公开的配置项，用于前台展示"""
    key: str
    value: Optional[str]
    category: ConfigCategory
    data_type: ConfigDataType

    class Config:
        from_attributes = True


class SocialConfigCreate(BaseModel):
    """创建社交媒体配置项"""
    key: str = Field(..., min_length=1, max_length=50, description="社交媒体平台标识")
    value: str = Field(..., min_length=1, description="社交媒体链接或账号")
    description: Optional[str] = Field(None, max_length=255, description="配置描述")

    @validator('key')
    def validate_key(cls, v):
        # 移除social_前缀（如果存在），后续会自动添加
        if v.startswith('social_'):
            v = v[7:]
        # 验证key格式：只允许字母、数字、下划线
        import re
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('平台标识只能包含字母、数字和下划线')
        return v.lower()


class SocialConfigUpdate(BaseModel):
    """更新社交媒体配置项"""
    value: Optional[str] = Field(None, description="社交媒体链接或账号")
    description: Optional[str] = Field(None, max_length=255, description="配置描述")


class SocialConfigResponse(BaseModel):
    """社交媒体配置响应"""
    id: int
    key: str
    value: Optional[str]
    description: Optional[str]
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
