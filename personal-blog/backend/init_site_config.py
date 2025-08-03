"""
初始化网站配置数据脚本
"""
import asyncio
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.site_config import SiteConfig
from app.crud.site_config import site_config

async def init_default_configs():
    """初始化默认配置项"""
    db = SessionLocal()
    try:
        # 检查是否已有配置数据
        existing_configs = site_config.get_multi(db, limit=1)
        if existing_configs:
            print("配置数据已存在，跳过初始化")
            return
        
        # 初始化默认配置
        print("开始初始化默认配置...")
        created_configs = site_config.init_default_configs(db)
        print(f"成功创建 {len(created_configs)} 个默认配置项")
        
        # 打印创建的配置项
        for config in created_configs:
            print(f"- {config.key}: {config.description}")
            
    except Exception as e:
        print(f"初始化配置失败: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(init_default_configs())