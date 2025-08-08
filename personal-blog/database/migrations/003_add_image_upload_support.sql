-- 003_add_image_upload_support.sql
-- 为网站logo和favicon添加文件上传支持

-- 步骤1: 添加新的数据类型枚举值
-- 注意：PostgreSQL要求新枚举值在单独事务中提交
ALTER TYPE configdatatype ADD VALUE IF NOT EXISTS 'BINARY';

-- 验证枚举值已添加
SELECT unnest(enum_range(NULL::configdatatype)) as available_types;
