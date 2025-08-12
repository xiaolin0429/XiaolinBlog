"""
图片服务API接口
临时禁用，等待博客配置模块重构完成后重新实现
"""

from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/site-image-data/{config_key}")
async def serve_site_image(config_key: str):
    """
    提供网站图片数据功能暂时禁用
    等待博客配置模块重构完成后重新实现
    """
    raise HTTPException(
        status_code=503,
        detail="图片服务功能暂时禁用，等待博客配置模块重构完成"
    )

@router.get("/site-logo")
async def serve_site_logo():
    """提供网站Logo功能暂时禁用"""
    raise HTTPException(
        status_code=503,
        detail="Logo服务功能暂时禁用，等待博客配置模块重构完成"
    )

@router.get("/site-favicon")
async def serve_site_favicon():
    """提供网站Favicon功能暂时禁用"""
    raise HTTPException(
        status_code=503,
        detail="Favicon服务功能暂时禁用，等待博客配置模块重构完成"
    )