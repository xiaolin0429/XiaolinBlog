"""
图库CRUD操作
提供图片管理的数据库操作方法
"""

from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func, text
from datetime import datetime, timedelta

from app.crud.base import CRUDBase
from app.models.image_gallery import ImageGallery, ImageUsage, ImageCategory, ImageStatus
from app.schemas.image_gallery import (
    ImageGalleryCreate, 
    ImageGalleryUpdate, 
    ImageGalleryFilter,
    ImageUsageCreate,
    ImageGalleryStats
)
from app.utils.file_handler import format_file_size


class CRUDImageGallery(CRUDBase[ImageGallery, ImageGalleryCreate, ImageGalleryUpdate]):
    """图库CRUD操作类"""

    def get_by_hash(self, db: Session, *, file_hash: str) -> Optional[ImageGallery]:
        """根据文件哈希获取图片"""
        return db.query(self.model).filter(
            ImageGallery.file_hash == file_hash
        ).first()

    def get_by_category(
        self, 
        db: Session, 
        *, 
        category: ImageCategory,
        status: ImageStatus = ImageStatus.ACTIVE,
        skip: int = 0, 
        limit: int = 100
    ) -> List[ImageGallery]:
        """根据分类获取图片"""
        query = db.query(self.model).filter(
            and_(
                ImageGallery.category == category.value,
                ImageGallery.status == status.value
            )
        )
        return query.offset(skip).limit(limit).all()

    def get_public_images(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[ImageGallery]:
        """获取公开图片"""
        return db.query(self.model).filter(
            and_(
                ImageGallery.is_public == True,
                ImageGallery.status == ImageStatus.ACTIVE.value
            )
        ).offset(skip).limit(limit).all()

    def search_images(
        self, 
        db: Session, 
        *, 
        filters: ImageGalleryFilter,
        skip: int = 0, 
        limit: int = 100
    ) -> Tuple[List[ImageGallery], int]:
        """搜索图片"""
        query = db.query(self.model)
        
        # 构建过滤条件
        conditions = []
        
        if filters.category:
            conditions.append(ImageGallery.category == filters.category.value)
        
        if filters.status:
            conditions.append(ImageGallery.status == filters.status.value)
        else:
            # 默认只显示活跃状态的图片
            conditions.append(ImageGallery.status == ImageStatus.ACTIVE.value)
        
        if filters.is_public is not None:
            conditions.append(ImageGallery.is_public == filters.is_public)
        
        if filters.uploaded_by:
            conditions.append(ImageGallery.uploaded_by == filters.uploaded_by)
        
        if filters.min_width:
            conditions.append(ImageGallery.width >= filters.min_width)
        
        if filters.max_width:
            conditions.append(ImageGallery.width <= filters.max_width)
        
        if filters.min_height:
            conditions.append(ImageGallery.height >= filters.min_height)
        
        if filters.max_height:
            conditions.append(ImageGallery.height <= filters.max_height)
        
        if filters.min_size:
            conditions.append(ImageGallery.file_size >= filters.min_size)
        
        if filters.max_size:
            conditions.append(ImageGallery.file_size <= filters.max_size)
        
        if filters.tags:
            # 搜索包含任一标签的图片
            tag_conditions = []
            for tag in filters.tags:
                tag_conditions.append(
                    ImageGallery.tags.contains(f'"{tag}"')
                )
            conditions.append(or_(*tag_conditions))
        
        if filters.search:
            # 搜索文件名、显示名称、描述
            search_term = f"%{filters.search}%"
            search_conditions = or_(
                ImageGallery.filename.ilike(search_term),
                ImageGallery.display_name.ilike(search_term),
                ImageGallery.description.ilike(search_term),
                ImageGallery.alt_text.ilike(search_term)
            )
            conditions.append(search_conditions)
        
        # 应用过滤条件
        if conditions:
            query = query.filter(and_(*conditions))
        
        # 获取总数
        total = query.count()
        
        # 分页和排序
        images = query.order_by(desc(ImageGallery.created_at)).offset(skip).limit(limit).all()
        
        return images, total

    def get_most_used_images(
        self, 
        db: Session, 
        *, 
        limit: int = 10
    ) -> List[ImageGallery]:
        """获取使用最多的图片"""
        return db.query(self.model).filter(
            ImageGallery.status == ImageStatus.ACTIVE.value
        ).order_by(desc(ImageGallery.usage_count)).limit(limit).all()

    def get_recent_uploads(
        self, 
        db: Session, 
        *, 
        days: int = 7,
        limit: int = 20
    ) -> List[ImageGallery]:
        """获取最近上传的图片"""
        since_date = datetime.utcnow() - timedelta(days=days)
        return db.query(self.model).filter(
            and_(
                ImageGallery.created_at >= since_date,
                ImageGallery.status == ImageStatus.ACTIVE.value
            )
        ).order_by(desc(ImageGallery.created_at)).limit(limit).all()

    def get_stats(self, db: Session) -> ImageGalleryStats:
        """获取图库统计信息"""
        # 基础统计
        total_images = db.query(self.model).count()
        active_images = db.query(self.model).filter(
            ImageGallery.status == ImageStatus.ACTIVE.value
        ).count()
        
        # 总文件大小
        total_size_result = db.query(func.sum(ImageGallery.file_size)).scalar()
        total_size = total_size_result or 0
        
        # 分类统计
        category_stats = db.query(
            ImageGallery.category,
            func.count(ImageGallery.id)
        ).filter(
            ImageGallery.status == ImageStatus.ACTIVE.value
        ).group_by(ImageGallery.category).all()
        
        categories_count = {category: count for category, count in category_stats}
        
        # 格式统计
        format_stats = db.query(
            ImageGallery.format,
            func.count(ImageGallery.id)
        ).filter(
            ImageGallery.status == ImageStatus.ACTIVE.value
        ).group_by(ImageGallery.format).all()
        
        formats_count = {format or 'unknown': count for format, count in format_stats}
        
        # 最近7天上传数量
        since_date = datetime.utcnow() - timedelta(days=7)
        recent_uploads = db.query(self.model).filter(
            ImageGallery.created_at >= since_date
        ).count()
        
        # 使用最多的图片
        most_used_images = self.get_most_used_images(db, limit=5)
        
        return ImageGalleryStats(
            total_images=total_images,
            active_images=active_images,
            total_size=total_size,
            total_size_formatted=format_file_size(total_size),
            categories_count=categories_count,
            formats_count=formats_count,
            recent_uploads=recent_uploads,
            most_used_images=most_used_images
        )

    def increment_usage_count(self, db: Session, *, image_id: int) -> Optional[ImageGallery]:
        """增加图片使用次数"""
        image = self.get(db, id=image_id)
        if image:
            image.usage_count = (image.usage_count or 0) + 1
            db.commit()
            db.refresh(image)
        return image

    def increment_download_count(self, db: Session, *, image_id: int) -> Optional[ImageGallery]:
        """增加图片下载次数"""
        image = self.get(db, id=image_id)
        if image:
            image.download_count = (image.download_count or 0) + 1
            db.commit()
            db.refresh(image)
        return image

    def soft_delete(self, db: Session, *, image_id: int) -> Optional[ImageGallery]:
        """软删除图片（标记为已删除状态）"""
        image = self.get(db, id=image_id)
        if image:
            image.status = ImageStatus.DELETED.value
            db.commit()
            db.refresh(image)
        return image

    def restore_image(self, db: Session, *, image_id: int) -> Optional[ImageGallery]:
        """恢复已删除的图片"""
        image = self.get(db, id=image_id)
        if image and image.status == ImageStatus.DELETED.value:
            image.status = ImageStatus.ACTIVE.value
            db.commit()
            db.refresh(image)
        return image

    def batch_update_category(
        self, 
        db: Session, 
        *, 
        image_ids: List[int], 
        category: ImageCategory
    ) -> List[ImageGallery]:
        """批量更新图片分类"""
        images = db.query(self.model).filter(
            ImageGallery.id.in_(image_ids)
        ).all()
        
        for image in images:
            image.category = category.value
        
        db.commit()
        
        for image in images:
            db.refresh(image)
        
        return images

    def batch_update_status(
        self, 
        db: Session, 
        *, 
        image_ids: List[int], 
        status: ImageStatus
    ) -> List[ImageGallery]:
        """批量更新图片状态"""
        images = db.query(self.model).filter(
            ImageGallery.id.in_(image_ids)
        ).all()
        
        for image in images:
            image.status = status.value
        
        db.commit()
        
        for image in images:
            db.refresh(image)
        
        return images


class CRUDImageUsage(CRUDBase[ImageUsage, ImageUsageCreate, None]):
    """图片使用记录CRUD操作类"""

    def get_by_image_id(
        self, 
        db: Session, 
        *, 
        image_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[ImageUsage]:
        """根据图片ID获取使用记录"""
        return db.query(self.model).filter(
            ImageUsage.image_id == image_id
        ).order_by(desc(ImageUsage.created_at)).offset(skip).limit(limit).all()

    def get_by_reference(
        self, 
        db: Session, 
        *, 
        usage_type: str,
        reference_id: str,
        reference_table: Optional[str] = None
    ) -> List[ImageUsage]:
        """根据引用信息获取使用记录"""
        query = db.query(self.model).filter(
            and_(
                ImageUsage.usage_type == usage_type,
                ImageUsage.reference_id == reference_id
            )
        )
        
        if reference_table:
            query = query.filter(ImageUsage.reference_table == reference_table)
        
        return query.all()

    def create_usage_record(
        self, 
        db: Session, 
        *, 
        image_id: int,
        usage_type: str,
        reference_id: str,
        reference_table: Optional[str] = None,
        usage_context: Optional[Dict[str, Any]] = None
    ) -> ImageUsage:
        """创建使用记录"""
        usage_data = ImageUsageCreate(
            image_id=image_id,
            usage_type=usage_type,
            reference_id=reference_id,
            reference_table=reference_table,
            usage_context=usage_context
        )
        return self.create(db, obj_in=usage_data)

    def remove_usage_record(
        self, 
        db: Session, 
        *, 
        image_id: int,
        usage_type: str,
        reference_id: str
    ) -> bool:
        """删除使用记录"""
        usage_records = db.query(self.model).filter(
            and_(
                ImageUsage.image_id == image_id,
                ImageUsage.usage_type == usage_type,
                ImageUsage.reference_id == reference_id
            )
        ).all()
        
        for record in usage_records:
            db.delete(record)
        
        db.commit()
        return len(usage_records) > 0


# 创建CRUD实例
image_gallery = CRUDImageGallery(ImageGallery)
image_usage = CRUDImageUsage(ImageUsage)