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
                "config_key": "site_keywords",
                "config_value": "博客,技术,编程,生活",
                "default_value": "",
                "category": ConfigCategory.SEO,
                "group_key": "seo_basic",
                "data_type": ConfigDataType.STRING,
                "display_name": "网站关键词",
                "description": "网站关键词，用逗号分隔",
                "placeholder": "请输入关键词，用逗号分隔",
                "validation_rules": {"max_length": 200},
                "sort_order": 1
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
                "validation_rules": {"type": "url"},
                "sort_order": 1
            },
            {
                "config_key": "social_email",
                "config_value": "",
                "default_value": "",
                "category": ConfigCategory.SOCIAL,
                "group_key": "social_contact",
                "data_type": ConfigDataType.EMAIL,
                "display_name": "邮箱",
                "description": "联系邮箱地址",
                "placeholder": "your@email.com",
                "validation_rules": {"type": "email"},
                "sort_order": 2
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
            {
                "group_key": "site_identity",
                "group_name": "网站标识",
                "category": ConfigCategory.SITE_BASIC,
                "icon_name": "Globe",
                "color_scheme": "from-blue-500 to-purple-600",
                "description": "网站标题、Logo等标识信息",
                "display_order": 1
            },
            {
                "group_key": "site_content",
                "group_name": "内容设置",
                "category": ConfigCategory.SITE_BASIC,
                "icon_name": "FileText",
                "color_scheme": "from-green-500 to-blue-500",
                "description": "网站描述、关键词等内容设置",
                "display_order": 2
            },
            {
                "group_key": "seo_basic",
                "group_name": "基础SEO",
                "category": ConfigCategory.SEO,
                "icon_name": "Search",
                "color_scheme": "from-purple-500 to-pink-500",
                "description": "基础SEO设置",
                "display_order": 1
            },
            {
                "group_key": "social_professional",
                "group_name": "专业平台",
                "category": ConfigCategory.SOCIAL,
                "icon_name": "Briefcase",
                "color_scheme": "from-green-500 to-teal-500",
                "description": "GitHub等专业平台",
                "display_order": 1
            },
            {
                "group_key": "social_contact",
                "group_name": "联系方式",
                "category": ConfigCategory.SOCIAL,
                "icon_name": "MessageCircle",
                "color_scheme": "from-purple-500 to-indigo-500",
                "description": "邮箱、电话等直接联系方式",
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