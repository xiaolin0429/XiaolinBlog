"""
图库数据模型
独立的图片管理系统，支持图片上传、分类、标签等功能
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, BigInteger
from sqlalchemy.sql import func
from app.core.config.database import Base
import enum


class ImageCategory(str, enum.Enum):
    """图片分类枚举"""
    SITE_LOGO = "site_logo"           # 网站Logo
    SITE_ICON = "site_icon"           # 网站图标
    BANNER = "banner"                 # 横幅图片
    AVATAR = "avatar"                 # 头像图片
    POST_COVER = "post_cover"         # 文章封面
    POST_CONTENT = "post_content"     # 文章内容图片
    GALLERY = "gallery"               # 相册图片
    BACKGROUND = "background"         # 背景图片
    OTHER = "other"                   # 其他图片


class ImageStatus(str, enum.Enum):
    """图片状态枚举"""
    ACTIVE = "active"                 # 正常使用
    INACTIVE = "inactive"             # 暂停使用
    DELETED = "deleted"               # 已删除


class ImageGallery(Base):
    """图库主表"""
    __tablename__ = "image_gallery"

    id = Column(Integer, primary_key=True, index=True)
    
    # 基本信息
    filename = Column(String(255), nullable=False, comment="原始文件名")
    display_name = Column(String(255), comment="显示名称")
    description = Column(Text, comment="图片描述")
    alt_text = Column(String(500), comment="替代文本（用于SEO和无障碍）")
    
    # 文件信息
    file_path = Column(String(500), nullable=False, comment="文件存储路径")
    file_url = Column(String(500), nullable=False, comment="访问URL")
    file_size = Column(BigInteger, nullable=False, comment="文件大小（字节）")
    file_hash = Column(String(64), unique=True, index=True, comment="文件MD5哈希值")
    mime_type = Column(String(100), nullable=False, comment="MIME类型")
    
    # 图片属性
    width = Column(Integer, comment="图片宽度")
    height = Column(Integer, comment="图片高度")
    format = Column(String(20), comment="图片格式（jpg, png, webp等）")
    
    # 缩略图信息
    thumbnail_path = Column(String(500), comment="缩略图路径")
    thumbnail_url = Column(String(500), comment="缩略图URL")
    
    # 分类和标签
    category = Column(String(50), default=ImageCategory.OTHER.value, comment="图片分类")
    tags = Column(JSON, comment="图片标签（JSON数组）")
    
    # 使用统计
    usage_count = Column(Integer, default=0, comment="使用次数")
    download_count = Column(Integer, default=0, comment="下载次数")
    
    # 状态管理
    status = Column(String(20), default=ImageStatus.ACTIVE.value, comment="图片状态")
    is_public = Column(Boolean, default=True, comment="是否公开访问")
    
    # 上传信息
    uploaded_by = Column(Integer, comment="上传用户ID")
    upload_ip = Column(String(45), comment="上传IP地址")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    def __repr__(self):
        return f"<ImageGallery(id={self.id}, filename='{self.filename}', category='{self.category}')>"


class ImageUsage(Base):
    """图片使用记录表"""
    __tablename__ = "image_usage"

    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, nullable=False, index=True, comment="图片ID")
    
    # 使用位置信息
    usage_type = Column(String(50), nullable=False, comment="使用类型（blog_config, post_content, user_avatar等）")
    reference_id = Column(String(100), comment="引用ID（配置键名、文章ID等）")
    reference_table = Column(String(100), comment="引用表名")
    
    # 使用详情
    usage_context = Column(JSON, comment="使用上下文信息")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    def __repr__(self):
        return f"<ImageUsage(image_id={self.image_id}, usage_type='{self.usage_type}', reference_id='{self.reference_id}')>"