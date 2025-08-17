-- 个人博客系统初始化数据
-- 基于服务端模型定义创建的初始化数据

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 1. 创建管理员用户
-- 密码: admin123 (已加密)
INSERT INTO users (username, email, hashed_password, full_name, bio, is_active, is_superuser, created_at, updated_at)
VALUES 
('admin', 'admin@blog.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3L6jGqJxOu', '博客管理员', '这是博客系统的管理员账户', true, true, NOW(), NOW()),
('author', 'author@blog.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3L6jGqJxOu', '文章作者', '专注于技术分享的作者', true, false, NOW(), NOW());

-- 2. 创建文章分类
INSERT INTO categories (name, slug, description, color, post_count, created_at, updated_at)
VALUES 
('技术分享', 'tech', '分享各种技术文章和教程', '#3B82F6', 0, NOW(), NOW()),
('生活随笔', 'life', '记录生活中的点点滴滴', '#10B981', 0, NOW(), NOW()),
('项目实战', 'projects', '实际项目开发经验分享', '#F59E0B', 0, NOW(), NOW()),
('学习笔记', 'notes', '学习过程中的笔记和总结', '#8B5CF6', 0, NOW(), NOW()),
('工具推荐', 'tools', '好用的开发工具和软件推荐', '#EF4444', 0, NOW(), NOW());

-- 3. 创建标签
INSERT INTO tags (name, slug, color, post_count, created_at, updated_at)
VALUES 
('Python', 'python', '#3776AB', 0, NOW(), NOW()),
('JavaScript', 'javascript', '#F7DF1E', 0, NOW(), NOW()),
('React', 'react', '#61DAFB', 0, NOW(), NOW()),
('Vue.js', 'vue', '#4FC08D', 0, NOW(), NOW()),
('Node.js', 'nodejs', '#339933', 0, NOW(), NOW()),
('Docker', 'docker', '#2496ED', 0, NOW(), NOW()),
('PostgreSQL', 'postgresql', '#336791', 0, NOW(), NOW()),
('FastAPI', 'fastapi', '#009688', 0, NOW(), NOW()),
('前端开发', 'frontend', '#FF6B6B', 0, NOW(), NOW()),
('后端开发', 'backend', '#4ECDC4', 0, NOW(), NOW()),
('全栈开发', 'fullstack', '#45B7D1', 0, NOW(), NOW()),
('数据库', 'database', '#FF9F43', 0, NOW(), NOW()),
('部署运维', 'devops', '#6C5CE7', 0, NOW(), NOW()),
('性能优化', 'performance', '#FD79A8', 0, NOW(), NOW()),
('最佳实践', 'best-practices', '#00B894', 0, NOW(), NOW());

-- 4. 创建示例文章
INSERT INTO posts (title, slug, content, excerpt, status, is_featured, view_count, like_count, comment_count, published_at, author_id, category_id, created_at, updated_at)
VALUES 
(
    '欢迎来到我的博客',
    'welcome-to-my-blog',
    '# 欢迎来到我的博客

这是我的第一篇博客文章！在这里，我将分享我在技术学习和项目开发过程中的经验和心得。

## 博客内容

这个博客将包含以下内容：

- **技术分享**：编程语言、框架、工具的使用经验
- **项目实战**：实际项目开发中遇到的问题和解决方案
- **学习笔记**：学习新技术时的笔记和总结
- **生活随笔**：工作之余的生活感悟

## 技术栈

这个博客系统使用了以下技术：

- 前端：React + Next.js + TypeScript
- 后端：Python + FastAPI
- 数据库：PostgreSQL + Redis
- 部署：Docker + Nginx

希望这个博客能够帮助到更多的开发者朋友！

欢迎大家留言交流！',
    '欢迎来到我的个人博客！这里将分享技术文章、项目经验和生活感悟。',
    'published',
    true,
    156,
    23,
    5,
    NOW(),
    1,
    1,
    NOW(),
    NOW()
),
(
    'FastAPI + PostgreSQL 构建现代化博客系统',
    'fastapi-postgresql-blog-system',
    '# FastAPI + PostgreSQL 构建现代化博客系统

在这篇文章中，我将分享如何使用 FastAPI 和 PostgreSQL 构建一个功能完整的博客系统。

## 项目架构

### 后端架构
- **FastAPI**：现代化的 Python Web 框架
- **SQLAlchemy**：ORM 框架
- **Alembic**：数据库迁移工具
- **PostgreSQL**：关系型数据库

### 前端架构
- **Next.js**：React 全栈框架
- **TypeScript**：类型安全的 JavaScript
- **Tailwind CSS**：实用优先的 CSS 框架

## 核心功能

1. **用户管理**：注册、登录、权限控制
2. **文章管理**：CRUD 操作、分类标签
3. **评论系统**：嵌套回复、审核机制
4. **搜索功能**：全文搜索、筛选排序

## 数据库设计

数据库包含以下核心表：
- users：用户表
- posts：文章表
- categories：分类表
- tags：标签表
- comments：评论表

## 部署方案

使用 Docker 容器化部署：
```bash
docker-compose up -d
```

这个项目展示了现代化 Web 开发的最佳实践！',
    '详细介绍如何使用 FastAPI 和 PostgreSQL 构建一个功能完整的现代化博客系统。',
    'published',
    true,
    89,
    12,
    3,
    NOW(),
    1,
    3,
    NOW(),
    NOW()
),
(
    'React Hooks 最佳实践指南',
    'react-hooks-best-practices',
    '# React Hooks 最佳实践指南

React Hooks 是 React 16.8 引入的新特性，它让我们可以在函数组件中使用状态和其他 React 特性。

## 常用 Hooks

### useState
```javascript
const [count, setCount] = useState(0);
```

### useEffect
```javascript
useEffect(() => {
  // 副作用逻辑
  return () => {
    // 清理逻辑
  };
}, [dependencies]);
```

### useContext
```javascript
const value = useContext(MyContext);
```

## 自定义 Hooks

创建自定义 Hooks 来复用状态逻辑：

```javascript
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(initialValue);
  
  return { count, increment, decrement, reset };
}
```

## 最佳实践

1. **合理使用依赖数组**
2. **避免在循环中使用 Hooks**
3. **使用 ESLint 插件检查 Hooks 规则**
4. **合理拆分组件和 Hooks**

掌握这些最佳实践，能让你的 React 代码更加优雅和高效！',
    '深入探讨 React Hooks 的使用方法和最佳实践，包括常用 Hooks 和自定义 Hooks 的创建。',
    'published',
    false,
    67,
    8,
    2,
    NOW(),
    2,
    1,
    NOW(),
    NOW()
),
(
    'Docker 容器化部署实践',
    'docker-containerization-deployment',
    '# Docker 容器化部署实践

Docker 是现代应用部署的标准工具，本文将介绍如何使用 Docker 进行应用容器化部署。

## Docker 基础概念

- **镜像（Image）**：应用的打包文件
- **容器（Container）**：镜像的运行实例
- **Dockerfile**：构建镜像的配置文件

## 编写 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

## Docker Compose

使用 docker-compose.yml 管理多容器应用：

```yaml
version: "3.8"
services:
  web:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
```

## 部署策略

1. **开发环境**：使用 docker-compose
2. **生产环境**：使用 Kubernetes 或 Docker Swarm
3. **CI/CD**：集成到持续部署流水线

Docker 让应用部署变得简单可靠！',
    '介绍 Docker 容器化技术的基础概念和实际部署经验，包括 Dockerfile 编写和 Docker Compose 使用。',
    'published',
    false,
    45,
    6,
    1,
    NOW(),
    1,
    3,
    NOW(),
    NOW()
),
(
    '我的编程学习之路',
    'my-programming-journey',
    '# 我的编程学习之路

回顾我的编程学习历程，从零基础到现在能够独立开发项目，这一路走来有很多感悟。

## 学习阶段

### 第一阶段：基础入门
- 学习 HTML、CSS、JavaScript
- 完成简单的静态网页项目
- 理解编程的基本概念

### 第二阶段：深入学习
- 学习 React、Vue 等前端框架
- 掌握 Node.js 后端开发
- 了解数据库和服务器知识

### 第三阶段：项目实战
- 参与开源项目
- 独立完成全栈项目
- 学习部署和运维知识

## 学习心得

1. **坚持练习**：编程需要大量的实践
2. **项目驱动**：通过项目学习更有效果
3. **社区参与**：加入技术社区，与他人交流
4. **持续学习**：技术更新很快，要保持学习

## 推荐资源

- **在线课程**：慕课网、极客时间
- **技术博客**：掘金、博客园
- **开源项目**：GitHub
- **技术书籍**：《JavaScript 高级程序设计》等

希望我的经验能够帮助到正在学习编程的朋友们！',
    '分享我从零基础到独立开发的编程学习历程，包括学习阶段、心得体会和推荐资源。',
    'published',
    false,
    78,
    15,
    7,
    NOW(),
    2,
    2,
    NOW(),
    NOW()
);

-- 5. 创建文章标签关联
INSERT INTO post_tags (post_id, tag_id)
VALUES 
-- 欢迎文章的标签
(1, 11), -- 全栈开发
(1, 15), -- 最佳实践

-- FastAPI 文章的标签
(2, 1),  -- Python
(2, 8),  -- FastAPI
(2, 7),  -- PostgreSQL
(2, 10), -- 后端开发
(2, 11), -- 全栈开发

-- React Hooks 文章的标签
(3, 2),  -- JavaScript
(3, 3),  -- React
(3, 9),  -- 前端开发
(3, 15), -- 最佳实践

-- Docker 文章的标签
(4, 6),  -- Docker
(4, 13), -- 部署运维
(4, 15), -- 最佳实践

-- 学习之路文章的标签
(5, 2),  -- JavaScript
(5, 3),  -- React
(5, 5),  -- Node.js
(5, 11); -- 全栈开发

-- 6. 创建示例评论
INSERT INTO comments (content, author_name, author_email, is_approved, like_count, post_id, created_at, updated_at)
VALUES 
('写得很好！作为新手很受启发，期待更多的技术分享文章。', '小明', 'xiaoming@example.com', true, 5, 1, NOW(), NOW()),
('博客系统的架构设计很棒，我也想学习 FastAPI，有推荐的学习资源吗？', '小红', 'xiaohong@example.com', true, 3, 2, NOW(), NOW()),
('React Hooks 确实很强大，这篇文章总结得很全面，收藏了！', '小李', 'xiaoli@example.com', true, 2, 3, NOW(), NOW()),
('Docker 部署确实方便，我们公司也在推广容器化，感谢分享！', '小王', 'xiaowang@example.com', true, 4, 4, NOW(), NOW()),
('很励志的学习经历，我也是自学编程的，一起加油！', '小张', 'xiaozhang@example.com', true, 6, 5, NOW(), NOW());

-- 7. 创建嵌套回复评论
INSERT INTO comments (content, author_name, author_email, is_approved, like_count, post_id, parent_id, created_at, updated_at)
VALUES 
('谢谢支持！我会继续努力分享更多有价值的内容。', '博主', 'admin@blog.com', true, 2, 1, 1, NOW(), NOW()),
('推荐官方文档和《FastAPI实战》这本书，很适合入门。', '博主', 'admin@blog.com', true, 1, 2, 2, NOW(), NOW());

-- 8. 更新分类和标签的文章数量
UPDATE categories SET post_count = (
    SELECT COUNT(*) FROM posts WHERE category_id = categories.id AND status = 'published'
);

UPDATE tags SET post_count = (
    SELECT COUNT(*) FROM post_tags WHERE tag_id = tags.id
);

-- 9. 更新文章的评论数量
UPDATE posts SET comment_count = (
    SELECT COUNT(*) FROM comments WHERE post_id = posts.id AND is_approved = true
);

-- 10. 创建配置分组
INSERT INTO config_groups (group_key, group_name, category, icon_name, color_scheme, description, display_order, is_active, created_at, updated_at)
VALUES 
('site_info', '站点信息', 'site_basic', 'info', 'blue', '网站基本信息配置', 1, true, NOW(), NOW()),
('site_appearance', '外观设置', 'site_appearance', 'palette', 'purple', '网站外观和主题配置', 2, true, NOW(), NOW()),
('contact_info', '联系方式', 'contact', 'contact', 'green', '联系方式和社交媒体配置', 3, true, NOW(), NOW()),
('seo_settings', 'SEO设置', 'seo', 'search', 'orange', '搜索引擎优化相关配置', 4, true, NOW(), NOW()),
('comment_settings', '评论设置', 'comment', 'message', 'red', '评论系统相关配置', 5, true, NOW(), NOW());

-- 11. 创建博客配置项
INSERT INTO blog_configs (config_key, config_value, default_value, category, group_key, data_type, display_name, description, placeholder, help_text, is_required, is_public, sort_order, created_at, updated_at)
VALUES 
-- 站点信息配置
('site_title', '我的技术博客', '我的博客', 'site_basic', 'site_info', 'string', '网站标题', '显示在浏览器标题栏和网站头部的标题', '请输入网站标题', '建议不超过30个字符', true, true, 1, NOW(), NOW()),
('site_subtitle', '分享技术与生活', '个人博客', 'site_basic', 'site_info', 'string', '网站副标题', '网站的副标题或标语', '请输入网站副标题', '简短的描述网站主题', false, true, 2, NOW(), NOW()),
('site_description', '这是一个专注于技术分享的个人博客，记录学习过程中的心得体会和项目实战经验。', '个人技术博客', 'site_basic', 'site_info', 'text', '网站描述', '网站的详细描述，用于SEO', '请输入网站描述', '详细描述网站内容和特色，有助于搜索引擎收录', true, true, 3, NOW(), NOW()),
('site_keywords', '技术博客,编程,Python,JavaScript,React,FastAPI', '博客,技术,编程', 'site_basic', 'site_info', 'string', '网站关键词', '网站关键词，用逗号分隔', '请输入关键词，用逗号分隔', '有助于搜索引擎优化，建议3-5个核心关键词', false, true, 4, NOW(), NOW()),
('site_logo', '', '', 'site_appearance', 'site_appearance', 'image', '网站Logo', '网站的Logo图片', '请上传Logo图片', '建议尺寸：200x60像素，支持PNG、JPG格式', false, true, 1, NOW(), NOW()),
('site_favicon', '', '', 'site_appearance', 'site_appearance', 'image', '网站图标', '浏览器标签页显示的小图标', '请上传Favicon图片', '建议尺寸：32x32像素，ICO或PNG格式', false, true, 2, NOW(), NOW()),

-- 联系方式配置
('contact_email', 'admin@blog.com', '', 'contact', 'contact_info', 'email', '联系邮箱', '网站联系邮箱地址', '请输入邮箱地址', '用于接收用户反馈和联系', false, true, 1, NOW(), NOW()),
('github_url', 'https://github.com', '', 'social', 'contact_info', 'url', 'GitHub链接', 'GitHub个人主页链接', '请输入GitHub链接', '展示在网站底部的社交媒体链接', false, true, 2, NOW(), NOW()),
('twitter_url', '', '', 'social', 'contact_info', 'url', 'Twitter链接', 'Twitter个人主页链接', '请输入Twitter链接', '展示在网站底部的社交媒体链接', false, true, 3, NOW(), NOW()),

-- SEO配置
('google_analytics', '', '', 'seo', 'seo_settings', 'string', 'Google Analytics ID', 'Google Analytics跟踪ID', '请输入GA跟踪ID', '格式如：G-XXXXXXXXXX', false, false, 1, NOW(), NOW()),
('baidu_analytics', '', '', 'seo', 'seo_settings', 'string', '百度统计代码', '百度统计跟踪代码', '请输入百度统计代码', '从百度统计后台获取的跟踪代码', false, false, 2, NOW(), NOW()),

-- 评论设置
('comment_enabled', 'true', 'true', 'comment', 'comment_settings', 'boolean', '启用评论', '是否开启评论功能', '', '关闭后所有文章都不能评论', false, true, 1, NOW(), NOW()),
('comment_approval', 'true', 'false', 'comment', 'comment_settings', 'boolean', '评论审核', '新评论是否需要审核', '', '开启后新评论需要管理员审核才能显示', false, true, 2, NOW(), NOW()),
('comment_guest_allowed', 'true', 'true', 'comment', 'comment_settings', 'boolean', '允许游客评论', '是否允许未注册用户评论', '', '关闭后只有注册用户才能评论', false, true, 3, NOW(), NOW());

-- 插入配置缓存（示例）
INSERT INTO config_caches (cache_key, cache_data, category, expires_at, created_at, updated_at)
VALUES 
('site_basic_configs', '{"site_title":"我的技术博客","site_subtitle":"分享技术与生活","site_description":"这是一个专注于技术分享的个人博客"}', 'site_basic', NOW() + INTERVAL '1 hour', NOW(), NOW()),
('public_configs', '{"site_title":"我的技术博客","site_subtitle":"分享技术与生活","contact_email":"admin@blog.com"}', 'public', NOW() + INTERVAL '1 hour', NOW(), NOW());

-- 完成初始化
SELECT 'Database initialization completed successfully!' as message;