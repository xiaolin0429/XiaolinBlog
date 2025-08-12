"""
博客配置 Pydantic 模型
用于请求和响应数据的验证和序列化
"""

from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, validator
from app.models.blog_config import ConfigCategory, ConfigDataType


# ============ 基础模型 ============

class ConfigGroupBase(BaseModel):
    """配置分组基础模型"""
    group_key: str = Field(..., min_length=1, max_length=100, description="分组键名")
    group_name: str = Field(..., min_length=1, max_length=200, description="分组显示名称")
    category: ConfigCategory = Field(..., description="所属配置分类")
    icon_name: Optional[str] = Field(None, max_length=100, description="分组图标名称")
    color_scheme: Optional[str] = Field(None, max_length=100, description="分组颜色方案")
    description: Optional[str] = Field(None, description="分组描述")
    display_order: int = Field(default=0, description="显示顺序")
    is_active: bool = Field(default=True, description="是否激活")


class BlogConfigBase(BaseModel):
    """博客配置基础模型"""
    config_key: str = Field(..., min_length=1, max_length=100, description="配置键名")
    config_value: Optional[str] = Field(None, description="配置值")
    default_value: Optional[str] = Field(None, description="默认值")
    category: ConfigCategory = Field(..., description="配置分类")
    group_key: Optional[str] = Field(None, max_length=100, description="所属分组键名")
    data_type: ConfigDataType = Field(default=ConfigDataType.STRING, description="数据类型")
    
    # 显示相关字段
    display_name: str = Field(..., min_length=1, max_length=200, description="显示名称")
    description: Optional[str] = Field(None, description="配置描述")
    placeholder: Optional[str] = Field(None, max_length=500, description="输入提示文本")
    help_text: Optional[str] = Field(None, description="帮助说明")
    
    # 验证和约束
    validation_rules: Optional[Dict[str, Any]] = Field(None, description="验证规则")
    options: Optional[List[Dict[str, Any]]] = Field(None, description="选择项配置")
    is_required: bool = Field(default=False, description="是否必填")
    is_public: bool = Field(default=True, description="是否公开显示")
    is_enabled: bool = Field(default=True, description="是否启用")
    
    # 排序
    sort_order: int = Field(default=0, description="排序顺序")


# ============ 创建模型 ============

class ConfigGroupCreate(ConfigGroupBase):
    """创建配置分组"""
    pass


class BlogConfigCreate(BlogConfigBase):
    """创建博客配置"""
    pass


# ============ 更新模型 ============

class ConfigGroupUpdate(BaseModel):
    """更新配置分组"""
    group_name: Optional[str] = Field(None, min_length=1, max_length=200, description="分组显示名称")
    category: Optional[ConfigCategory] = Field(None, description="所属配置分类")
    icon_name: Optional[str] = Field(None, max_length=100, description="分组图标名称")
    color_scheme: Optional[str] = Field(None, max_length=100, description="分组颜色方案")
    description: Optional[str] = Field(None, description="分组描述")
    display_order: Optional[int] = Field(None, description="显示顺序")
    is_active: Optional[bool] = Field(None, description="是否激活")


class BlogConfigUpdate(BaseModel):
    """更新博客配置"""
    config_value: Optional[str] = Field(None, description="配置值")
    default_value: Optional[str] = Field(None, description="默认值")
    category: Optional[ConfigCategory] = Field(None, description="配置分类")
    group_key: Optional[str] = Field(None, max_length=100, description="所属分组键名")
    data_type: Optional[ConfigDataType] = Field(None, description="数据类型")
    
    display_name: Optional[str] = Field(None, min_length=1, max_length=200, description="显示名称")
    description: Optional[str] = Field(None, description="配置描述")
    placeholder: Optional[str] = Field(None, max_length=500, description="输入提示文本")
    help_text: Optional[str] = Field(None, description="帮助说明")
    
    validation_rules: Optional[Dict[str, Any]] = Field(None, description="验证规则")
    options: Optional[List[Dict[str, Any]]] = Field(None, description="选择项配置")
    is_required: Optional[bool] = Field(None, description="是否必填")
    is_public: Optional[bool] = Field(None, description="是否公开显示")
    is_enabled: Optional[bool] = Field(None, description="是否启用")
    
    sort_order: Optional[int] = Field(None, description="排序顺序")


# ============ 响应模型 ============

class ConfigGroupResponse(ConfigGroupBase):
    """配置分组响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BlogConfigResponse(BlogConfigBase):
    """博客配置响应模型"""
    id: int
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BlogConfigPublic(BaseModel):
    """公开的博客配置模型（用于前端展示）"""
    config_key: str
    config_value: Optional[str]
    data_type: ConfigDataType
    display_name: str
    description: Optional[str]

    class Config:
        from_attributes = True


# ============ 批量操作模型 ============

class ConfigValueUpdate(BaseModel):
    """配置值更新模型"""
    config_key: str = Field(..., description="配置键名")
    config_value: Optional[str] = Field(None, description="配置值")


class BatchConfigUpdate(BaseModel):
    """批量配置更新模型"""
    configs: List[ConfigValueUpdate] = Field(..., description="配置列表")
    change_reason: Optional[str] = Field(None, max_length=500, description="变更原因")


# ============ 查询模型 ============

class ConfigQuery(BaseModel):
    """配置查询模型"""
    category: Optional[ConfigCategory] = Field(None, description="配置分类")
    group_key: Optional[str] = Field(None, description="分组键名")
    is_enabled: Optional[bool] = Field(None, description="是否启用")
    is_public: Optional[bool] = Field(None, description="是否公开")
    search: Optional[str] = Field(None, description="搜索关键词")


# ============ 分组配置响应模型 ============

class GroupedConfigResponse(BaseModel):
    """分组配置响应模型"""
    group: ConfigGroupResponse
    configs: List[BlogConfigResponse]


class CategoryConfigResponse(BaseModel):
    """分类配置响应模型"""
    category: ConfigCategory
    category_name: str
    groups: List[GroupedConfigResponse]


# ============ 配置历史模型 ============

class ConfigHistoryResponse(BaseModel):
    """配置历史响应模型"""
    id: int
    config_key: str
    old_value: Optional[str]
    new_value: Optional[str]
    change_reason: Optional[str]
    changed_by: Optional[int]
    changed_at: datetime

    class Config:
        from_attributes = True


# ============ 配置统计模型 ============

class ConfigStats(BaseModel):
    """配置统计模型"""
    total_configs: int
    enabled_configs: int
    public_configs: int
    categories_count: int
    groups_count: int
    last_updated: Optional[datetime]


# ============ 验证器 ============

class BlogConfigValidator:
    """博客配置验证器"""
    
    @staticmethod
    def validate_config_value(value: str, data_type: ConfigDataType, validation_rules: Optional[Dict[str, Any]] = None) -> bool:
        """验证配置值"""
        if not validation_rules:
            return True
            
        # 基础验证
        if validation_rules.get("required", False) and not value:
            return False
            
        if not value:
            return True
            
        # 长度验证
        if "min_length" in validation_rules and len(value) < validation_rules["min_length"]:
            return False
        if "max_length" in validation_rules and len(value) > validation_rules["max_length"]:
            return False
            
        # 类型特定验证
        if data_type == ConfigDataType.EMAIL:
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            return bool(re.match(email_pattern, value))
            
        elif data_type == ConfigDataType.URL:
            import re
            url_pattern = r'^https?://[^\s/$.?#].[^\s]*$'
            return bool(re.match(url_pattern, value))
            
        elif data_type == ConfigDataType.COLOR:
            import re
            color_pattern = r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
            return bool(re.match(color_pattern, value))
            
        elif data_type == ConfigDataType.NUMBER:
            try:
                float(value)
                return True
            except ValueError:
                return False
                
        elif data_type == ConfigDataType.BOOLEAN:
            return value.lower() in ['true', 'false', '1', '0', 'yes', 'no']
            
        elif data_type == ConfigDataType.JSON:
            try:
                import json
                json.loads(value)
                return True
            except (json.JSONDecodeError, TypeError):
                return False
                
        return True


# ============ 响应包装模型 ============

class ApiResponse(BaseModel):
    """API响应包装模型"""
    success: bool = True
    message: str = "操作成功"
    data: Optional[Any] = None
    errors: Optional[List[str]] = None


class PaginatedResponse(BaseModel):
    """分页响应模型"""
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int