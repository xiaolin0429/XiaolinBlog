from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional, Dict, Any
from app.models.site_config import SiteConfig, ConfigCategory
from app.schemas.site_config import SiteConfigCreate, SiteConfigUpdate
import json


class CRUDSiteConfig:
    def get(self, db: Session, config_id: int) -> Optional[SiteConfig]:
        """获取单个配置项"""
        return db.query(SiteConfig).filter(SiteConfig.id == config_id).first()

    def get_by_key(self, db: Session, key: str) -> Optional[SiteConfig]:
        """根据键名获取配置项"""
        return db.query(SiteConfig).filter(SiteConfig.key == key).first()

    def get_multi(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        category: Optional[ConfigCategory] = None
    ) -> List[SiteConfig]:
        """获取多个配置项"""
        query = db.query(SiteConfig)
        if category:
            query = query.filter(SiteConfig.category == category)
        return query.order_by(SiteConfig.sort_order, SiteConfig.id).offset(skip).limit(limit).all()

    def get_by_category(self, db: Session, category: ConfigCategory) -> List[SiteConfig]:
        """根据分类获取配置项"""
        return db.query(SiteConfig).filter(
            SiteConfig.category == category
        ).order_by(SiteConfig.sort_order, SiteConfig.id).all()

    def get_public_configs(self, db: Session) -> List[SiteConfig]:
        """获取所有启用的配置项（值不为空即为启用）"""
        return db.query(SiteConfig).filter(
            SiteConfig.value.isnot(None),
            SiteConfig.value != ""
        ).order_by(SiteConfig.category, SiteConfig.sort_order).all()

    def create(self, db: Session, *, obj_in: SiteConfigCreate) -> SiteConfig:
        """创建配置项"""
        db_obj = SiteConfig(
            key=obj_in.key,
            value=obj_in.value,
            category=obj_in.category,
            description=obj_in.description,
            data_type=obj_in.data_type,
            is_public=obj_in.is_public,
            sort_order=obj_in.sort_order
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: SiteConfig, obj_in: SiteConfigUpdate
    ) -> SiteConfig:
        """更新配置项"""
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_by_key(
        self, db: Session, *, key: str, value: str = None, obj_in: SiteConfigUpdate = None
    ) -> Optional[SiteConfig]:
        """根据键名更新配置项的值"""
        db_obj = self.get_by_key(db, key=key)
        if db_obj:
            if obj_in:
                # 如果提供了 obj_in，使用它来更新
                update_data = obj_in.dict(exclude_unset=True)
                for field, field_value in update_data.items():
                    if field == 'value' or hasattr(db_obj, field):
                        setattr(db_obj, field, field_value)
            elif value is not None:
                # 如果只提供了 value，直接更新值
                db_obj.value = value
            
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
        return db_obj

    def batch_update(
        self, db: Session, *, configs: List[Any]
    ) -> List[SiteConfig]:
        """批量更新配置项"""
        if not configs:
            raise ValueError("配置项列表不能为空")
        
        updated_configs = []
        errors = []
        
        try:
            for i, config_item in enumerate(configs):
                # 支持字典格式（向后兼容）和Pydantic模型格式
                if hasattr(config_item, 'key') and hasattr(config_item, 'value'):
                    # Pydantic模型格式
                    key = config_item.key
                    value = config_item.value
                elif isinstance(config_item, dict):
                    # 字典格式（向后兼容）
                    key = config_item.get('key')
                    value = config_item.get('value')
                else:
                    errors.append(f"配置项 {i+1}: 数据格式不正确")
                    continue
                
                # 验证必需字段
                if not key:
                    errors.append(f"配置项 {i+1}: 缺少 key 字段")
                    continue
                
                if value is None:
                    errors.append(f"配置项 {i+1}: 缺少 value 字段")
                    continue
                
                # 查找数据库中的配置项
                db_obj = self.get_by_key(db, key=key)
                if not db_obj:
                    errors.append(f"配置项 {i+1}: 键名 '{key}' 不存在")
                    continue
                
                # 验证数据类型（如果有定义）
                if hasattr(db_obj, 'data_type') and db_obj.data_type:
                    validation_error = self._validate_config_value(value, db_obj.data_type)
                    if validation_error:
                        errors.append(f"配置项 {i+1} (key: {key}): {validation_error}")
                        continue
                
                # 更新配置项
                old_value = db_obj.value
                db_obj.value = str(value) if value is not None else ""
                db.add(db_obj)
                updated_configs.append(db_obj)
                
                # 记录更新日志
                print(f"更新配置项: {key} = '{old_value}' -> '{db_obj.value}'")
            
            # 如果有错误，抛出异常
            if errors:
                raise ValueError("批量更新失败:\n" + "\n".join(errors))
            
            # 提交事务
            db.commit()
            
            # 刷新所有更新的对象
            for config in updated_configs:
                db.refresh(config)
            
            return updated_configs
            
        except Exception as e:
            # 回滚事务
            db.rollback()
            raise e
    
    def _validate_config_value(self, value: Any, data_type: str) -> str:
        """验证配置值的数据类型"""
        if value is None or value == "":
            return ""  # 空值通常是允许的
        
        value_str = str(value)
        
        try:
            if data_type == "number":
                float(value_str)
            elif data_type == "boolean":
                if value_str.lower() not in ['true', 'false', '1', '0']:
                    return "布尔值格式不正确，应为 true/false 或 1/0"
            elif data_type == "email":
                import re
                email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                if not re.match(email_pattern, value_str):
                    return "邮箱格式不正确"
            elif data_type == "url":
                import re
                url_pattern = r'^https?://[^\s/$.?#].[^\s]*$'
                if value_str and not re.match(url_pattern, value_str):
                    return "URL格式不正确"
            elif data_type == "json":
                import json
                json.loads(value_str)
        except (ValueError, TypeError) as e:
            return f"数据类型验证失败: {str(e)}"
        
        return ""

    def delete(self, db: Session, *, config_id: int) -> SiteConfig:
        """删除配置项"""
        obj = db.query(SiteConfig).get(config_id)
        db.delete(obj)
        db.commit()
        return obj

    def delete_by_key(self, db: Session, *, key: str) -> Optional[SiteConfig]:
        """根据键名删除配置项"""
        obj = self.get_by_key(db, key=key)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

    def get_social_configs(self, db: Session) -> List[SiteConfig]:
        """获取所有社交媒体配置项"""
        return db.query(SiteConfig).filter(
            SiteConfig.category == ConfigCategory.SOCIAL
        ).order_by(SiteConfig.sort_order, SiteConfig.id).all()

    def create_social_config(
        self, db: Session, *, key: str, value: str, description: str = ""
    ) -> SiteConfig:
        """创建社交媒体配置项"""
        # 确保key以social_开头
        if not key.startswith("social_"):
            key = f"social_{key}"
        
        # 检查是否已存在
        existing = self.get_by_key(db, key=key)
        if existing:
            raise ValueError(f"社交媒体配置项 {key} 已存在")
        
        # 获取当前最大排序号
        max_sort = db.query(SiteConfig).filter(
            SiteConfig.category == ConfigCategory.SOCIAL
        ).count()
        
        config_data = SiteConfigCreate(
            key=key,
            value=value,
            category=ConfigCategory.SOCIAL,
            description=description or f"{key.replace('social_', '').title()}链接",
            data_type="url" if value.startswith(("http://", "https://")) else "string",
            sort_order=max_sort + 1
        )
        
        return self.create(db, obj_in=config_data)

    def delete_social_config(self, db: Session, *, key: str) -> Optional[SiteConfig]:
        """删除社交媒体配置项"""
        if not key.startswith("social_"):
            key = f"social_{key}"
        
        config = self.get_by_key(db, key=key)
        if config and config.category == ConfigCategory.SOCIAL:
            db.delete(config)
            db.commit()
            return config
        return None

    def init_default_configs(self, db: Session) -> List[SiteConfig]:
        """初始化默认配置项"""
        default_configs = [
            # 基础信息
            {"key": "site_title", "value": "我的博客", "category": ConfigCategory.BASIC, "description": "网站标题", "data_type": "string", "sort_order": 1},
            {"key": "site_subtitle", "value": "分享技术与生活", "category": ConfigCategory.BASIC, "description": "网站副标题", "data_type": "string", "sort_order": 2},
            {"key": "site_description", "value": "这是一个个人技术博客", "category": ConfigCategory.BASIC, "description": "网站描述", "data_type": "string", "sort_order": 3},
            {"key": "site_keywords", "value": "博客,技术,编程", "category": ConfigCategory.BASIC, "description": "网站关键词", "data_type": "string", "sort_order": 4},
            {"key": "site_logo", "value": "", "category": ConfigCategory.BASIC, "description": "网站Logo", "data_type": "url", "sort_order": 5},
            {"key": "site_favicon", "value": "", "category": ConfigCategory.BASIC, "description": "网站图标", "data_type": "url", "sort_order": 6},
            {"key": "site_language", "value": "zh-CN", "category": ConfigCategory.BASIC, "description": "网站语言", "data_type": "string", "sort_order": 7},
            {"key": "site_timezone", "value": "Asia/Shanghai", "category": ConfigCategory.BASIC, "description": "时区设置", "data_type": "string", "sort_order": 8},
            
            # 联系方式
            {"key": "contact_email", "value": "", "category": ConfigCategory.CONTACT, "description": "联系邮箱", "data_type": "email", "sort_order": 1},
            {"key": "contact_phone", "value": "", "category": ConfigCategory.CONTACT, "description": "联系电话", "data_type": "string", "sort_order": 2},
            {"key": "contact_address", "value": "", "category": ConfigCategory.CONTACT, "description": "联系地址", "data_type": "string", "sort_order": 3},
            {"key": "contact_wechat", "value": "", "category": ConfigCategory.CONTACT, "description": "微信号", "data_type": "string", "sort_order": 4},
            {"key": "contact_qq", "value": "", "category": ConfigCategory.CONTACT, "description": "QQ号", "data_type": "string", "sort_order": 5},
            
            # 社交媒体启用状态
            {"key": "github_enabled", "value": "false", "category": ConfigCategory.SOCIAL, "description": "是否启用GitHub", "data_type": "boolean", "sort_order": 1},
            {"key": "twitter_enabled", "value": "false", "category": ConfigCategory.SOCIAL, "description": "是否启用Twitter", "data_type": "boolean", "sort_order": 2},
            {"key": "linkedin_enabled", "value": "false", "category": ConfigCategory.SOCIAL, "description": "是否启用LinkedIn", "data_type": "boolean", "sort_order": 3},
            {"key": "instagram_enabled", "value": "false", "category": ConfigCategory.SOCIAL, "description": "是否启用Instagram", "data_type": "boolean", "sort_order": 4},
            {"key": "facebook_enabled", "value": "false", "category": ConfigCategory.SOCIAL, "description": "是否启用Facebook", "data_type": "boolean", "sort_order": 5},
            {"key": "youtube_enabled", "value": "false", "category": ConfigCategory.SOCIAL, "description": "是否启用YouTube", "data_type": "boolean", "sort_order": 6},
            
            # 社交媒体链接（默认为空，支持动态添加）
            {"key": "social_github", "value": "", "category": ConfigCategory.SOCIAL, "description": "GitHub链接", "data_type": "url", "sort_order": 7},
            {"key": "social_weibo", "value": "", "category": ConfigCategory.SOCIAL, "description": "微博链接", "data_type": "url", "sort_order": 8},
            {"key": "social_wechat", "value": "", "category": ConfigCategory.SOCIAL, "description": "微信链接", "data_type": "string", "sort_order": 9},
            {"key": "social_twitter", "value": "", "category": ConfigCategory.SOCIAL, "description": "Twitter链接", "data_type": "url", "sort_order": 10},
            {"key": "social_linkedin", "value": "", "category": ConfigCategory.SOCIAL, "description": "LinkedIn链接", "data_type": "url", "sort_order": 11},
            {"key": "social_instagram", "value": "", "category": ConfigCategory.SOCIAL, "description": "Instagram链接", "data_type": "url", "sort_order": 12},
            {"key": "social_youtube", "value": "", "category": ConfigCategory.SOCIAL, "description": "YouTube链接", "data_type": "url", "sort_order": 13},
            
            # SEO设置
            {"key": "seo_google_analytics", "value": "", "category": ConfigCategory.SEO, "description": "Google Analytics代码", "data_type": "string", "sort_order": 1},
            {"key": "seo_baidu_analytics", "value": "", "category": ConfigCategory.SEO, "description": "百度统计代码", "data_type": "string", "sort_order": 2},
            {"key": "seo_meta_author", "value": "", "category": ConfigCategory.SEO, "description": "网站作者", "data_type": "string", "sort_order": 3},
            {"key": "seo_meta_keywords", "value": "", "category": ConfigCategory.SEO, "description": "SEO关键词", "data_type": "string", "sort_order": 4},
            {"key": "seo_meta_description", "value": "", "category": ConfigCategory.SEO, "description": "SEO描述", "data_type": "string", "sort_order": 5},
            
            # 其他配置
            {"key": "other_copyright", "value": "© 2024 我的博客. All rights reserved.", "category": ConfigCategory.OTHER, "description": "版权声明", "data_type": "string", "sort_order": 1},
            {"key": "other_icp", "value": "", "category": ConfigCategory.OTHER, "description": "ICP备案号", "data_type": "string", "sort_order": 2},
            {"key": "other_public_security", "value": "", "category": ConfigCategory.OTHER, "description": "公安备案号", "data_type": "string", "sort_order": 3},
            {"key": "other_notice", "value": "", "category": ConfigCategory.OTHER, "description": "网站公告", "data_type": "string", "sort_order": 4},
        ]
        
        created_configs = []
        for config_data in default_configs:
            # 检查是否已存在
            existing = self.get_by_key(db, key=config_data["key"])
            if not existing:
                config_create = SiteConfigCreate(**config_data)
                created_config = self.create(db, obj_in=config_create)
                created_configs.append(created_config)
        
        return created_configs


site_config = CRUDSiteConfig()