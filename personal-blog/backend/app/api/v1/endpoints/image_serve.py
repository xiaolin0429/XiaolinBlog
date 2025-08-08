"""
图片服务API接口
用于提供网站logo和favicon的图片数据
"""

import base64
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.api.v1.endpoints.deps import get_db
from app.crud.site_config import site_config as crud_site_config

router = APIRouter()


@router.get("/site-image-data/{config_key}")
async def serve_site_image(
    config_key: str,
    db: Session = Depends(get_db)
) -> Response:
    """
    提供网站图片数据
    
    Args:
        config_key: 配置键名 ('site_logo' 或 'site_favicon')
    
    Returns:
        图片文件响应
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
            raise HTTPException(
                status_code=404,
                detail="图片不存在"
            )
        
        # 解析图片数据
        try:
            image_data = json.loads(config.value)
            base64_data = image_data.get("data", "")
            content_type = image_data.get("content_type", "image/png")
            
            if not base64_data:
                raise HTTPException(
                    status_code=404,
                    detail="图片数据为空"
                )
            
            # 解码base64数据
            image_bytes = base64.b64decode(base64_data)
            
            # 返回图片响应
            return Response(
                content=image_bytes,
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=3600",  # 缓存1小时
                    "Content-Disposition": f"inline; filename=\"{image_data.get('filename', config_key)}\""
                }
            )
            
        except (json.JSONDecodeError, base64.binascii.Error) as e:
            raise HTTPException(
                status_code=500,
                detail="图片数据格式错误"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取图片失败: {str(e)}"
        )


@router.get("/site-logo")
async def serve_site_logo(db: Session = Depends(get_db)) -> Response:
    """提供网站Logo"""
    return await serve_site_image("site_logo", db)


@router.get("/site-favicon")
async def serve_site_favicon(db: Session = Depends(get_db)) -> Response:
    """提供网站Favicon"""
    return await serve_site_image("site_favicon", db)