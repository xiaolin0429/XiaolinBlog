-- 修复网站配置键名不匹配问题
-- 统一配置项键名，移除重复项

-- 1. 删除重复的配置项（保留 basic 分类的配置项）
DELETE FROM site_configs WHERE key = 'other_copyright' AND category = 'OTHER';
DELETE FROM site_configs WHERE key = 'other_icp' AND category = 'OTHER';
DELETE FROM site_configs WHERE key = 'other_public_security' AND category = 'OTHER';

-- 2. 确保所有基础配置项都存在且键名正确
-- 如果不存在则插入，存在则更新键名

-- 网站标题
INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_title', COALESCE((SELECT value FROM site_configs WHERE key = 'site_title' LIMIT 1), '我的博客'), 'BASIC', '网站标题', 'STRING', 'true', 1
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_title');

-- 网站副标题
INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_subtitle', COALESCE((SELECT value FROM site_configs WHERE key = 'site_subtitle' LIMIT 1), '分享技术与生活'), 'BASIC', '网站副标题', 'STRING', 'true', 2
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_subtitle');

-- 网站描述
INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_description', COALESCE((SELECT value FROM site_configs WHERE key = 'site_description' LIMIT 1), '这是一个个人技术博客'), 'BASIC', '网站描述', 'STRING', 'true', 3
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_description');

-- 网站Logo
INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_logo', COALESCE((SELECT value FROM site_configs WHERE key = 'site_logo' LIMIT 1), ''), 'BASIC', '网站Logo', 'URL', 'true', 4
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_logo');

-- 网站图标
INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_favicon', COALESCE((SELECT value FROM site_configs WHERE key = 'site_favicon' LIMIT 1), ''), 'BASIC', '网站图标', 'URL', 'true', 5
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_favicon');

-- 网站语言
INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_language', COALESCE((SELECT value FROM site_configs WHERE key = 'site_language' LIMIT 1), 'zh-CN'), 'BASIC', '网站语言', 'STRING', 'true', 6
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_language');

-- 时区设置
INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_timezone', COALESCE((SELECT value FROM site_configs WHERE key = 'site_timezone' LIMIT 1), 'Asia/Shanghai'), 'BASIC', '时区设置', 'STRING', 'true', 7
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_timezone');

-- 版权信息
INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_copyright', COALESCE((SELECT value FROM site_configs WHERE key = 'site_copyright' LIMIT 1), '© 2024 我的博客. All rights reserved.'), 'BASIC', '版权信息', 'STRING', 'true', 8
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_copyright');

-- ICP备案号
INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_icp', COALESCE((SELECT value FROM site_configs WHERE key = 'site_icp' LIMIT 1), ''), 'BASIC', 'ICP备案号', 'STRING', 'true', 9
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_icp');

-- 公安备案号
INSERT INTO site_configs (key, value, category, description, data_type, is_public, sort_order)
SELECT 'site_public_security', COALESCE((SELECT value FROM site_configs WHERE key = 'site_public_security' LIMIT 1), ''), 'BASIC', '公安备案号', 'STRING', 'true', 10
WHERE NOT EXISTS (SELECT 1 FROM site_configs WHERE key = 'site_public_security');

-- 3. 更新排序顺序，确保配置项按逻辑顺序排列
UPDATE site_configs SET sort_order = 1 WHERE key = 'site_title' AND category = 'BASIC';
UPDATE site_configs SET sort_order = 2 WHERE key = 'site_subtitle' AND category = 'BASIC';
UPDATE site_configs SET sort_order = 3 WHERE key = 'site_description' AND category = 'BASIC';
UPDATE site_configs SET sort_order = 4 WHERE key = 'site_logo' AND category = 'BASIC';
UPDATE site_configs SET sort_order = 5 WHERE key = 'site_favicon' AND category = 'BASIC';
UPDATE site_configs SET sort_order = 6 WHERE key = 'site_language' AND category = 'BASIC';
UPDATE site_configs SET sort_order = 7 WHERE key = 'site_timezone' AND category = 'BASIC';
UPDATE site_configs SET sort_order = 8 WHERE key = 'site_copyright' AND category = 'BASIC';
UPDATE site_configs SET sort_order = 9 WHERE key = 'site_icp' AND category = 'BASIC';
UPDATE site_configs SET sort_order = 10 WHERE key = 'site_public_security' AND category = 'BASIC';

-- 4. 确保数据类型正确
UPDATE site_configs SET data_type = 'STRING' WHERE key IN ('site_title', 'site_subtitle', 'site_description', 'site_language', 'site_timezone', 'site_copyright', 'site_icp', 'site_public_security');
UPDATE site_configs SET data_type = 'URL' WHERE key IN ('site_logo', 'site_favicon');

-- 5. 清理其他可能的重复或无效配置项
DELETE FROM site_configs WHERE key IS NULL OR key = '';
DELETE FROM site_configs WHERE category = 'OTHER' AND key IN ('other_notice') AND value = '';
