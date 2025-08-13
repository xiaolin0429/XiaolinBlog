"""
文件处理工具
"""
import os
import hashlib
import mimetypes
from pathlib import Path
from typing import Optional, Tuple, List, BinaryIO
from PIL import Image
import aiofiles


def get_file_extension(filename: str) -> str:
    """获取文件扩展名"""
    return Path(filename).suffix.lower()


def get_file_mime_type(filename: str) -> Optional[str]:
    """获取文件MIME类型"""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type


def is_image_file(filename: str) -> bool:
    """检查是否为图片文件"""
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'}
    return get_file_extension(filename) in image_extensions


def is_allowed_file_type(filename: str, allowed_extensions: List[str]) -> bool:
    """检查文件类型是否被允许"""
    ext = get_file_extension(filename)
    return ext in [e.lower() for e in allowed_extensions]


def calculate_file_hash(file_path: str, algorithm: str = 'md5') -> str:
    """计算文件哈希值"""
    hash_algo = hashlib.new(algorithm)
    
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_algo.update(chunk)
    
    return hash_algo.hexdigest()


def get_file_size(file_path: str) -> int:
    """获取文件大小（字节）"""
    return os.path.getsize(file_path)


def format_file_size(size_bytes: int) -> str:
    """格式化文件大小"""
    if size_bytes == 0:
        return "0B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024
        i += 1
    
    return f"{size_bytes:.1f}{size_names[i]}"


def ensure_directory_exists(directory: str) -> None:
    """确保目录存在，如果不存在则创建"""
    Path(directory).mkdir(parents=True, exist_ok=True)


def generate_unique_filename(original_filename: str, directory: str) -> str:
    """生成唯一的文件名"""
    base_path = Path(directory)
    file_path = base_path / original_filename
    
    if not file_path.exists():
        return original_filename
    
    # 如果文件已存在，添加数字后缀
    stem = file_path.stem
    suffix = file_path.suffix
    counter = 1
    
    while file_path.exists():
        new_name = f"{stem}_{counter}{suffix}"
        file_path = base_path / new_name
        counter += 1
    
    return file_path.name


def resize_image(
    input_path: str, 
    output_path: str, 
    max_width: int = 800, 
    max_height: int = 600,
    quality: int = 85
) -> Tuple[int, int]:
    """
    调整图片尺寸
    
    Returns:
        Tuple[int, int]: 新的宽度和高度
    """
    with Image.open(input_path) as img:
        # 计算新尺寸，保持宽高比
        width, height = img.size
        
        if width > max_width or height > max_height:
            ratio = min(max_width / width, max_height / height)
            new_width = int(width * ratio)
            new_height = int(height * ratio)
            
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        else:
            new_width, new_height = width, height
        
        # 保存图片
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        
        img.save(output_path, 'JPEG', quality=quality, optimize=True)
        
        return new_width, new_height


def create_thumbnail(
    input_path: str,
    output_path: str, 
    size: Tuple[int, int] = (150, 150)
) -> None:
    """创建缩略图"""
    with Image.open(input_path) as img:
        img.thumbnail(size, Image.Resampling.LANCZOS)
        
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
            
        img.save(output_path, 'JPEG', quality=85, optimize=True)


async def save_uploaded_file(file: BinaryIO, destination: str) -> int:
    """异步保存上传的文件"""
    ensure_directory_exists(os.path.dirname(destination))
    
    async with aiofiles.open(destination, 'wb') as f:
        content = await file.read()
        await f.write(content)
        return len(content)


def clean_filename(filename: str) -> str:
    """清理文件名，移除危险字符"""
    # 移除危险字符
    import re
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    
    # 移除控制字符
    filename = ''.join(char for char in filename if ord(char) >= 32)
    
    # 截断长度
    if len(filename) > 200:
        name, ext = os.path.splitext(filename)
        filename = name[:200-len(ext)] + ext
    
    return filename.strip()


def get_file_info(file_path: str) -> dict:
    """获取文件详细信息"""
    if not os.path.exists(file_path):
        return {}
    
    stat = os.stat(file_path)
    
    return {
        "filename": os.path.basename(file_path),
        "size": stat.st_size,
        "size_formatted": format_file_size(stat.st_size),
        "mime_type": get_file_mime_type(file_path),
        "extension": get_file_extension(file_path),
        "is_image": is_image_file(file_path),
        "created_at": stat.st_ctime,
        "modified_at": stat.st_mtime,
        "md5_hash": calculate_file_hash(file_path, 'md5')
    }