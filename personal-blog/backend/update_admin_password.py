#!/usr/bin/env python3
"""
更新管理员用户密码的脚本
"""
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.security import get_password_hash

def update_admin_password():
    """更新管理员用户密码"""
    # 数据库连接配置
    database_url = "postgresql://blog_user:blog_password@localhost:5432/blog_db"
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(bind=engine)
    
    with SessionLocal() as session:
        try:
            # 生成新的密码哈希
            new_password_hash = get_password_hash("admin123")
            
            # 更新admin用户的密码
            result = session.execute(
                text("""
                UPDATE users 
                SET hashed_password = :password_hash, 
                    email = 'admin@blog.com',
                    updated_at = NOW()
                WHERE username = 'admin'
                """),
                {"password_hash": new_password_hash}
            )
            
            if result.rowcount > 0:
                session.commit()
                print("✅ 管理员密码更新成功！")
                print("用户名: admin")
                print("邮箱: admin@blog.com") 
                print("密码: admin123")
                
                # 验证更新结果
                user_info = session.execute(
                    text("SELECT username, email, is_superuser FROM users WHERE username = 'admin'")
                ).fetchone()
                
                if user_info:
                    print(f"\n📋 用户信息:")
                    print(f"用户名: {user_info[0]}")
                    print(f"邮箱: {user_info[1]}")
                    print(f"超级用户: {user_info[2]}")
            else:
                print("❌ 未找到admin用户")
                
        except Exception as e:
            print(f"❌ 更新密码失败: {e}")
            session.rollback()

if __name__ == "__main__":
    update_admin_password()