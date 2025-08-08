"""
图片上传API接口
用于处理网站logo和favicon的上传
"""

import base64
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Form
from sqlalchemy.orm import Session
from PIL import Image
import io

from app.api.v1.endpoints.deps import get_db, get_current_active_user
from app.crud.site_config import site_config as crud_site_config
from app.models.user import User
from app.schemas.site_config import SiteConfigUpdate

router = APIRouter()

# 支持的图片格式
ALLOWED_IMAGE_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg", 
    "image/jpg": ".jpg",
    "image/gif": ".gif",
    "image/x-icon": ".ico",
    "image/vnd.microsoft.icon": ".ico"
}

# 图片大小限制（字节）
MAX_FILE_SIZE = {
    "site_logo": 2 * 1024 * 1024,  # 2MB
    "site_favicon": 1 * 1024 * 1024  # 1MB
}

# 推荐的图片尺寸
RECOMMENDED_SIZE = {
    "site_logo": (200, 60),
    "site_favicon": (32, 32)
}


def validate_image(file: UploadFile, config_key: str) -> None:
    """验证上传的图片文件"""
    
    # 检查文件类型
    if not file.content_type or file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型。支持的格式: {', '.join(ALLOWED_IMAGE_TYPES.keys())}"
        )
    
    # 检查文件大小
    if file.size and file.size > MAX_FILE_SIZE.get(config_key, 2 * 1024 * 1024):
        max_size_mb = MAX_FILE_SIZE.get(config_key, 2 * 1024 * 1024) / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"文件大小超过限制。最大允许: {max_size_mb}MB"
        )
    
    # 检查文件名
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="文件名不能为空"
        )


def process_image(file_content: bytes, config_key: str) -> bytes:
    """处理图片：调整大小、优化等"""
    
    try:
        # 打开图片
        image = Image.open(io.BytesIO(file_content))
        
        # 获取推荐尺寸
        recommended_width, recommended_height = RECOMMENDED_SIZE.get(config_key, (200, 60))
        
        # 如果图片过大，进行缩放
        if image.width > recommended_width * 2 or image.height > recommended_height * 2:
            # 保持宽高比缩放
            image.thumbnail((recommended_width * 2, recommended_height * 2), Image.Resampling.LANCZOS)
        
        # 转换为RGB模式（如果需要）
        if image.mode in ('RGBA', 'LA', 'P'):
            # 对于透明图片，保持透明度
            if config_key == 'site_favicon':
                # favicon保持原有模式
                pass
            else:
                # logo转换为RGB
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = background
        
        # 保存处理后的图片
        output = io.BytesIO()
        format_map = {
            'site_logo': 'PNG',
            'site_favicon': 'ICO' if config_key == 'site_favicon' else 'PNG'
        }
        image.save(output, format=format_map.get(config_key, 'PNG'), optimize=True, quality=85)
        
        return output.getvalue()
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"图片处理失败: {str(e)}"
        )


@router.post("/upload-site-image")
async def upload_site_image(
    *,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    config_key: str = Form(...),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    上传网站图片（logo或favicon）
    
    Args:
        file: 上传的图片文件
        config_key: 配置键名 ('site_logo' 或 'site_favicon')
        current_user: 当前用户（需要管理员权限）
    
    Returns:
        上传结果信息
    """
    
    # 验证配置键名
    if config_key not in ['site_logo', 'site_favicon']:
        raise HTTPException(
            status_code=400,
            detail="无效的配置键名。只支持 'site_logo' 或 'site_favicon'"
        )
    
    # 验证用户权限（假设需要管理员权限）
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="权限不足。需要管理员权限"
        )
    
    try:
        # 验证文件
        validate_image(file, config_key)
        
        # 读取文件内容
        file_content = await file.read()
        
        # 处理图片
        processed_content = process_image(file_content, config_key)
        
        # 编码为base64
        base64_data = base64.b64encode(processed_content).decode('utf-8')
        
        # 创建图片元数据
        image_data = {
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(processed_content),
            "data": base64_data,
            "upload_time": datetime.utcnow().isoformat() + "Z"
        }
        
        # 保存到数据库
        config_update = SiteConfigUpdate(
            key=config_key,
            value=json.dumps(image_data),
            data_type="BINARY"
        )
        
        # 更新配置
        updated_config = crud_site_config.update_by_key(
            db=db,
            key=config_key,
            obj_in=config_update
        )
        
        if not updated_config:
            raise HTTPException(
                status_code=404,
                detail=f"配置项 {config_key} 不存在"
            )
        
        return {
            "success": True,
            "message": f"{'网站Logo' if config_key == 'site_logo' else '网站图标'}上传成功",
            "data": {
                "config_key": config_key,
                "filename": file.filename,
                "size": len(processed_content),
                "content_type": file.content_type,
                "upload_time": image_data["upload_time"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"上传失败: {str(e)}"
        )


@router.get("/site-image/{config_key}")
async def get_site_image(
    config_key: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    获取网站图片信息
    
    Args:
        config_key: 配置键名 ('site_logo' 或 'site_favicon')
    
    Returns:
        图片信息（不包含实际图片数据）
    """
    
    if config_key not in ['site_logo', 'site_favicon']:
        raise HTTPException(
            status_code=400,
            detail="无效的配置键名"
        )
    
    try:
        # 获取配置
        config = crud_site_config.get_by_key(db=db, key=config_key)
        
        if not config or not config.value:
            return {
                "success": True,
                "data": None,
                "message": "未找到图片"
            }
        
        # 解析图片数据
        try:
            image_data = json.loads(config.value)
            
            # 返回图片信息（不包含base64数据）
            return {
                "success": True,
                "data": {
                    "config_key": config_key,
                    "filename": image_data.get("filename", ""),
                    "content_type": image_data.get("content_type", ""),
                    "size": image_data.get("size", 0),
                    "upload_time": image_data.get("upload_time", ""),
                    "has_image": bool(image_data.get("data"))
                }
            }
            
        except json.JSONDecodeError:
            return {
                "success": True,
                "data": None,
                "message": "图片数据格式错误"
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取图片信息失败: {str(e)}"
        )


@router.delete("/site-image/{config_key}")
async def delete_site_image(
    config_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    删除网站图片
    
    Args:
        config_key: 配置键名 ('site_logo' 或 'site_favicon')
        current_user: 当前用户（需要管理员权限）
    
    Returns:
        删除结果
    """
    
    if config_key not in ['site_logo', 'site_favicon']:
        raise HTTPException(
            status_code=400,
            detail="无效的配置键名"
        )
    
    # 验证用户权限
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="权限不足。需要管理员权限"
        )
    
    try:
        # 清空配置值
        config_update = SiteConfigUpdate(
            key=config_key,
            value='{"filename": "", "content_type": "", "size": 0, "data": "", "upload_time": ""}',
            data_type="BINARY"
        )
        
        updated_config = crud_site_config.update_by_key(
            db=db,
            key=config_key,
            obj_in=config_update
        )
        
        if not updated_config:
            raise HTTPException(
                status_code=404,
                detail=f"配置项 {config_key} 不存在"
            )
        
        return {
            "success": True,
            "message": f"{'网站Logo' if config_key == 'site_logo' else '网站图标'}删除成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"删除失败: {str(e)}"
        )