"""
插入测试数据脚本
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.category import Category
from app.models.tag import Tag
from app.models.post import Post
from app.models.comment import Comment
from app.core.security import get_password_hash


def insert_test_data():
    """插入测试数据"""
    session = SessionLocal()
    try:
        # 1. 创建用户
        print("创建用户...")
        users_data = [
            {
                "username": "admin",
                "email": "admin@blog.com",
                "hashed_password": get_password_hash("admin123"),
                "full_name": "系统管理员",
                "bio": "博客系统管理员，负责内容管理和维护。",
                "is_active": True,
                "is_superuser": True,
                "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
            },
            {
                "username": "author1",
                "email": "author1@blog.com", 
                "hashed_password": get_password_hash("author123"),
                "full_name": "张三",
                "bio": "热爱技术分享的程序员，专注于前端开发和用户体验设计。",
                "is_active": True,
                "is_superuser": False,
                "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
            },
            {
                "username": "author2", 
                "email": "author2@blog.com",
                "hashed_password": get_password_hash("author123"),
                "full_name": "李四",
                "bio": "全栈开发工程师，喜欢探索新技术，分享开发经验。",
                "is_active": True,
                "is_superuser": False,
                "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
            }
        ]
        
        users = []
        for user_data in users_data:
            user = User(**user_data)
            session.add(user)
            users.append(user)
        
        session.flush()  # 获取用户ID
        
        # 2. 创建分类
        print("创建分类...")
        categories_data = [
            {
                "name": "技术分享",
                "slug": "tech",
                "description": "分享最新的技术趋势、开发经验和编程技巧",
                "color": "#3B82F6"
            },
            {
                "name": "生活随笔",
                "slug": "life",
                "description": "记录生活中的点点滴滴，分享人生感悟",
                "color": "#10B981"
            },
            {
                "name": "学习笔记",
                "slug": "study",
                "description": "学习过程中的笔记整理和知识总结",
                "color": "#F59E0B"
            },
            {
                "name": "项目实战",
                "slug": "project",
                "description": "实际项目开发经验和案例分析",
                "color": "#EF4444"
            }
        ]
        
        categories = []
        for cat_data in categories_data:
            category = Category(**cat_data)
            session.add(category)
            categories.append(category)
        
        session.flush()
        
        # 3. 创建标签
        print("创建标签...")
        tags_data = [
            {"name": "Python", "slug": "python", "color": "#3776AB"},
            {"name": "JavaScript", "slug": "javascript", "color": "#F7DF1E"},
            {"name": "React", "slug": "react", "color": "#61DAFB"},
            {"name": "Vue.js", "slug": "vue", "color": "#4FC08D"},
            {"name": "Node.js", "slug": "nodejs", "color": "#339933"},
            {"name": "数据库", "slug": "database", "color": "#336791"},
            {"name": "算法", "slug": "algorithm", "color": "#FF6B6B"},
            {"name": "设计模式", "slug": "design-pattern", "color": "#4ECDC4"},
            {"name": "前端", "slug": "frontend", "color": "#45B7D1"},
            {"name": "后端", "slug": "backend", "color": "#96CEB4"},
            {"name": "DevOps", "slug": "devops", "color": "#FFEAA7"},
            {"name": "机器学习", "slug": "ml", "color": "#DDA0DD"}
        ]
        
        tags = []
        for tag_data in tags_data:
            tag = Tag(**tag_data)
            session.add(tag)
            tags.append(tag)
        
        session.flush()
        
        # 4. 创建文章
        print("创建文章...")
        posts_data = [
            {
                "title": "Python Web开发最佳实践",
                "slug": "python-web-best-practices",
                "content": """# Python Web开发最佳实践

## 简介

Python作为一门优雅的编程语言，在Web开发领域有着广泛的应用。本文将分享一些Python Web开发的最佳实践。

## 框架选择

### FastAPI
FastAPI是现代、快速的Web框架，具有以下优势：
- 高性能，可与NodeJS和Go媲美
- 自动生成API文档
- 基于标准Python类型提示
- 内置数据验证

### Django
Django是功能完整的Web框架：
- 内置管理后台
- ORM系统强大
- 安全性好
- 社区活跃

## 代码组织

```python
# 项目结构示例
project/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── models/
│   ├── api/
│   └── core/
├── tests/
└── requirements.txt
```

## 最佳实践

1. **使用虚拟环境**
2. **编写测试**
3. **代码格式化**
4. **错误处理**
5. **日志记录**

## 总结

遵循这些最佳实践，可以帮助我们构建更加健壮和可维护的Python Web应用。""",
                "excerpt": "分享Python Web开发中的最佳实践，包括框架选择、代码组织和开发规范。",
                "featured_image": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=400&fit=crop",
                "status": "published",
                "is_featured": True,
                "view_count": 156,
                "like_count": 23,
                "published_at": datetime.now() - timedelta(days=5),
                "author_id": users[1].id,
                "category_id": categories[0].id
            },
            {
                "title": "React Hooks深入理解",
                "slug": "react-hooks-deep-dive",
                "content": """# React Hooks深入理解

## 什么是Hooks

React Hooks是React 16.8引入的新特性，让你可以在函数组件中使用state和其他React特性。

## 常用Hooks

### useState
```jsx
const [count, setCount] = useState(0);
```

### useEffect
```jsx
useEffect(() => {
  document.title = `点击了 ${count} 次`;
}, [count]);
```

### useContext
```jsx
const theme = useContext(ThemeContext);
```

## 自定义Hooks

```jsx
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  
  return { count, increment, decrement };
}
```

## 注意事项

1. 只在函数最顶层调用Hook
2. 只在React函数中调用Hook
3. 使用ESLint插件检查Hook规则

## 总结

Hooks让函数组件拥有了类组件的能力，使代码更加简洁和易于理解。""",
                "excerpt": "深入理解React Hooks的原理和使用方法，包括常用Hooks和自定义Hooks的实现。",
                "featured_image": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop",
                "status": "published",
                "is_featured": True,
                "view_count": 234,
                "like_count": 45,
                "published_at": datetime.now() - timedelta(days=3),
                "author_id": users[1].id,
                "category_id": categories[0].id
            },
            {
                "title": "数据库设计原则与实践",
                "slug": "database-design-principles",
                "content": """# 数据库设计原则与实践

## 设计原则

### 1. 范式化
- 第一范式(1NF)：原子性
- 第二范式(2NF)：完全函数依赖
- 第三范式(3NF)：消除传递依赖

### 2. 索引设计
```sql
-- 单列索引
CREATE INDEX idx_user_email ON users(email);

-- 复合索引
CREATE INDEX idx_post_status_date ON posts(status, published_at);
```

### 3. 约束设计
- 主键约束
- 外键约束
- 唯一约束
- 检查约束

## 性能优化

1. **查询优化**
2. **索引优化**
3. **分区表**
4. **读写分离**

## 实践案例

以博客系统为例，设计用户、文章、评论等表的关系。

## 总结

良好的数据库设计是系统性能和可维护性的基础。""",
                "excerpt": "介绍数据库设计的基本原则和最佳实践，包括范式化、索引设计和性能优化。",
                "featured_image": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=400&fit=crop",
                "status": "published",
                "is_featured": False,
                "view_count": 89,
                "like_count": 12,
                "published_at": datetime.now() - timedelta(days=7),
                "author_id": users[2].id,
                "category_id": categories[0].id
            }
        ]
        
        posts = []
        for post_data in posts_data:
            post = Post(**post_data)
            session.add(post)
            posts.append(post)
        
        session.flush()
        
        # 5. 为文章添加标签
        print("为文章添加标签...")
        post_tag_relations = [
            (posts[0], [tags[0], tags[4], tags[9]]),  # Python, Node.js, 后端
            (posts[1], [tags[1], tags[2], tags[8]]),  # JavaScript, React, 前端
            (posts[2], [tags[5], tags[7], tags[9]]),  # 数据库, 设计模式, 后端
        ]
        
        for post, post_tags in post_tag_relations:
            post.tags.extend(post_tags)
        
        # 6. 创建评论
        print("创建评论...")
        comments_data = [
            {
                "content": "这篇文章写得很好，对我帮助很大！特别是关于FastAPI的部分，讲解得很详细。",
                "author_name": "王五",
                "author_email": "wangwu@example.com",
                "is_approved": True,
                "like_count": 5,
                "post_id": posts[0].id,
                "created_at": datetime.now() - timedelta(days=4)
            },
            {
                "content": "感谢分享！我也在学习Python Web开发，这些最佳实践很实用。",
                "author_id": users[2].id,
                "is_approved": True,
                "like_count": 3,
                "post_id": posts[0].id,
                "created_at": datetime.now() - timedelta(days=3)
            },
            {
                "content": "React Hooks确实是个很棒的特性，让函数组件变得更加强大。",
                "author_name": "赵六",
                "author_email": "zhaoliu@example.com",
                "is_approved": True,
                "like_count": 8,
                "post_id": posts[1].id,
                "created_at": datetime.now() - timedelta(days=2)
            }
        ]
        
        for comment_data in comments_data:
            comment = Comment(**comment_data)
            session.add(comment)
        
        # 7. 更新统计数据
        print("更新统计数据...")
        for category in categories:
            category.post_count = len([p for p in posts if p.category_id == category.id])
        
        for tag in tags:
            tag.post_count = len([p for p in posts if tag in p.tags])
        
        for post in posts:
            post.comment_count = len([c for c in comments_data if c.get('post_id') == post.id])
        
        # 提交事务
        session.commit()
        print("✅ 测试数据插入成功！")
        
        # 打印统计信息
        print(f"\n📊 数据统计:")
        print(f"用户数量: {len(users)}")
        print(f"分类数量: {len(categories)}")
        print(f"标签数量: {len(tags)}")
        print(f"文章数量: {len(posts)}")
        print(f"评论数量: {len(comments_data)}")
        
    except Exception as e:
        session.rollback()
        print(f"❌ 插入数据失败: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    insert_test_data()