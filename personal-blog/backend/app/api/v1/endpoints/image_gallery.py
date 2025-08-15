"""
图库管理API接口
提供完整的图片上传、管理和使用功能
"""

import os
import hashlib
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from PIL import Image

from .deps import get_db, get_current_active_user, get_current_active_superuser
from app.crud import image_gallery, image_usage
from app.models.user import User
from app.models.image_gallery import ImageCategory, ImageStatus
from app.schemas.image_gallery import (
    ImageGalleryResponse,
    ImageGalleryCreate,
    ImageGalleryUpdate,
    ImageGalleryPublic,
    ImageGalleryFilter,
    ImageGalleryStats,
    ImageUploadResponse,
    BatchImageUploadResponse,
    PaginatedImageResponse,
    ApiResponse,
    ImageUsageCreate,
    ImageUsageResponse
)
from app.utils.file_handler import (
    is_image_file,
    calculate_file_hash,
    get_file_size,
    ensure_directory_exists,
    generate_unique_filename,
    clean_filename,
    resize_image,
    create_thumbnail,
    save_uploaded_file
)
from app.core.config.settings import get_settings

settings = get_settings()
router = APIRouter()

# 图片存储配置
UPLOAD_DIR = "uploads/images"
THUMBNAIL_DIR = "uploads/thumbnails"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
THUMBNAIL_SIZE = (300, 300)

# ============ 图片上传接口 ============

@router.post("/upload", response_model=ImageUploadResponse)
async def upload_image(
    *,
    db: Session = Depends(get_db),
    request: Request,
    file: UploadFile = File(...),
    category: ImageCategory = Form(ImageCategory.OTHER),
    display_name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    alt_text: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    is_public: bool = Form(True),
    current_user: User = Depends(get_current_active_user)
) -> ImageUploadResponse:
    """
    上传图片到图库
    支持多种图片格式，自动生成缩略图
    """
    try:
        # 验证文件
        if not file.filename:
            raise HTTPException(status_code=400, detail="文件名不能为空")
        
        if not is_image_file(file.filename):
            raise HTTPException(
                status_code=400, 
                detail=f"不支持的文件格式，仅支持: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # 读取文件内容
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"文件大小超过限制（最大 {MAX_FILE_SIZE // 1024 // 1024}MB）"
            )
        
        # 计算文件哈希
        file_hash = hashlib.md5(file_content).hexdigest()
        
        # 检查是否已存在相同文件
        existing_image = image_gallery.get_by_hash(db, file_hash=file_hash)
        if existing_image:
            return ImageUploadResponse(
                success=True,
                message="文件已存在，返回现有记录",
                data=existing_image
            )
        
        # 清理文件名
        clean_name = clean_filename(file.filename)
        
        # 确保上传目录存在
        ensure_directory_exists(UPLOAD_DIR)
        ensure_directory_exists(THUMBNAIL_DIR)
        
        # 生成唯一文件名
        unique_filename = generate_unique_filename(clean_name, UPLOAD_DIR)
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # 保存原始文件
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # 获取图片信息
        img_width, img_height, img_format = None, None, None
        try:
            with Image.open(file_path) as img:
                img_width, img_height = img.size
                img_format = img.format.lower() if img.format else None
        except Exception as e:
            print(f"获取图片信息失败: {e}")
        
        # 生成缩略图
        thumbnail_filename = f"thumb_{unique_filename}"
        thumbnail_path = os.path.join(THUMBNAIL_DIR, thumbnail_filename)
        thumbnail_url = None
        
        try:
            create_thumbnail(file_path, thumbnail_path, THUMBNAIL_SIZE)
            thumbnail_url = f"/api/v1/images/thumbnail/{thumbnail_filename}"
        except Exception as e:
            print(f"生成缩略图失败: {e}")
        
        # 处理标签
        tag_list = []
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
        
        # 创建数据库记录
        image_data = ImageGalleryCreate(
            filename=file.filename,
            display_name=display_name or file.filename,
            description=description,
            alt_text=alt_text,
            category=category,
            tags=tag_list,
            is_public=is_public
        )
        
        # 构建完整的图片信息
        file_url = f"/api/v1/images/serve/{unique_filename}"
        
        # 创建图片记录
        db_image = image_gallery.create(db, obj_in=image_data)
        
        # 更新文件相关信息
        db_image.file_path = file_path
        db_image.file_url = file_url
        db_image.file_size = file_size
        db_image.file_hash = file_hash
        db_image.mime_type = file.content_type or 'image/jpeg'
        db_image.width = img_width
        db_image.height = img_height
        db_image.format = img_format
        db_image.thumbnail_path = thumbnail_path if thumbnail_url else None
        db_image.thumbnail_url = thumbnail_url
        db_image.uploaded_by = current_user.id
        db_image.upload_ip = request.client.host if request.client else None
        
        db.commit()
        db.refresh(db_image)
        
        return ImageUploadResponse(
            success=True,
            message="图片上传成功",
            data=db_image
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # 清理可能创建的文件
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        if 'thumbnail_path' in locals() and os.path.exists(thumbnail_path):
            os.remove(thumbnail_path)
        
        raise HTTPException(
            status_code=500,
            detail=f"上传失败: {str(e)}"
        )


@router.post("/batch-upload", response_model=BatchImageUploadResponse)
async def batch_upload_images(
    *,
    db: Session = Depends(get_db),
    request: Request,
    files: List[UploadFile] = File(...),
    category: ImageCategory = Form(ImageCategory.OTHER),
    is_public: bool = Form(True),
    current_user: User = Depends(get_current_active_user)
) -> BatchImageUploadResponse:
    """
    批量上传图片
    """
    results = []
    uploaded_count = 0
    failed_count = 0
    
    for file in files:
        try:
            # 重置文件指针
            await file.seek(0)
            
            # 调用单个上传接口
            result = await upload_image(
                db=db,
                request=request,
                file=file,
                category=category,
                is_public=is_public,
                current_user=current_user
            )
            
            results.append(result)
            if result.success:
                uploaded_count += 1
            else:
                failed_count += 1
                
        except Exception as e:
            failed_count += 1
            results.append(ImageUploadResponse(
                success=False,
                message=f"上传失败: {str(e)}",
                error=str(e)
            ))
    
    return BatchImageUploadResponse(
        success=uploaded_count > 0,
        message=f"批量上传完成，成功: {uploaded_count}，失败: {failed_count}",
        uploaded_count=uploaded_count,
        failed_count=failed_count,
        results=results
    )


# ============ 图片访问接口 ============

@router.get("/serve/{filename}")
async def serve_image(filename: str):
    """
    提供图片文件访问
    """
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="图片不存在")
    
    return FileResponse(file_path)


@router.get("/thumbnail/{filename}")
async def serve_thumbnail(filename: str):
    """
    提供缩略图访问
    """
    file_path = os.path.join(THUMBNAIL_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="缩略图不存在")
    
    return FileResponse(file_path)


# ============ 图片管理接口 ============

@router.get("/", response_model=PaginatedImageResponse)
def get_images(
    *,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[ImageCategory] = Query(None),
    status: Optional[ImageStatus] = Query(None),
    is_public: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user)
) -> PaginatedImageResponse:
    """
    获取图片列表（需要登录）
    """
    # 构建过滤条件
    filters = ImageGalleryFilter(
        category=category,
        status=status,
        is_public=is_public,
        search=search,
        tags=tags.split(',') if tags else None
    )
    
    images, total = image_gallery.search_images(
        db, filters=filters, skip=skip, limit=limit
    )
    
    pages = (total + limit - 1) // limit
    
    return PaginatedImageResponse(
        items=images,
        total=total,
        page=skip // limit + 1,
        size=limit,
        pages=pages
    )


@router.get("/public", response_model=List[ImageGalleryPublic])
def get_public_images(
    *,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[ImageCategory] = Query(None)
) -> List[ImageGalleryPublic]:
    """
    获取公开图片列表（无需登录）
    """
    if category:
        images = image_gallery.get_by_category(
            db, category=category, skip=skip, limit=limit
        )
        # 只返回公开的图片
        images = [img for img in images if img.is_public]
    else:
        images = image_gallery.get_public_images(
            db, skip=skip, limit=limit
        )
    
    return [
        ImageGalleryPublic(
            id=img.id,
            filename=img.filename,
            display_name=img.display_name,
            description=img.description,
            alt_text=img.alt_text,
            file_url=img.file_url,
            thumbnail_url=img.thumbnail_url,
            width=img.width,
            height=img.height,
            format=img.format,
            category=ImageCategory(img.category),
            tags=img.tags,
            created_at=img.created_at
        )
        for img in images
    ]


@router.get("/{image_id}", response_model=ImageGalleryResponse)
def get_image(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    current_user: User = Depends(get_current_active_user)
) -> ImageGalleryResponse:
    """
    根据ID获取图片详情
    """
    image = image_gallery.get(db, id=image_id)
    if not image:
        raise HTTPException(status_code=404, detail="图片不存在")
    
    return image


@router.put("/{image_id}", response_model=ImageGalleryResponse)
def update_image(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    image_in: ImageGalleryUpdate,
    current_user: User = Depends(get_current_active_user)
) -> ImageGalleryResponse:
    """
    更新图片信息
    """
    image = image_gallery.get(db, id=image_id)
    if not image:
        raise HTTPException(status_code=404, detail="图片不存在")
    
    # 检查权限：只有上传者或管理员可以修改
    if image.uploaded_by != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="没有权限修改此图片")
    
    image = image_gallery.update(db, db_obj=image, obj_in=image_in)
    return image


@router.delete("/{image_id}", response_model=ApiResponse)
def delete_image(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    permanent: bool = Query(False, description="是否永久删除"),
    current_user: User = Depends(get_current_active_user)
) -> ApiResponse:
    """
    删除图片
    """
    image = image_gallery.get(db, id=image_id)
    if not image:
        raise HTTPException(status_code=404, detail="图片不存在")
    
    # 检查权限
    if image.uploaded_by != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="没有权限删除此图片")
    
    if permanent:
        # 永久删除：删除文件和数据库记录
        try:
            if os.path.exists(image.file_path):
                os.remove(image.file_path)
            if image.thumbnail_path and os.path.exists(image.thumbnail_path):
                os.remove(image.thumbnail_path)
        except Exception as e:
            print(f"删除文件失败: {e}")
        
        image_gallery.remove(db, id=image_id)
        message = "图片已永久删除"
    else:
        # 软删除：仅标记为已删除
        image_gallery.soft_delete(db, image_id=image_id)
        message = "图片已标记为删除"
    
    return ApiResponse(success=True, message=message)


# ============ 图片使用记录接口 ============

@router.post("/{image_id}/usage", response_model=ImageUsageResponse)
def create_usage_record(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    usage_data: ImageUsageCreate,
    current_user: User = Depends(get_current_active_user)
) -> ImageUsageResponse:
    """
    创建图片使用记录
    """
    # 验证图片存在
    image = image_gallery.get(db, id=image_id)
    if not image:
        raise HTTPException(status_code=404, detail="图片不存在")
    
    # 创建使用记录
    usage_record = image_usage.create_usage_record(
        db,
        image_id=image_id,
        usage_type=usage_data.usage_type,
        reference_id=usage_data.reference_id,
        reference_table=usage_data.reference_table,
        usage_context=usage_data.usage_context
    )
    
    # 增加使用次数
    image_gallery.increment_usage_count(db, image_id=image_id)
    
    return usage_record


@router.get("/{image_id}/usage", response_model=List[ImageUsageResponse])
def get_image_usage(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user)
) -> List[ImageUsageResponse]:
    """
    获取图片使用记录
    """
    usage_records = image_usage.get_by_image_id(
        db, image_id=image_id, skip=skip, limit=limit
    )
    return usage_records


# ============ 统计和管理接口 ============

@router.get("/stats/overview", response_model=ImageGalleryStats)
def get_gallery_stats(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> ImageGalleryStats:
    """
    获取图库统计信息（管理员接口）
    """
    return image_gallery.get_stats(db)


@router.post("/batch/update-category", response_model=ApiResponse)
def batch_update_category(
    *,
    db: Session = Depends(get_db),
    image_ids: List[int],
    category: ImageCategory,
    current_user: User = Depends(get_current_active_superuser)
) -> ApiResponse:
    """
    批量更新图片分类（管理员接口）
    """
    updated_images = image_gallery.batch_update_category(
        db, image_ids=image_ids, category=category
    )
    
    return ApiResponse(
        success=True,
        message=f"已更新 {len(updated_images)} 张图片的分类为 {category.value}"
    )


@router.post("/batch/update-status", response_model=ApiResponse)
def batch_update_status(
    *,
    db: Session = Depends(get_db),
    image_ids: List[int],
    status: ImageStatus,
    current_user: User = Depends(get_current_active_superuser)
) -> ApiResponse:
    """
    批量更新图片状态（管理员接口）
    """
    updated_images = image_gallery.batch_update_status(
        db, image_ids=image_ids, status=status
    )
    
    return ApiResponse(
        success=True,
        message=f"已更新 {len(updated_images)} 张图片的状态为 {status.value}"
    )