from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class ConfigCategory(str, enum.Enum):
    BASIC = "basic"  # 基本信息
    CONTACT = "contact"  # 联系方式
    SOCIAL = "social"  # 社交媒体
    SEO = "seo"  # SEO设置
    OTHER = "other"  # 其他配置


class ConfigDataType(str, enum.Enum):
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    JSON = "json"
    URL = "url"
    EMAIL = "email"
    BINARY = "binary"


class SiteConfig(Base):
    __tablename__ = "site_configs"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False, comment="配置键名")
    value = Column(Text, comment="配置值")
    category = Column(Enum(ConfigCategory), nullable=False, comment="配置分类")
    description = Column(String(255), comment="配置描述")
    data_type = Column(Enum(ConfigDataType), default=ConfigDataType.STRING, comment="数据类型")
    is_public = Column(String(10), default="true", comment="是否公开显示")
    sort_order = Column(Integer, default=0, comment="排序顺序")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    def __repr__(self):
        return f"<SiteConfig(key='{self.key}', value='{self.value}')>"