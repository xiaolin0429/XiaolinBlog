-- 003b_update_image_configs.sql
-- 更新网站logo和favicon配置项

-- 开始事务
BEGIN;

-- 1. 修改site_logo和site_favicon的数据类型为BINARY，用于存储图片文件
UPDATE site_configs SET data_type = 'BINARY' WHERE key IN ('site_logo', 'site_favicon');

-- 2. 为图片存储添加额外的元数据字段（通过JSON格式存储在value字段中）
-- 图片数据将以JSON格式存储：
-- {
--   "filename": "original_filename.png",
--   "content_type": "image/png", 
--   "size": 12345,
--   "data": "base64_encoded_image_data",
--   "upload_time": "2025-01-01T00:00:00Z"
-- }

-- 3. 更新现有的空值为合适的默认JSON结构
UPDATE site_configs 
SET value = '{"filename": "", "content_type": "", "size": 0, "data": "", "upload_time": ""}'
WHERE key IN ('site_logo', 'site_favicon') AND (value IS NULL OR value = '');

-- 4. 更新配置项描述
UPDATE site_configs 
SET description = '网站Logo图片文件，支持PNG、JPG、GIF格式，建议尺寸200x60像素'
WHERE key = 'site_logo';

UPDATE site_configs 
SET description = '网站Favicon图标文件，支持ICO、PNG格式，建议尺寸32x32像素'
WHERE key = 'site_favicon';

-- 提交事务
COMMIT;

-- 验证更改
SELECT key, data_type, description, 
       CASE 
         WHEN LENGTH(value) > 100 THEN CONCAT(LEFT(value, 100), '...')
         ELSE value 
       END as value_preview
FROM site_configs 
WHERE key IN ('site_logo', 'site_favicon');