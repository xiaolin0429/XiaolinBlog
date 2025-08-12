"""
图片上传API接口
临时禁用，等待博客配置模块重构完成后重新实现
"""

from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.post("/upload-site-image")
async def upload_site_image():
    """
    上传网站图片功能暂时禁用
    等待博客配置模块重构完成后重新实现
    """
    raise HTTPException(
        status_code=503,
        detail="图片上传功能暂时禁用，等待博客配置模块重构完成"
    )

@router.get("/site-image/{config_key}")
async def get_site_image(config_key: str):
    """
    获取网站图片信息功能暂时禁用
    """
    raise HTTPException(
        status_code=503,
        detail="图片信息获取功能暂时禁用，等待博客配置模块重构完成"
    )

@router.delete("/site-image/{config_key}")
async def delete_site_image(config_key: str):
    """
    删除网站图片功能暂时禁用
    """
    raise HTTPException(
        status_code=503,
        detail="图片删除功能暂时禁用，等待博客配置模块重构完成"
    )