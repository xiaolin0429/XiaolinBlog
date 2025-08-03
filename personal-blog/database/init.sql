-- 个人博客系统数据库初始化脚本
-- 创建数据库和用户（如果不存在）

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 创建全文搜索配置（用于中文搜索）
-- 这里使用简单的配置，实际项目中可能需要更复杂的中文分词
CREATE TEXT SEARCH CONFIGURATION chinese (COPY = simple);

-- 插入一些初始数据（可选）
-- 这些数据将在应用启动后通过API或管理界面添加

-- 创建索引以提高查询性能
-- 这些索引将在迁移文件中创建，这里只是注释说明

-- 用户表索引
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users(username);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 文章表索引
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_status ON posts(status);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_published_at ON posts(published_at);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_author_id ON posts(author_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_category_id ON posts(category_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_title_gin ON posts USING gin(to_tsvector('chinese', title));
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_content_gin ON posts USING gin(to_tsvector('chinese', content));

-- 评论表索引
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_id ON comments(post_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_author_id ON comments(author_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- 设置数据库参数
ALTER DATABASE blog_db SET timezone TO 'Asia/Shanghai';