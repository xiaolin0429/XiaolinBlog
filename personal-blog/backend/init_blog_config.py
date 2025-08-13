"""
博客配置初始化脚本
用于初始化默认的博客配置数据
"""

import asyncio
from sqlalchemy.orm import Session
from app.core.config.database import SessionLocal, engine
from app.models.blog_config import BlogConfig, ConfigGroup
from app.crud import blog_config, config_group


def init_blog_config():
    """初始化博客配置"""
    print("开始初始化博客配置...")
    
    # 创建数据库会话
    db: Session = SessionLocal()
    
    try:
        # 检查是否已有配置数据
        existing_configs = blog_config.get_multi(db, limit=1)
        if existing_configs:
            print("⚠️  检测到已存在配置数据，跳过初始化")
            return
        
        print("📝 初始化默认配置分组...")
        created_groups = config_group.init_default_groups(db)
        print(f"✅ 成功创建 {len(created_groups)} 个配置分组")
        
        print("📝 初始化默认配置项...")
        created_configs = blog_config.init_default_configs(db)
        print(f"✅ 成功创建 {len(created_configs)} 个配置项")
        
        print("🎉 博客配置初始化完成！")
        
        # 显示创建的配置分组
        print("\n📋 已创建的配置分组：")
        for group in created_groups:
            print(f"  - {group.group_name} ({group.group_key})")
        
        # 显示创建的配置项
        print("\n📋 已创建的配置项：")
        for config in created_configs:
            print(f"  - {config.display_name} ({config.config_key}): {config.config_value or '(空)'}")
            
    except Exception as e:
        print(f"❌ 初始化失败: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


def show_config_status():
    """显示当前配置状态"""
    print("\n📊 当前博客配置状态：")
    
    db: Session = SessionLocal()
    
    try:
        # 获取所有配置
        all_configs = blog_config.get_multi(db, limit=1000)
        all_groups = config_group.get_multi(db, limit=100)
        
        print(f"  配置项总数: {len(all_configs)}")
        print(f"  配置分组数: {len(all_groups)}")
        
        # 按分类统计
        from collections import defaultdict
        category_stats = defaultdict(int)
        for config in all_configs:
            category_stats[config.category.value] += 1
        
        print("\n📈 分类统计：")
        for category, count in category_stats.items():
            print(f"  - {category}: {count} 项")
            
        # 显示公开配置
        public_configs = [c for c in all_configs if c.is_public and c.is_enabled]
        print(f"\n🌐 公开配置: {len(public_configs)} 项")
        
    except Exception as e:
        print(f"❌ 获取配置状态失败: {str(e)}")
    finally:
        db.close()


def reset_config():
    """重置配置（危险操作）"""
    print("⚠️  警告：此操作将删除所有现有配置数据！")
    confirm = input("请输入 'RESET' 确认重置: ")
    
    if confirm != 'RESET':
        print("❌ 重置操作已取消")
        return
    
    db: Session = SessionLocal()
    
    try:
        # 删除所有配置
        db.query(BlogConfig).delete()
        db.query(ConfigGroup).delete()
        db.commit()
        
        print("🗑️  已删除所有配置数据")
        
        # 重新初始化
        init_blog_config()
        
    except Exception as e:
        print(f"❌ 重置失败: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


def main():
    """主函数"""
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "init":
            init_blog_config()
        elif command == "status":
            show_config_status()
        elif command == "reset":
            reset_config()
        else:
            print("❌ 未知命令")
            print("可用命令:")
            print("  init   - 初始化默认配置")
            print("  status - 显示配置状态")
            print("  reset  - 重置所有配置（危险）")
    else:
        # 默认执行初始化
        init_blog_config()
        show_config_status()


if __name__ == "__main__":
    main()