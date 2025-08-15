"""
博客配置 CRUD 操作
提供数据库操作的封装
"""

from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc

from app.models.blog_config import (
    BlogConfig, ConfigGroup, ConfigHistory, ConfigCache,
    ConfigCategory, ConfigDataType
)
from app.models.image_gallery import ImageGallery
from app.schemas.blog_config import (
    BlogConfigCreate, BlogConfigUpdate,
    ConfigGroupCreate, ConfigGroupUpdate,
    ConfigValueUpdate, BatchConfigUpdate
)


class CRUDBlogConfig:
    """博客配置 CRUD 操作类"""

    # ============ 基础 CRUD 操作 ============

    def get(self, db: Session, config_id: int) -> Optional[BlogConfig]:
        """根据ID获取配置"""
        return db.query(BlogConfig).filter(BlogConfig.id == config_id).first()

    def get_by_key(self, db: Session, config_key: str) -> Optional[BlogConfig]:
        """根据键名获取配置"""
        return db.query(BlogConfig).filter(BlogConfig.config_key == config_key).first()

    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        category: Optional[ConfigCategory] = None,
        group_key: Optional[str] = None,
        is_enabled: Optional[bool] = None,
        is_public: Optional[bool] = None,
        search: Optional[str] = None
    ) -> List[BlogConfig]:
        """获取多个配置"""
        query = db.query(BlogConfig)

        # 添加过滤条件
        if category:
            query = query.filter(BlogConfig.category == category)
        if group_key:
            query = query.filter(BlogConfig.group_key == group_key)
        if is_enabled is not None:
            query = query.filter(BlogConfig.is_enabled == is_enabled)
        if is_public is not None:
            query = query.filter(BlogConfig.is_public == is_public)
        if search:
            query = query.filter(
                or_(
                    BlogConfig.config_key.ilike(f"%{search}%"),
                    BlogConfig.display_name.ilike(f"%{search}%"),
                    BlogConfig.description.ilike(f"%{search}%")
                )
            )

        return query.order_by(
            BlogConfig.category,
            BlogConfig.sort_order,
            BlogConfig.id
        ).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: BlogConfigCreate) -> BlogConfig:
        """创建配置"""
        db_obj = BlogConfig(**obj_in.dict())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # 记录历史
        self._record_history(
            db, 
            config_key=db_obj.config_key,
            old_value=None,
            new_value=db_obj.config_value,
            change_reason="创建配置"
        )
        
        # 清除相关缓存
        self._clear_cache(db, category=db_obj.category)
        
        return db_obj

    def update(
        self, 
        db: Session, 
        *, 
        db_obj: BlogConfig, 
        obj_in: Union[BlogConfigUpdate, Dict[str, Any]]
    ) -> BlogConfig:
        """更新配置"""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)

        old_value = db_obj.config_value
        
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        # 更新版本号
        db_obj.version += 1
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # 记录历史
        if old_value != db_obj.config_value:
            self._record_history(
                db,
                config_key=db_obj.config_key,
                old_value=old_value,
                new_value=db_obj.config_value,
                change_reason="更新配置"
            )
        
        # 清除相关缓存
        self._clear_cache(db, category=db_obj.category)
        
        return db_obj

    def update_by_key(
        self,
        db: Session,
        *,
        config_key: str,
        config_value: Optional[str] = None,
        obj_in: Optional[BlogConfigUpdate] = None
    ) -> Optional[BlogConfig]:
        """根据键名更新配置"""
        db_obj = self.get_by_key(db, config_key=config_key)
        if not db_obj:
            return None

        if obj_in:
            return self.update(db, db_obj=db_obj, obj_in=obj_in)
        elif config_value is not None:
            return self.update(db, db_obj=db_obj, obj_in={"config_value": config_value})
        
        return db_obj

    def delete(self, db: Session, *, config_id: int) -> Optional[BlogConfig]:
        """删除配置"""
        obj = db.query(BlogConfig).get(config_id)
        if obj:
            # 记录历史
            self._record_history(
                db,
                config_key=obj.config_key,
                old_value=obj.config_value,
                new_value=None,
                change_reason="删除配置"
            )
            
            db.delete(obj)
            db.commit()
            
            # 清除相关缓存
            self._clear_cache(db, category=obj.category)
            
        return obj

    # ============ 批量操作 ============

    def batch_update(
        self,
        db: Session,
        *,
        batch_data: BatchConfigUpdate
    ) -> List[BlogConfig]:
        """批量更新配置"""
        updated_configs = []
        
        for config_update in batch_data.configs:
            db_obj = self.get_by_key(db, config_key=config_update.config_key)
            if db_obj:
                old_value = db_obj.config_value
                db_obj.config_value = config_update.config_value
                db_obj.version += 1
                
                db.add(db_obj)
                updated_configs.append(db_obj)
                
                # 记录历史
                self._record_history(
                    db,
                    config_key=db_obj.config_key,
                    old_value=old_value,
                    new_value=db_obj.config_value,
                    change_reason=batch_data.change_reason or "批量更新"
                )
        
        db.commit()
        
        # 刷新对象
        for obj in updated_configs:
            db.refresh(obj)
        
        # 清除所有缓存
        self._clear_all_cache(db)
        
        return updated_configs

    # ============ 分类和分组查询 ============

    def get_by_category(self, db: Session, category: ConfigCategory) -> List[BlogConfig]:
        """根据分类获取配置"""
        return db.query(BlogConfig).filter(
            BlogConfig.category == category,
            BlogConfig.is_enabled == True
        ).order_by(BlogConfig.sort_order, BlogConfig.id).all()

    def get_public_configs(self, db: Session) -> List[BlogConfig]:
        """获取所有公开配置"""
        return db.query(BlogConfig).filter(
            BlogConfig.is_public == True,
            BlogConfig.is_enabled == True
        ).order_by(
            BlogConfig.category,
            BlogConfig.sort_order,
            BlogConfig.id
        ).all()

    def get_grouped_configs(self, db: Session, category: ConfigCategory) -> Dict[str, List[BlogConfig]]:
        """获取分组的配置"""
        configs = self.get_by_category(db, category)
        grouped = {}
        
        for config in configs:
            group_key = config.group_key or "default"
            if group_key not in grouped:
                grouped[group_key] = []
            grouped[group_key].append(config)
        
        return grouped

    # ============ 缓存操作 ============

    def get_cached_configs(
        self,
        db: Session,
        category: ConfigCategory,
        cache_ttl: int = 3600
    ) -> Optional[List[BlogConfig]]:
        """获取缓存的配置"""
        cache_key = f"configs_{category.value}"
        cache_obj = db.query(ConfigCache).filter(
            ConfigCache.cache_key == cache_key,
            ConfigCache.expires_at > datetime.utcnow()
        ).first()
        
        if cache_obj:
            # 从缓存数据重建对象（简化版本）
            return cache_obj.cache_data
        
        return None

    def cache_configs(
        self,
        db: Session,
        category: ConfigCategory,
        configs: List[BlogConfig],
        cache_ttl: int = 3600
    ) -> None:
        """缓存配置"""
        cache_key = f"configs_{category.value}"
        expires_at = datetime.utcnow() + timedelta(seconds=cache_ttl)
        
        # 删除旧缓存
        db.query(ConfigCache).filter(ConfigCache.cache_key == cache_key).delete()
        
        # 创建新缓存
        cache_data = [
            {
                "config_key": config.config_key,
                "config_value": config.config_value,
                "data_type": config.data_type.value,
                "display_name": config.display_name
            }
            for config in configs
        ]
        
        cache_obj = ConfigCache(
            cache_key=cache_key,
            cache_data=cache_data,
            category=category,
            expires_at=expires_at
        )
        
        db.add(cache_obj)
        db.commit()

    def _clear_cache(self, db: Session, category: ConfigCategory) -> None:
        """清除指定分类的缓存"""
        cache_key = f"configs_{category.value}"
        db.query(ConfigCache).filter(ConfigCache.cache_key == cache_key).delete()
        db.commit()

    def _clear_all_cache(self, db: Session) -> None:
        """清除所有缓存"""
        db.query(ConfigCache).delete()
        db.commit()

    # ============ 历史记录 ============

    def _record_history(
        self,
        db: Session,
        *,
        config_key: str,
        old_value: Optional[str],
        new_value: Optional[str],
        change_reason: str,
        changed_by: Optional[int] = None
    ) -> None:
        """记录配置变更历史"""
        history = ConfigHistory(
            config_key=config_key,
            old_value=old_value,
            new_value=new_value,
            change_reason=change_reason,
            changed_by=changed_by
        )
        db.add(history)
        db.commit()

    def get_config_history(
        self,
        db: Session,
        config_key: str,
        limit: int = 50
    ) -> List[ConfigHistory]:
        """获取配置变更历史"""
        return db.query(ConfigHistory).filter(
            ConfigHistory.config_key == config_key
        ).order_by(desc(ConfigHistory.changed_at)).limit(limit).all()

    # ============ 图库引用功能 ============

    def update_logo_from_gallery(
        self,
        db: Session,
        *,
        image_id: int,
        config_key: str = "site_logo"
    ) -> Optional[BlogConfig]:
        """
        从图库更新Logo配置
        将图库中的图片设置为网站Logo
        """
        # 验证图片存在
        image = db.query(ImageGallery).filter(ImageGallery.id == image_id).first()
        if not image:
            return None
        
        # 获取配置项
        config = self.get_by_key(db, config_key=config_key)
        if not config:
            return None
        
        # 更新配置值为图片URL
        old_value = config.config_value
        config.config_value = image.file_url
        config.version += 1
        
        db.add(config)
        db.commit()
        db.refresh(config)
        
        # 记录历史
        self._record_history(
            db,
            config_key=config_key,
            old_value=old_value,
            new_value=image.file_url,
            change_reason=f"从图库更新Logo (图片ID: {image_id})"
        )
        
        # 清除缓存
        self._clear_cache(db, category=config.category)
        
        return config

    def get_image_configs(self, db: Session) -> List[BlogConfig]:
        """
        获取所有图片类型的配置
        """
        return db.query(BlogConfig).filter(
            BlogConfig.data_type == ConfigDataType.IMAGE
        ).all()

    def update_config_with_image(
        self,
        db: Session,
        *,
        config_key: str,
        image_id: int,
        change_reason: Optional[str] = None
    ) -> Optional[BlogConfig]:
        """
        使用图库中的图片更新配置
        """
        # 验证图片存在且可用
        image = db.query(ImageGallery).filter(
            ImageGallery.id == image_id,
            ImageGallery.status == "active",
            ImageGallery.is_public == True
        ).first()
        
        if not image:
            return None
        
        # 获取配置项
        config = self.get_by_key(db, config_key=config_key)
        if not config:
            return None
        
        # 更新配置
        old_value = config.config_value
        config.config_value = image.file_url
        config.version += 1
        
        db.add(config)
        db.commit()
        db.refresh(config)
        
        # 记录历史
        self._record_history(
            db,
            config_key=config_key,
            old_value=old_value,
            new_value=image.file_url,
            change_reason=change_reason or f"使用图库图片更新配置 (图片ID: {image_id})"
        )
        
        # 清除缓存
        self._clear_cache(db, category=config.category)
        
        return config

    def get_config_with_image_info(
        self,
        db: Session,
        config_key: str
    ) -> Optional[Dict[str, Any]]:
        """
        获取配置及其关联的图片信息
        """
        config = self.get_by_key(db, config_key=config_key)
        if not config:
            return None
        
        result = {
            "config": config,
            "image": None
        }
        
        # 如果配置值是图片URL，尝试找到对应的图库记录
        if config.config_value and config.data_type in [ConfigDataType.IMAGE, ConfigDataType.URL]:
            image = db.query(ImageGallery).filter(
                ImageGallery.file_url == config.config_value
            ).first()
            
            if image:
                result["image"] = image
        
        return result

    # ============ 初始化默认配置 ============

    def init_default_configs(self, db: Session) -> List[BlogConfig]:
        """初始化默认配置"""
        default_configs = self._get_default_config_data()
        created_configs = []
        
        for config_data in default_configs:
            # 检查是否已存在
            existing = self.get_by_key(db, config_key=config_data["config_key"])
            if not existing:
                config_create = BlogConfigCreate(**config_data)
                created_config = self.create(db, obj_in=config_create)
                created_configs.append(created_config)
        
        return created_configs

    def _get_default_config_data(self) -> List[Dict[str, Any]]:
        """获取默认配置数据"""
        return [
            # 站点基础配置
            {
                "config_key": "site_title",
                "config_value": "我的博客",
                "default_value": "我的博客",
                "category": ConfigCategory.SITE_BASIC,
                "group_key": "site_identity",
                "data_type": ConfigDataType.STRING,
                "display_name": "网站标题",
                "description": "网站的主标题，显示在浏览器标题栏和页面头部",
                "placeholder": "请输入网站标题",
                "validation_rules": {"required": True, "min_length": 1, "max_length": 100},
                "is_required": True,
                "sort_order": 1
            },
            {
                "config_key": "site_subtitle",
                "config_value": "分享技术与生活",
                "default_value": "",
                "category": ConfigCategory.SITE_BASIC,
                "group_key": "site_identity",
                "data_type": ConfigDataType.STRING,
                "display_name": "网站副标题",
                "description": "网站的副标题或标语",
                "placeholder": "请输入网站副标题",
                "validation_rules": {"max_length": 200},
                "sort_order": 2
            },
            {
                "config_key": "site_description",
                "config_value": "这是一个记录技术学习和生活感悟的个人博客",
                "default_value": "",
                "category": ConfigCategory.SITE_BASIC,
                "group_key": "site_content",
                "data_type": ConfigDataType.TEXT,
                "display_name": "网站描述",
                "description": "网站的详细描述，用于SEO和社交分享",
                "placeholder": "请输入网站描述",
                "validation_rules": {"max_length": 500},
                "sort_order": 3
            },
            {
                "config_key": "site_logo",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.SITE_BASIC,
                "group_key": "site_identity",
                "data_type": ConfigDataType.IMAGE,
                "display_name": "网站Logo",
                "description": "网站Logo图片，可从图库选择或上传新图片",
                "placeholder": "请选择或上传Logo图片",
                "validation_rules": {"type": "image", "max_size": "2MB", "formats": ["png", "jpg", "jpeg", "svg"]},
                "sort_order": 5
            },
            {
                "config_key": "site_favicon",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.SITE_BASIC,
                "group_key": "site_identity",
                "data_type": ConfigDataType.IMAGE,
                "display_name": "网站图标",
                "description": "网站Favicon图标，可从图库选择或上传新图片",
                "placeholder": "请选择或上传Favicon图标",
                "validation_rules": {"type": "image", "max_size": "1MB", "formats": ["ico", "png"], "recommended_size": "32x32"},
                "sort_order": 6
            },
            {
                "config_key": "site_language",
                "config_value": "zh-CN",
                "default_value": "zh-CN",
                "category": ConfigCategory.SITE_BASIC,
                "group_key": "site_settings",
                "data_type": ConfigDataType.SELECT,
                "display_name": "网站语言",
                "description": "网站的主要语言设置",
                "options": [
                    {"value": "zh-CN", "label": "简体中文"},
                    {"value": "en-US", "label": "English"},
                    {"value": "ja-JP", "label": "日本語"}
                ],
                "sort_order": 7
            },
            {
                "config_key": "site_timezone",
                "config_value": "Asia/Shanghai",
                "default_value": "Asia/Shanghai",
                "category": ConfigCategory.SITE_BASIC,
                "group_key": "site_settings",
                "data_type": ConfigDataType.SELECT,
                "display_name": "时区设置",
                "description": "网站的时区设置，影响时间显示",
                "options": [
                    {"value": "Asia/Shanghai", "label": "北京时间"},
                    {"value": "UTC", "label": "UTC"},
                    {"value": "America/New_York", "label": "纽约时间"}
                ],
                "sort_order": 8
            },
            {
                "config_key": "site_copyright",
                "config_value": "© 2024 我的博客. All rights reserved.",
                "default_value": "© 2024 我的博客. All rights reserved.",
                "category": ConfigCategory.SITE_BASIC,
                "group_key": "site_legal",
                "data_type": ConfigDataType.STRING,
                "display_name": "版权信息",
                "description": "网站的版权声明信息",
                "placeholder": "© 2024 我的博客. All rights reserved.",
                "validation_rules": {"max_length": 200},
                "sort_order": 9
            },
            {
                "config_key": "site_icp",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.SITE_BASIC,
                "group_key": "site_legal",
                "data_type": ConfigDataType.STRING,
                "display_name": "ICP备案号",
                "description": "网站的ICP备案号（中国网站必需）",
                "placeholder": "京ICP备12345678号",
                "validation_rules": {"pattern": "^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领]ICP备\\d+号(-\\d+)?$"},
                "sort_order": 10
            },
            {
                "config_key": "site_author",
                "config_value": "博主",
                "default_value": "",
                "category": ConfigCategory.SITE_BASIC,
                "group_key": "site_identity",
                "data_type": ConfigDataType.STRING,
                "display_name": "网站作者",
                "description": "网站作者或博主名称",
                "placeholder": "请输入作者名称",
                "validation_rules": {"max_length": 100},
                "sort_order": 4
            },
            
            # 联系方式配置
            {
                "config_key": "contact_email",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.CONTACT,
                "group_key": "contact_basic",
                "data_type": ConfigDataType.EMAIL,
                "display_name": "联系邮箱",
                "description": "主要联系邮箱地址",
                "placeholder": "your@email.com",
                "validation_rules": {"type": "email"},
                "is_required": True,
                "sort_order": 1
            },
            {
                "config_key": "contact_phone",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.CONTACT,
                "group_key": "contact_basic",
                "data_type": ConfigDataType.STRING,
                "display_name": "联系电话",
                "description": "联系电话号码",
                "placeholder": "+86 138-0000-0000",
                "validation_rules": {"pattern": "^[+]?[0-9\\s\\-\\(\\)]+$"},
                "sort_order": 2
            },
            {
                "config_key": "contact_address",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.CONTACT,
                "group_key": "contact_basic",
                "data_type": ConfigDataType.TEXT,
                "display_name": "联系地址",
                "description": "详细联系地址",
                "placeholder": "请输入联系地址",
                "validation_rules": {"max_length": 300},
                "sort_order": 3
            },
            {
                "config_key": "contact_wechat",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.CONTACT,
                "group_key": "contact_social",
                "data_type": ConfigDataType.STRING,
                "display_name": "微信号",
                "description": "微信联系方式",
                "placeholder": "请输入微信号",
                "validation_rules": {"max_length": 50},
                "sort_order": 4
            },
            {
                "config_key": "contact_qq",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.CONTACT,
                "group_key": "contact_social",
                "data_type": ConfigDataType.STRING,
                "display_name": "QQ号码",
                "description": "QQ联系方式",
                "placeholder": "请输入QQ号码",
                "validation_rules": {"pattern": "^[0-9]{5,12}$"},
                "sort_order": 5
            },
            
            # 社交媒体配置
            {
                "config_key": "social_github",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.SOCIAL,
                "group_key": "social_professional",
                "data_type": ConfigDataType.URL,
                "display_name": "GitHub",
                "description": "GitHub个人主页链接",
                "placeholder": "https://github.com/username",
                "validation_rules": {"type": "url", "pattern": "^https?://(www\\.)?github\\.com/.+"},
                "sort_order": 1
            },
            {
                "config_key": "social_twitter",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.SOCIAL,
                "group_key": "social_media",
                "data_type": ConfigDataType.URL,
                "display_name": "Twitter/X",
                "description": "Twitter(X)个人主页链接",
                "placeholder": "https://twitter.com/username",
                "validation_rules": {"type": "url", "pattern": "^https?://(www\\.)?(twitter\\.com|x\\.com)/.+"},
                "sort_order": 2
            },
            {
                "config_key": "social_linkedin",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.SOCIAL,
                "group_key": "social_professional",
                "data_type": ConfigDataType.URL,
                "display_name": "LinkedIn",
                "description": "LinkedIn个人资料页面链接",
                "placeholder": "https://linkedin.com/in/username",
                "validation_rules": {"type": "url", "pattern": "^https?://(www\\.)?linkedin\\.com/.+"},
                "sort_order": 3
            },
            {
                "config_key": "social_instagram",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.SOCIAL,
                "group_key": "social_media",
                "data_type": ConfigDataType.URL,
                "display_name": "Instagram",
                "description": "Instagram个人主页链接",
                "placeholder": "https://instagram.com/username",
                "validation_rules": {"type": "url", "pattern": "^https?://(www\\.)?instagram\\.com/.+"},
                "sort_order": 4
            },
            {
                "config_key": "social_youtube",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.SOCIAL,
                "group_key": "social_media",
                "data_type": ConfigDataType.URL,
                "display_name": "YouTube",
                "description": "YouTube频道或个人页面",
                "placeholder": "https://youtube.com/@username",
                "validation_rules": {"type": "url", "pattern": "^https?://(www\\.)?youtube\\.com/.+"},
                "sort_order": 5
            },
            {
                "config_key": "social_weibo",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.SOCIAL,
                "group_key": "social_media",
                "data_type": ConfigDataType.URL,
                "display_name": "微博",
                "description": "新浪微博个人主页链接",
                "placeholder": "https://weibo.com/username",
                "validation_rules": {"type": "url", "pattern": "^https?://(www\\.)?weibo\\.com/.+"},
                "sort_order": 6
            },
            
            # SEO配置
            {
                "config_key": "seo_keywords",
                "config_value": "博客,技术,编程,生活",
                "default_value": "",
                "category": ConfigCategory.SEO,
                "group_key": "seo_basic",
                "data_type": ConfigDataType.STRING,
                "display_name": "SEO关键词",
                "description": "网站SEO关键词，用逗号分隔",
                "placeholder": "请输入关键词，用逗号分隔",
                "validation_rules": {"max_length": 200},
                "sort_order": 1
            },
            {
                "config_key": "seo_meta_author",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.SEO,
                "group_key": "seo_basic",
                "data_type": ConfigDataType.STRING,
                "display_name": "网站作者",
                "description": "SEO作者信息",
                "placeholder": "请输入作者名称",
                "validation_rules": {"max_length": 100},
                "sort_order": 2
            },
            {
                "config_key": "seo_google_analytics",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.SEO,
                "group_key": "seo_analytics",
                "data_type": ConfigDataType.STRING,
                "display_name": "Google Analytics",
                "description": "Google Analytics跟踪ID",
                "placeholder": "G-XXXXXXXXXX 或 UA-XXXXXXXX-X",
                "validation_rules": {"pattern": "^(G-[A-Z0-9]+|UA-[0-9]+-[0-9]+)?$"},
                "is_public": False,
                "sort_order": 3
            },
            {
                "config_key": "seo_baidu_analytics",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.SEO,
                "group_key": "seo_analytics",
                "data_type": ConfigDataType.STRING,
                "display_name": "百度统计",
                "description": "百度统计代码",
                "placeholder": "请输入百度统计代码",
                "validation_rules": {"max_length": 100},
                "is_public": False,
                "sort_order": 4
            }
        ]


class CRUDConfigGroup:
    """配置分组 CRUD 操作类"""

    def get(self, db: Session, group_id: int) -> Optional[ConfigGroup]:
        """根据ID获取分组"""
        return db.query(ConfigGroup).filter(ConfigGroup.id == group_id).first()

    def get_by_key(self, db: Session, group_key: str) -> Optional[ConfigGroup]:
        """根据键名获取分组"""
        return db.query(ConfigGroup).filter(ConfigGroup.group_key == group_key).first()

    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        category: Optional[ConfigCategory] = None,
        is_active: Optional[bool] = None
    ) -> List[ConfigGroup]:
        """获取多个分组"""
        query = db.query(ConfigGroup)

        if category:
            query = query.filter(ConfigGroup.category == category)
        if is_active is not None:
            query = query.filter(ConfigGroup.is_active == is_active)

        return query.order_by(
            ConfigGroup.category,
            ConfigGroup.display_order,
            ConfigGroup.id
        ).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: ConfigGroupCreate) -> ConfigGroup:
        """创建分组"""
        db_obj = ConfigGroup(**obj_in.dict())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: ConfigGroup,
        obj_in: Union[ConfigGroupUpdate, Dict[str, Any]]
    ) -> ConfigGroup:
        """更新分组"""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, *, group_id: int) -> Optional[ConfigGroup]:
        """删除分组"""
        obj = db.query(ConfigGroup).get(group_id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

    def init_default_groups(self, db: Session) -> List[ConfigGroup]:
        """初始化默认分组"""
        default_groups = [
            # 站点基础配置分组
            {
                "group_key": "site_identity",
                "group_name": "网站标识",
                "category": ConfigCategory.SITE_BASIC,
                "icon_name": "Globe",
                "color_scheme": "from-blue-500 to-purple-600",
                "description": "网站标题、Logo、作者等标识信息",
                "display_order": 1
            },
            {
                "group_key": "site_content",
                "group_name": "内容设置",
                "category": ConfigCategory.SITE_BASIC,
                "icon_name": "FileText",
                "color_scheme": "from-green-500 to-blue-500",
                "description": "网站描述等内容设置",
                "display_order": 2
            },
            {
                "group_key": "site_settings",
                "group_name": "基础设置",
                "category": ConfigCategory.SITE_BASIC,
                "icon_name": "Settings",
                "color_scheme": "from-indigo-500 to-purple-500",
                "description": "语言、时区等基础设置",
                "display_order": 3
            },
            {
                "group_key": "site_legal",
                "group_name": "法律信息",
                "category": ConfigCategory.SITE_BASIC,
                "icon_name": "Shield",
                "color_scheme": "from-gray-500 to-gray-700",
                "description": "版权、备案号等法律相关信息",
                "display_order": 4
            },
            
            # 联系方式配置分组
            {
                "group_key": "contact_basic",
                "group_name": "基础联系",
                "category": ConfigCategory.CONTACT,
                "icon_name": "Mail",
                "color_scheme": "from-blue-500 to-cyan-500",
                "description": "邮箱、电话、地址等基础联系方式",
                "display_order": 1
            },
            {
                "group_key": "contact_social",
                "group_name": "社交联系",
                "category": ConfigCategory.CONTACT,
                "icon_name": "MessageCircle",
                "color_scheme": "from-green-500 to-teal-500",
                "description": "微信、QQ等社交联系方式",
                "display_order": 2
            },
            
            # 社交媒体配置分组
            {
                "group_key": "social_professional",
                "group_name": "专业平台",
                "category": ConfigCategory.SOCIAL,
                "icon_name": "Briefcase",
                "color_scheme": "from-purple-500 to-indigo-500",
                "description": "GitHub、LinkedIn等专业平台",
                "display_order": 1
            },
            {
                "group_key": "social_media",
                "group_name": "社交媒体",
                "category": ConfigCategory.SOCIAL,
                "icon_name": "Share2",
                "color_scheme": "from-pink-500 to-rose-500",
                "description": "Twitter、Instagram、YouTube等社交媒体平台",
                "display_order": 2
            },
            
            # SEO配置分组
            {
                "group_key": "seo_basic",
                "group_name": "基础SEO",
                "category": ConfigCategory.SEO,
                "icon_name": "Search",
                "color_scheme": "from-purple-500 to-pink-500",
                "description": "关键词、作者等基础SEO设置",
                "display_order": 1
            },
            {
                "group_key": "seo_analytics",
                "group_name": "统计分析",
                "category": ConfigCategory.SEO,
                "icon_name": "BarChart3",
                "color_scheme": "from-orange-500 to-red-500",
                "description": "Google Analytics、百度统计等分析工具",
                "display_order": 2
            }
        ]

        created_groups = []
        for group_data in default_groups:
            existing = self.get_by_key(db, group_key=group_data["group_key"])
            if not existing:
                group_create = ConfigGroupCreate(**group_data)
                created_group = self.create(db, obj_in=group_create)
                created_groups.append(created_group)

        return created_groups


# 创建实例
blog_config = CRUDBlogConfig()
config_group = CRUDConfigGroup()