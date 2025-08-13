"""
博客配置数据模型
重新设计的配置管理系统，支持分组、类型验证、版本控制等功能
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, Enum as SQLEnum
from sqlalchemy.sql import func
from app.core.config.database import Base
import enum


class ConfigCategory(str, enum.Enum):
    """配置分类枚举"""
    SITE_BASIC = "site_basic"           # 站点基础配置
    SITE_APPEARANCE = "site_appearance"  # 外观主题配置
    SEO = "seo"                         # SEO配置
    SOCIAL = "social"                   # 社交媒体配置
    COMMENT = "comment"                 # 评论系统配置
    EMAIL = "email"                     # 邮件通知配置
    SYSTEM = "system"                   # 系统配置


class ConfigDataType(str, enum.Enum):
    """配置数据类型枚举"""
    STRING = "string"       # 字符串
    TEXT = "text"          # 长文本
    NUMBER = "number"      # 数字
    BOOLEAN = "boolean"    # 布尔值
    JSON = "json"          # JSON对象
    URL = "url"            # URL链接
    EMAIL = "email"        # 邮箱地址
    COLOR = "color"        # 颜色值
    IMAGE = "image"        # 图片（base64或URL）
    SELECT = "select"      # 选择项
    MULTI_SELECT = "multi_select"  # 多选项


class ConfigGroup(Base):
    """配置分组表"""
    __tablename__ = "config_groups"

    id = Column(Integer, primary_key=True, index=True)
    group_key = Column(String(100), unique=True, index=True, nullable=False, comment="分组键名")
    group_name = Column(String(200), nullable=False, comment="分组显示名称")
    category = Column(SQLEnum(ConfigCategory), nullable=False, comment="所属配置分类")
    icon_name = Column(String(100), comment="分组图标名称")
    color_scheme = Column(String(100), comment="分组颜色方案")
    description = Column(Text, comment="分组描述")
    display_order = Column(Integer, default=0, comment="显示顺序")
    is_active = Column(Boolean, default=True, comment="是否激活")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    def __repr__(self):
        return f"<ConfigGroup(group_key='{self.group_key}', group_name='{self.group_name}')>"


class BlogConfig(Base):
    """博客配置表"""
    __tablename__ = "blog_configs"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(100), unique=True, index=True, nullable=False, comment="配置键名")
    config_value = Column(Text, comment="配置值")
    default_value = Column(Text, comment="默认值")
    category = Column(SQLEnum(ConfigCategory), nullable=False, comment="配置分类")
    group_key = Column(String(100), comment="所属分组键名")
    data_type = Column(SQLEnum(ConfigDataType), default=ConfigDataType.STRING, comment="数据类型")
    
    # 显示相关字段
    display_name = Column(String(200), nullable=False, comment="显示名称")
    description = Column(Text, comment="配置描述")
    placeholder = Column(String(500), comment="输入提示文本")
    help_text = Column(Text, comment="帮助说明")
    
    # 验证和约束
    validation_rules = Column(JSON, comment="验证规则（JSON格式）")
    options = Column(JSON, comment="选择项配置（用于select类型）")
    is_required = Column(Boolean, default=False, comment="是否必填")
    is_public = Column(Boolean, default=True, comment="是否公开显示")
    is_enabled = Column(Boolean, default=True, comment="是否启用")
    
    # 排序和分组
    sort_order = Column(Integer, default=0, comment="排序顺序")
    
    # 版本控制
    version = Column(Integer, default=1, comment="配置版本")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    def __repr__(self):
        return f"<BlogConfig(config_key='{self.config_key}', display_name='{self.display_name}')>"


class ConfigHistory(Base):
    """配置变更历史表"""
    __tablename__ = "config_histories"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(100), nullable=False, comment="配置键名")
    old_value = Column(Text, comment="旧值")
    new_value = Column(Text, comment="新值")
    change_reason = Column(String(500), comment="变更原因")
    changed_by = Column(Integer, comment="变更用户ID")
    changed_at = Column(DateTime(timezone=True), server_default=func.now(), comment="变更时间")

    def __repr__(self):
        return f"<ConfigHistory(config_key='{self.config_key}', changed_at='{self.changed_at}')>"


class ConfigCache(Base):
    """配置缓存表"""
    __tablename__ = "config_caches"

    id = Column(Integer, primary_key=True, index=True)
    cache_key = Column(String(200), unique=True, index=True, nullable=False, comment="缓存键名")
    cache_data = Column(JSON, nullable=False, comment="缓存数据")
    category = Column(SQLEnum(ConfigCategory), comment="配置分类")
    expires_at = Column(DateTime(timezone=True), nullable=False, comment="过期时间")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    def __repr__(self):
        return f"<ConfigCache(cache_key='{self.cache_key}', expires_at='{self.expires_at}')>"