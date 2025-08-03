#!/usr/bin/env python3
"""
创建默认管理员用户的脚本
"""
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.user import User
from app.core.security import get_password_hash

def create_admin_user():
    """创建默认管理员用户"""
    # 创建数据库引擎 (同步版本)
    database_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(bind=engine)
    
    with SessionLocal() as session:
        try:
            # 检查是否已存在管理员用户
            existing_admin = session.execute(
                text("SELECT * FROM users WHERE email = 'admin@example.com'")
            ).fetchone()
            
            if existing_admin:
                print("管理员用户已存在")
                return
            
            # 创建管理员用户
            admin_user = User(
                username="admin",
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                is_active=True,
                is_superuser=True,
                full_name="管理员"
            )
            
            session.add(admin_user)
            session.commit()
            print("管理员用户创建成功！")
            print("用户名: admin@example.com")
            print("密码: admin123")
            
        except Exception as e:
            print(f"创建管理员用户失败: {e}")
            session.rollback()

if __name__ == "__main__":
    create_admin_user()
