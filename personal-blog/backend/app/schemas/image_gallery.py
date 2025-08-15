"""
图库数据Schema
用于API请求和响应的数据验证和序列化
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from app.models.image_gallery import ImageCategory, ImageStatus


# ============ 基础Schema ============

class ImageGalleryBase(BaseModel):
    """图库基础Schema"""
    filename: str = Field(..., max_length=255, description="原始文件名")
    display_name: Optional[str] = Field(None, max_length=255, description="显示名称")
    description: Optional[str] = Field(None, description="图片描述")
    alt_text: Optional[str] = Field(None, max_length=500, description="替代文本")
    category: ImageCategory = Field(ImageCategory.OTHER, description="图片分类")
    tags: Optional[List[str]] = Field(None, description="图片标签")
    is_public: bool = Field(True, description="是否公开访问")


class ImageGalleryCreate(ImageGalleryBase):
    """创建图片Schema"""
    pass


class ImageGalleryUpdate(BaseModel):
    """更新图片Schema"""
    display_name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    alt_text: Optional[str] = Field(None, max_length=500)
    category: Optional[ImageCategory] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None
    status: Optional[ImageStatus] = None


class ImageGalleryResponse(ImageGalleryBase):
    """图片响应Schema"""
    id: int
    file_path: str
    file_url: str
    file_size: int
    file_hash: str
    mime_type: str
    width: Optional[int] = None
    height: Optional[int] = None
    format: Optional[str] = None
    thumbnail_path: Optional[str] = None
    thumbnail_url: Optional[str] = None
    usage_count: int = 0
    download_count: int = 0
    status: ImageStatus
    uploaded_by: Optional[int] = None
    upload_ip: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ImageGalleryPublic(BaseModel):
    """公开图片信息Schema"""
    id: int
    filename: str
    display_name: Optional[str] = None
    description: Optional[str] = None
    alt_text: Optional[str] = None
    file_url: str
    thumbnail_url: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    format: Optional[str] = None
    category: ImageCategory
    tags: Optional[List[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============ 图片上传Schema ============

class ImageUploadResponse(BaseModel):
    """图片上传响应Schema"""
    success: bool
    message: str
    data: Optional[ImageGalleryResponse] = None
    error: Optional[str] = None


class BatchImageUploadResponse(BaseModel):
    """批量上传响应Schema"""
    success: bool
    message: str
    uploaded_count: int
    failed_count: int
    results: List[ImageUploadResponse]


# ============ 图片使用记录Schema ============

class ImageUsageBase(BaseModel):
    """图片使用记录基础Schema"""
    image_id: int
    usage_type: str = Field(..., max_length=50, description="使用类型")
    reference_id: Optional[str] = Field(None, max_length=100, description="引用ID")
    reference_table: Optional[str] = Field(None, max_length=100, description="引用表名")
    usage_context: Optional[Dict[str, Any]] = Field(None, description="使用上下文")


class ImageUsageCreate(ImageUsageBase):
    """创建使用记录Schema"""
    pass


class ImageUsageResponse(ImageUsageBase):
    """使用记录响应Schema"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ 查询和过滤Schema ============

class ImageGalleryFilter(BaseModel):
    """图片查询过滤Schema"""
    category: Optional[ImageCategory] = None
    status: Optional[ImageStatus] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None
    search: Optional[str] = Field(None, description="搜索关键词（文件名、显示名称、描述）")
    uploaded_by: Optional[int] = None
    min_width: Optional[int] = Field(None, ge=1)
    max_width: Optional[int] = Field(None, ge=1)
    min_height: Optional[int] = Field(None, ge=1)
    max_height: Optional[int] = Field(None, ge=1)
    min_size: Optional[int] = Field(None, ge=0, description="最小文件大小（字节）")
    max_size: Optional[int] = Field(None, ge=0, description="最大文件大小（字节）")


class ImageGalleryStats(BaseModel):
    """图库统计信息Schema"""
    total_images: int
    active_images: int
    total_size: int  # 总文件大小（字节）
    total_size_formatted: str  # 格式化的文件大小
    categories_count: Dict[str, int]  # 各分类图片数量
    formats_count: Dict[str, int]  # 各格式图片数量
    recent_uploads: int  # 最近7天上传数量
    most_used_images: List[ImageGalleryResponse]  # 使用最多的图片


# ============ 分页响应Schema ============

class PaginatedImageResponse(BaseModel):
    """分页图片响应Schema"""
    items: List[ImageGalleryResponse]
    total: int
    page: int
    size: int
    pages: int


# ============ API响应Schema ============

class ApiResponse(BaseModel):
    """通用API响应Schema"""
    success: bool
    message: str
    data: Optional[Any] = None
    error: Optional[str] = None


# ============ 验证器 ============

@validator('tags', pre=True, always=True)
def validate_tags(cls, v):
    """验证标签格式"""
    if v is None:
        return []
    if isinstance(v, str):
        # 如果是字符串，按逗号分割
        return [tag.strip() for tag in v.split(',') if tag.strip()]
    if isinstance(v, list):
        return [str(tag).strip() for tag in v if str(tag).strip()]
    return []


# 将验证器应用到相关Schema
ImageGalleryBase.validate_tags = validate_tags
ImageGalleryUpdate.validate_tags = validate_tags