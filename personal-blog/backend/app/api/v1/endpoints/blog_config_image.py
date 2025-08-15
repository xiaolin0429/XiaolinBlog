"""
博客配置图片管理API接口
处理博客配置与图库的集成功能
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .deps import get_db, get_current_active_superuser
from app.crud import blog_config, image_gallery, image_usage
from app.models.user import User
from app.models.image_gallery import ImageCategory
from app.schemas.blog_config import BlogConfigResponse, ApiResponse
from app.schemas.image_gallery import ImageGalleryPublic, ImageUsageCreate

router = APIRouter()

# ============ Logo管理接口 ============

@router.post("/logo/set-from-gallery/{image_id}", response_model=BlogConfigResponse)
def set_logo_from_gallery(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> BlogConfigResponse:
    """
    从图库设置网站Logo
    需要管理员权限
    """
    # 更新Logo配置
    config = blog_config.update_logo_from_gallery(
        db, image_id=image_id, config_key="site_logo"
    )
    
    if not config:
        raise HTTPException(
            status_code=404,
            detail="图片不存在或配置更新失败"
        )
    
    # 创建使用记录
    try:
        image_usage.create_usage_record(
            db,
            image_id=image_id,
            usage_type="blog_config",
            reference_id="site_logo",
            reference_table="blog_configs",
            usage_context={
                "config_key": "site_logo",
                "updated_by": current_user.id,
                "action": "set_as_logo"
            }
        )
        
        # 增加图片使用次数
        image_gallery.increment_usage_count(db, image_id=image_id)
        
    except Exception as e:
        print(f"创建使用记录失败: {e}")
    
    return config


@router.get("/logo/current", response_model=Dict[str, Any])
def get_current_logo(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Dict[str, Any]:
    """
    获取当前Logo配置及图片信息
    需要管理员权限
    """
    logo_info = blog_config.get_config_with_image_info(db, config_key="site_logo")
    
    if not logo_info:
        raise HTTPException(
            status_code=404,
            detail="Logo配置不存在"
        )
    
    return {
        "config": logo_info["config"],
        "image": logo_info["image"],
        "has_image": logo_info["image"] is not None
    }


@router.delete("/logo/remove", response_model=ApiResponse)
def remove_logo(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> ApiResponse:
    """
    移除当前Logo设置
    需要管理员权限
    """
    config = blog_config.update_by_key(
        db,
        config_key="site_logo",
        config_value=""
    )
    
    if not config:
        raise HTTPException(
            status_code=404,
            detail="Logo配置不存在"
        )
    
    return ApiResponse(
        success=True,
        message="Logo已移除"
    )


# ============ Favicon管理接口 ============

@router.post("/favicon/set-from-gallery/{image_id}", response_model=BlogConfigResponse)
def set_favicon_from_gallery(
    *,
    db: Session = Depends(get_db),
    image_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> BlogConfigResponse:
    """
    从图库设置网站Favicon
    需要管理员权限
    """
    # 更新Favicon配置
    config = blog_config.update_logo_from_gallery(
        db, image_id=image_id, config_key="site_favicon"
    )
    
    if not config:
        raise HTTPException(
            status_code=404,
            detail="图片不存在或配置更新失败"
        )
    
    # 创建使用记录
    try:
        image_usage.create_usage_record(
            db,
            image_id=image_id,
            usage_type="blog_config",
            reference_id="site_favicon",
            reference_table="blog_configs",
            usage_context={
                "config_key": "site_favicon",
                "updated_by": current_user.id,
                "action": "set_as_favicon"
            }
        )
        
        # 增加图片使用次数
        image_gallery.increment_usage_count(db, image_id=image_id)
        
    except Exception as e:
        print(f"创建使用记录失败: {e}")
    
    return config


@router.get("/favicon/current", response_model=Dict[str, Any])
def get_current_favicon(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Dict[str, Any]:
    """
    获取当前Favicon配置及图片信息
    需要管理员权限
    """
    favicon_info = blog_config.get_config_with_image_info(db, config_key="site_favicon")
    
    if not favicon_info:
        raise HTTPException(
            status_code=404,
            detail="Favicon配置不存在"
        )
    
    return {
        "config": favicon_info["config"],
        "image": favicon_info["image"],
        "has_image": favicon_info["image"] is not None
    }


@router.delete("/favicon/remove", response_model=ApiResponse)
def remove_favicon(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> ApiResponse:
    """
    移除当前Favicon设置
    需要管理员权限
    """
    config = blog_config.update_by_key(
        db,
        config_key="site_favicon",
        config_value=""
    )
    
    if not config:
        raise HTTPException(
            status_code=404,
            detail="Favicon配置不存在"
        )
    
    return ApiResponse(
        success=True,
        message="Favicon已移除"
    )


# ============ 图片配置管理接口 ============

@router.post("/config/{config_key}/set-image/{image_id}", response_model=BlogConfigResponse)
def set_config_image(
    *,
    db: Session = Depends(get_db),
    config_key: str,
    image_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> BlogConfigResponse:
    """
    为指定配置设置图片
    需要管理员权限
    """
    config = blog_config.update_config_with_image(
        db,
        config_key=config_key,
        image_id=image_id,
        change_reason=f"设置配置 {config_key} 的图片"
    )
    
    if not config:
        raise HTTPException(
            status_code=404,
            detail="配置不存在或图片不可用"
        )
    
    # 创建使用记录
    try:
        image_usage.create_usage_record(
            db,
            image_id=image_id,
            usage_type="blog_config",
            reference_id=config_key,
            reference_table="blog_configs",
            usage_context={
                "config_key": config_key,
                "updated_by": current_user.id,
                "action": "set_config_image"
            }
        )
        
        # 增加图片使用次数
        image_gallery.increment_usage_count(db, image_id=image_id)
        
    except Exception as e:
        print(f"创建使用记录失败: {e}")
    
    return config


@router.get("/config/{config_key}/image-info", response_model=Dict[str, Any])
def get_config_image_info(
    *,
    db: Session = Depends(get_db),
    config_key: str,
    current_user: User = Depends(get_current_active_superuser)
) -> Dict[str, Any]:
    """
    获取配置的图片信息
    需要管理员权限
    """
    config_info = blog_config.get_config_with_image_info(db, config_key=config_key)
    
    if not config_info:
        raise HTTPException(
            status_code=404,
            detail="配置不存在"
        )
    
    return {
        "config": config_info["config"],
        "image": config_info["image"],
        "has_image": config_info["image"] is not None
    }


@router.get("/image-configs", response_model=List[BlogConfigResponse])
def get_image_configs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> List[BlogConfigResponse]:
    """
    获取所有图片类型的配置
    需要管理员权限
    """
    configs = blog_config.get_image_configs(db)
    return configs


# ============ 图库浏览接口 ============

@router.get("/gallery/logos", response_model=List[ImageGalleryPublic])
def get_logo_images(
    *,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_superuser)
) -> List[ImageGalleryPublic]:
    """
    获取Logo分类的图片列表
    需要管理员权限
    """
    images = image_gallery.get_by_category(
        db, 
        category=ImageCategory.SITE_LOGO,
        skip=skip,
        limit=limit
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
        for img in images if img.is_public
    ]


@router.get("/gallery/favicons", response_model=List[ImageGalleryPublic])
def get_favicon_images(
    *,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_superuser)
) -> List[ImageGalleryPublic]:
    """
    获取Favicon分类的图片列表
    需要管理员权限
    """
    images = image_gallery.get_by_category(
        db, 
        category=ImageCategory.SITE_ICON,
        skip=skip,
        limit=limit
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
        for img in images if img.is_public
    ]


@router.get("/gallery/suitable-for-config/{config_key}")
def get_suitable_images_for_config(
    *,
    db: Session = Depends(get_db),
    config_key: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_superuser)
) -> List[ImageGalleryPublic]:
    """
    获取适合指定配置的图片列表
    根据配置类型推荐合适的图片分类
    """
    # 根据配置键名推荐图片分类
    category_mapping = {
        "site_logo": ImageCategory.SITE_LOGO,
        "site_favicon": ImageCategory.SITE_ICON,
        "site_banner": ImageCategory.BANNER,
        "author_avatar": ImageCategory.AVATAR,
        "default_post_cover": ImageCategory.POST_COVER
    }
    
    category = category_mapping.get(config_key, ImageCategory.OTHER)
    
    images = image_gallery.get_by_category(
        db,
        category=category,
        skip=skip,
        limit=limit
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
        for img in images if img.is_public
    ]


# ============ 使用记录接口 ============

@router.get("/usage/config/{config_key}")
def get_config_image_usage(
    *,
    db: Session = Depends(get_db),
    config_key: str,
    current_user: User = Depends(get_current_active_superuser)
):
    """
    获取配置的图片使用记录
    需要管理员权限
    """
    usage_records = image_usage.get_by_reference(
        db,
        usage_type="blog_config",
        reference_id=config_key,
        reference_table="blog_configs"
    )
    
    return {
        "config_key": config_key,
        "usage_count": len(usage_records),
        "usage_records": usage_records
    }


@router.delete("/usage/config/{config_key}/image/{image_id}")
def remove_config_image_usage(
    *,
    db: Session = Depends(get_db),
    config_key: str,
    image_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> ApiResponse:
    """
    移除配置的图片使用记录
    需要管理员权限
    """
    success = image_usage.remove_usage_record(
        db,
        image_id=image_id,
        usage_type="blog_config",
        reference_id=config_key
    )
    
    if success:
        return ApiResponse(
            success=True,
            message="使用记录已移除"
        )
    else:
        return ApiResponse(
            success=False,
            message="未找到使用记录"
        )


# ============ 批量操作接口 ============

@router.post("/batch/update-images", response_model=ApiResponse)
def batch_update_config_images(
    *,
    db: Session = Depends(get_db),
    updates: List[Dict[str, Any]],
    current_user: User = Depends(get_current_active_superuser)
) -> ApiResponse:
    """
    批量更新配置图片
    需要管理员权限
    
    updates格式: [{"config_key": "site_logo", "image_id": 1}, ...]
    """
    updated_count = 0
    failed_count = 0
    
    for update in updates:
        try:
            config_key = update.get("config_key")
            image_id = update.get("image_id")
            
            if not config_key or not image_id:
                failed_count += 1
                continue
            
            config = blog_config.update_config_with_image(
                db,
                config_key=config_key,
                image_id=image_id,
                change_reason="批量更新配置图片"
            )
            
            if config:
                updated_count += 1
                
                # 创建使用记录
                image_usage.create_usage_record(
                    db,
                    image_id=image_id,
                    usage_type="blog_config",
                    reference_id=config_key,
                    reference_table="blog_configs",
                    usage_context={
                        "config_key": config_key,
                        "updated_by": current_user.id,
                        "action": "batch_update"
                    }
                )
                
                # 增加使用次数
                image_gallery.increment_usage_count(db, image_id=image_id)
            else:
                failed_count += 1
                
        except Exception as e:
            print(f"批量更新失败: {e}")
            failed_count += 1
    
    return ApiResponse(
        success=updated_count > 0,
        message=f"批量更新完成，成功: {updated_count}，失败: {failed_count}",
        data={
            "updated_count": updated_count,
            "failed_count": failed_count
        }
    )